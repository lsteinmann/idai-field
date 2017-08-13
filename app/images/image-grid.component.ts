import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Datastore, Query} from 'idai-components-2/datastore';
import {Imagestore} from '../imagestore/imagestore';
import {Messages} from 'idai-components-2/messages';
import {PersistenceManager} from 'idai-components-2/persist';
import {ImageGridBuilder} from '../common/image-grid-builder';
import {ImageTool} from './image-tool';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LinkModalComponent} from './link-modal.component';
import {ElementRef} from '@angular/core';
import {SettingsService} from '../settings/settings-service';
import {M} from '../m';
import {Util} from "../util/util";

@Component({
    moduleId: module.id,
    templateUrl: './image-grid.html'
})

/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ImageGridComponent {

    private imageGridBuilder : ImageGridBuilder;
    private imageTool : ImageTool;

    private query : Query;
    private documents: IdaiFieldImageDocument[];

    private nrOfColumns = 4;
    private rows = [];
    private selected: IdaiFieldImageDocument[] = [];
    private resourceIdentifiers: string[] = [];

    public constructor(
        private router: Router,
        private datastore: Datastore,
        private modalService: NgbModal,
        private messages: Messages,
        private imagestore: Imagestore,
        private persistenceManager: PersistenceManager,
        private el: ElementRef,
        private settingsService: SettingsService
    ) {
        this.imageTool = new ImageTool();
        this.imageGridBuilder = new ImageGridBuilder(imagestore, true);

        this.fetchDocuments(this.query);
    }

    public refreshGrid() {

        this.fetchDocuments(this.query);
    }

    public showUploadErrorMsg(msgWithParams) {

        this.messages.add(msgWithParams);
    }

    public queryChanged(query: Query) {

        this.query = query;
        this.fetchDocuments(query);
    }

    public onResize() {

        this.calcGrid();
    }

    public getIdentifier(id: string): string {

        return this.resourceIdentifiers[id];
    }

    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {

        if (this.selected.indexOf(document) == -1) this.selected.push(document);
        else this.selected.splice(this.selected.indexOf(document), 1);
    }

    /**
     * @param documentToSelect the object that should be navigated to if the preconditions
     *   to change the selection are met.
     */
    public navigateTo(documentToSelect: IdaiFieldImageDocument) {

        this.router.navigate(['images', documentToSelect.resource.id, 'show']);
    }

    public clearSelection() {

        this.selected = [];
    }

    public openDeleteModal(modal) {

        this.modalService.open(modal).result.then(result => {
            if (result == 'delete') this.deleteSelected();
        });
    }

    public openLinkModal() {

        this.modalService.open(LinkModalComponent).result.then( (targetDoc: IdaiFieldDocument) => {
            if (targetDoc) {
                this.updateAndPersistDepictsRelations(this.selected, targetDoc)
                    .then(() => {
                        this.clearSelection();
                    }).catch(msgWithParams => {
                        this.messages.add(msgWithParams);
                    });
            }
        }, (closeReason) => {
        });
    }

    private deleteSelected() {

        this.deleteImageDocuments(this.selected).then(
            () => {
                this.clearSelection();
                this.fetchDocuments(this.query);
            });
    }

    private deleteImageDocuments(documents: Array<IdaiFieldImageDocument>): Promise<any> {
        
        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let document of documents) {
                promise = promise.then(
                    () => this.imagestore.remove(document.resource.id),
                    msgWithParams => reject(msgWithParams)
                ).then(
                    () => this.persistenceManager.remove(document, this.settingsService.getUsername(), [document]),
                    err => reject([M.IMAGESTORE_ERROR_DELETE, document.resource.identifier])
                )
            }

            promise.then(
                () => resolve(),
                msgWithParams => reject(msgWithParams)
            );
        });
    }

    private updateAndPersistDepictsRelations(imageDocuments: Array<IdaiFieldImageDocument>,
                 target: IdaiFieldDocument): Promise<any> {

        this.resourceIdentifiers[target.resource.id] = target.resource.identifier;

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = Promise.resolve();
            for (let imageDocument of imageDocuments) {
                this.persistOne(promise, imageDocument, target, reject);
            }
            promise.then(() => resolve(), msgWithParams => reject(msgWithParams));
        });
    }

    private persistOne(promise, imageDocument, target, reject) {

        const oldVersion = JSON.parse(JSON.stringify(imageDocument));
        let depicts = Util.takeOrMake(imageDocument, 'resource.relations.depicts', []);

        if (depicts.indexOf(target.resource.id) == -1) {
            depicts.push(target.resource.id);
        }

        promise = promise.then(
            () => this.persistenceManager.persist(imageDocument, this.settingsService.getUsername(),
                [oldVersion]),
            msgWithParams => reject(msgWithParams)
        );
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    private fetchDocuments(query: Query) {

        this.query = query ? query : { };
        this.query.constraints = { 'resource.relations.isRecordedIn': 'images'};

        return this.datastore.find(query).then(documents => {
            this.documents = documents as IdaiFieldImageDocument[];

            ImageGridComponent.insertStub(this.documents);
            this.cacheIdsOfConnectedResources(documents);
            this.calcGrid();

        }).catch(errWithParams => {
            console.log("ERROR with find using query",this.query);
            if (errWithParams.length == 2) console.error("Cause: ",errWithParams[1]);
        });
    }

    // insert stub document for first cell that will act as drop area for uploading images
    private static insertStub(documents) {

        documents.unshift(<IdaiFieldImageDocument> {
            id: 'droparea',
            resource: { identifier: '', shortDescription:'', type: '',
                width: 1, height: 1, filename: '', relations: { } }
        });
    }

    private cacheIdsOfConnectedResources(documents) {

        for (let doc of documents) {
            if (doc.resource.relations['depicts'] && doc.resource.relations['depicts'].constructor === Array)
                for (let resourceId of doc.resource.relations['depicts']) {
                    this.datastore.get(resourceId).then(result => {
                        this.resourceIdentifiers[resourceId] = result.resource.identifier;
                    });
                }
        }
    }

    private calcGrid() {

        this.rows = [];
        this.imageGridBuilder.calcGrid(
            this.documents,this.nrOfColumns, this.el.nativeElement.children[0].clientWidth).then(result=>{
            this.rows = result['rows'];
            for (let msgWithParams of result['msgsWithParams']) {
                this.messages.add(msgWithParams);
            }
        });
    }
}
