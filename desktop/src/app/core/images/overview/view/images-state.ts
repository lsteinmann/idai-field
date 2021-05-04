import {Injectable} from '@angular/core';
import {Query} from 'idai-field-core';
import {ProjectCategories} from '../../../configuration/project-categories';
import {ProjectConfiguration} from '../../../configuration/project-configuration';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ImagesState {

    private query: Query;
    private customConstraints: { [name: string]: string } = {};
    private gridSize: number = 4;
    private expandAllGroups: boolean = false;


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public getQuery(): Query {

        return this.query;
    }


    public setQuery(query: Query) {

        this.query = query;
    }


    public getCustomConstraints(): { [name: string]: string } {

        return this.customConstraints;
    }


    public setCustomConstraints(customConstraints: { [name: string]: string }) {

        this.customConstraints = customConstraints;
    }


    public getNrImagesPerRow(): number {

        return this.gridSize;
    }


    public setNrImagesPerRow(value: number) {

        this.gridSize = value;
    }


    public getExpandAllGroups(): boolean {

        return this.expandAllGroups;
    }


    public setExpandAllGroups(expandAllGroups: boolean) {

        this.expandAllGroups = expandAllGroups;
    }


    public resetForE2E() {

        if (this.query) {
            this.query.q = '';
            this.query.categories = ProjectCategories.getImageCategoryNames(this.projectConfiguration.getCategoryForest());
        }

        this.customConstraints = {};
        this.gridSize = 4;
        this.expandAllGroups = false;
    }
}
