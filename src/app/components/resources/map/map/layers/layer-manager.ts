import {Injectable} from '@angular/core';
import {flatten, set, subtract, to} from 'tsfun';
import {FieldDocument, ImageDocument, Document} from 'idai-components-2';
import {ImageReadDatastore} from '../../../../../core/datastore/field/image-read-datastore';
import {ViewFacade} from '../../../../../core/resources/view/view-facade';
import {FieldReadDatastore} from '../../../../../core/datastore/field/field-read-datastore';
import {ImageRelations} from '../../../../../core/model/relation-constants';
import {RelationsManager} from '../../../../../core/model/relations-manager';
import {clone} from '../../../../../core/util/object-util';
import {moveInArray} from '../../../../../core/util/utils';


export interface LayersInitializationResult {

    layerGroups: Array<LayerGroup>,
    activeLayersChange: ListDiffResult
}

export interface LayerGroup {

    document: FieldDocument,
    layers: Array<ImageDocument>,
}

export interface ListDiffResult {

    added: Array<string>,
    removed: Array<string>
}


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerManager {

    private layerGroups: Array<LayerGroup> = [];
    private activeLayerIds: string[] = [];

    private layerGroupInEditing: LayerGroup|undefined;
    private originalLayerGroupInEditing: LayerGroup|undefined;


    constructor(private imageDatastore: ImageReadDatastore,
                private fieldDatastore: FieldReadDatastore,
                private viewFacade: ViewFacade,
                private relationsManager: RelationsManager) {}


    public reset = () => this.activeLayerIds = [];

    public isActiveLayer = (resourceId: string) => this.activeLayerIds.includes(resourceId);

    public getLayerGroups = () => this.layerGroups;

    public getLayers = () => flatten(this.layerGroups.map(layerGroup => layerGroup.layers));

    public isInEditing = (group: LayerGroup) => group === this.layerGroupInEditing;


    public async initializeLayers(reloadLayerGroups: boolean = true): Promise<ListDiffResult> {

        await this.removeNonExistingLayers();

        const activeLayersChange = LayerManager.computeActiveLayersChange(
            this.viewFacade.getActiveLayersIds(),
            this.activeLayerIds);

        this.activeLayerIds = this.viewFacade.getActiveLayersIds();
        
        try {
            if (reloadLayerGroups) this.layerGroups = await this.createLayerGroups();
        } catch(err) {
            console.error('Error while trying to create layer groups', err);
            throw undefined;
        }

        return activeLayersChange;
    }


    public toggleLayer(resourceId: string) {

        this.activeLayerIds = this.isActiveLayer(resourceId) ?
            subtract([resourceId])(this.activeLayerIds) :
            set(this.activeLayerIds.concat([resourceId]));

        this.viewFacade.setActiveLayersIds(this.activeLayerIds);
    }


    public deactivateRemovedLayers(document: FieldDocument) {

        const group: LayerGroup = this.layerGroups.find(layerGroup => {
            return layerGroup.document.resource.id === document.resource.id
        });
        if (!group) return;

        const layersToRemoveIds: string[] = group.layers.filter(layer => {
            return this.isActiveLayer(layer.resource.id)
                && !document.resource.relations[ImageRelations.HASMAPLAYER]?.includes(layer.resource.id);
        }).map(to('resource.id'));
        
        this.viewFacade.setActiveLayersIds(subtract(layersToRemoveIds)(this.activeLayerIds));
    }


    public async startEditing(group: LayerGroup) {

        this.layerGroupInEditing = clone(group);
        this.originalLayerGroupInEditing = group;

        this.layerGroups[this.layerGroups.indexOf(group)] = this.layerGroupInEditing;
    }


    public async finishEditing() {

        if (!this.layerGroupInEditing) return;

        await this.relationsManager.update(
            this.layerGroupInEditing.document,
            clone(this.originalLayerGroupInEditing.document)
        );

        this.layerGroupInEditing.document = this.originalLayerGroupInEditing.document;
        this.layerGroupInEditing = undefined;
        this.originalLayerGroupInEditing = undefined;
    }


    public async abortEditing() {

        if (!this.layerGroupInEditing) return;

        const relations: string[]
            = this.originalLayerGroupInEditing.document.resource.relations[ImageRelations.HASMAPLAYER] || [];
        this.viewFacade.setActiveLayersIds(this.activeLayerIds.filter(id => relations.includes(id)));

        this.layerGroups[this.layerGroups.indexOf(this.layerGroupInEditing)] = this.originalLayerGroupInEditing;
        this.layerGroupInEditing = undefined;
        this.originalLayerGroupInEditing = undefined;
    }


    public async addLayers(newLayers: Array<ImageDocument>) {

        if (!this.layerGroupInEditing) return;

        const layerIds: string[] = this.layerGroupInEditing.document.resource.relations[ImageRelations.HASMAPLAYER] || [];
        const newLayerIds: string[] = newLayers.map(layer => layer.resource.id);
        this.layerGroupInEditing.layers = this.layerGroupInEditing.layers.concat(newLayers);
        this.layerGroupInEditing.document.resource.relations[ImageRelations.HASMAPLAYER] = layerIds.concat(newLayerIds);
    }


    public async removeLayer(layerToRemove: ImageDocument) {

        if (!this.layerGroupInEditing) return;

        this.layerGroupInEditing.document.resource.relations[ImageRelations.HASMAPLAYER]
            = this.layerGroupInEditing.document.resource.relations[ImageRelations.HASMAPLAYER].filter(id => {
                return id !== layerToRemove.resource.id;
            });
        this.layerGroupInEditing.layers = this.layerGroupInEditing.layers.filter(layer => layer !== layerToRemove);

        if (this.isActiveLayer(layerToRemove.resource.id)) {
            this.viewFacade.setActiveLayersIds(subtract([layerToRemove.resource.id])(this.activeLayerIds));
        }
    }


    public async changeOrder(originalIndex: number, targetIndex: number) {

        if (!this.layerGroupInEditing) return;

        const relations: string[] = this.layerGroupInEditing.document.resource.relations[ImageRelations.HASMAPLAYER];

        moveInArray(this.layerGroupInEditing.layers, originalIndex, targetIndex);
        moveInArray(relations, originalIndex, targetIndex);
    }


    private async removeNonExistingLayers() {

        const newActiveLayersIds = this.viewFacade.getActiveLayersIds();

        let i = newActiveLayersIds.length;
        while (i--) {
            try {
                await this.imageDatastore.get(newActiveLayersIds[i])
            } catch (_) {
                newActiveLayersIds.splice(i, 1);
                this.viewFacade.setActiveLayersIds(newActiveLayersIds);
            }
        }
    }


    private async createLayerGroups(): Promise<Array<LayerGroup>> {

        const layerGroups: Array<LayerGroup> = [];

        const currentOperation: FieldDocument|undefined = this.viewFacade.getCurrentOperation();
        if (currentOperation) layerGroups.push(await this.createLayerGroup(currentOperation));

        const projectGroup: LayerGroup = await this.createLayerGroup(await this.fieldDatastore.get('project'));
        if (projectGroup.layers.length > 0 || layerGroups.length === 0) layerGroups.push(projectGroup);

        return layerGroups;
    }


    private async createLayerGroup(document: FieldDocument): Promise<LayerGroup> {

        return {
            document: document,
            layers: await this.fetchLinkedLayers(document)
        };
    }


    private async fetchLinkedLayers(document: FieldDocument): Promise<Array<ImageDocument>> {

        return Document.hasRelations(document, ImageRelations.HASMAPLAYER)
            ? await this.imageDatastore.getMultiple(document.resource.relations[ImageRelations.HASMAPLAYER])
            : [];
    }


    private static computeActiveLayersChange(newActiveLayerIds: string[],
                                             oldActiveLayerIds: string[]): ListDiffResult {

        return {
            removed: subtract(newActiveLayerIds)(oldActiveLayerIds),
            added: subtract(oldActiveLayerIds)(newActiveLayerIds)
        };
    }
}
