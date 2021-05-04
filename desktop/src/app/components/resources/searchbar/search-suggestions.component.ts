import {Component, Input, OnChanges, Renderer2, SimpleChanges} from '@angular/core';
import {Datastore, FieldDocument} from 'idai-field-core';
import {RoutingService} from '../../routing-service';
import {ResourcesSearchBarComponent} from './resources-search-bar.component';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {Query} from 'idai-field-core';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {ProjectCategories} from '../../../core/configuration/project-categories';

@Component({
    selector: 'search-suggestions',
    templateUrl: './search-suggestions.html'
})

/**
 * @author Thomas Kleinke
 */
export class SearchSuggestionsComponent implements OnChanges {

    @Input() maxSuggestions: number;
    @Input() visible: boolean;

    public selectedSuggestion: FieldDocument|undefined;

    public suggestedDocuments: Array<FieldDocument> = [];
    private documentsFound: boolean;
    private stopListeningToKeyDownEvents: Function|undefined;


    constructor(private routingService: RoutingService,
                private datastore: Datastore,
                private viewFacade: ViewFacade,
                private resourcesSearchBarComponent: ResourcesSearchBarComponent,
                private renderer: Renderer2,
                private projectConfiguration: ProjectConfiguration) {

        this.viewFacade.populateDocumentsNotifications().subscribe(async documents => {
            this.documentsFound = documents.length > 0;
            await this.updateSuggestions();
        });
    }


    async ngOnChanges(changes: SimpleChanges) {

        if (changes['visible']) {
            this.toggleEventListener();
            await this.updateSuggestions();
        }
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') return this.close();
        if (!this.visible || this.suggestedDocuments.length === 0) return;

        switch (event.key) {
            case 'ArrowDown':
                this.selectNextSuggestion();
                break;
            case 'ArrowUp':
                this.selectPreviousSuggestion();
                break;
            case 'Enter':
                if (this.selectedSuggestion) await this.jumpToDocument(this.selectedSuggestion);
                break;
        }
    }


    public async jumpToDocument(document: FieldDocument) {

        await this.viewFacade.setSearchString('', false);
        await this.routingService.jumpToResource(document);
    }


    public isSuggestionBoxVisible(): boolean {

        return this.visible && !this.documentsFound
            && (this.viewFacade.getSearchString().length > 0 || this.viewFacade.getFilterCategories().length > 0);
    }


    private toggleEventListener() {

        if (this.visible && !this.stopListeningToKeyDownEvents) {
            this.stopListeningToKeyDownEvents = this.renderer.listen(
                'window', 'keydown', this.onKeyDown.bind(this)
            );
        } else if (this.stopListeningToKeyDownEvents) {
            this.stopListeningToKeyDownEvents();
            this.stopListeningToKeyDownEvents = undefined;
        }
    }


    private async updateSuggestions() {

        if ((this.viewFacade.getSearchString().length === 0 && this.viewFacade.getFilterCategories().length === 0)
                || this.documentsFound) {
            return this.suggestedDocuments = [];
        }

        this.suggestedDocuments = (await this.datastore.find(this.makeQuery())).documents as Array<FieldDocument>;
        this.selectedSuggestion = undefined;
    }


    private makeQuery(): Query {

        return {
            q: this.viewFacade.getSearchString(),
            categories: this.getCategories(),
            constraints: this.viewFacade.getCustomConstraints(),
            limit: this.maxSuggestions
        };
    }


    private getCategories(): string[]|undefined {

        return this.viewFacade.getFilterCategories().length > 0
            ? this.viewFacade.getFilterCategories()
            : this.viewFacade.isInTypesManagement()
                ? ProjectCategories.getTypeCategoryNames()
                : ProjectCategories.getConcreteFieldCategoryNames(this.projectConfiguration.getCategoryForest());
    }


    private selectNextSuggestion() {

        if (!this.selectedSuggestion) {
            this.selectedSuggestion = this.suggestedDocuments[0];
            return;
        }

        const index: number = this.suggestedDocuments.indexOf(this.selectedSuggestion) + 1;
        this.selectedSuggestion = index < this.suggestedDocuments.length
            ? this.suggestedDocuments[index]
            : this.suggestedDocuments[0];
    }


    private selectPreviousSuggestion() {

        if (!this.selectedSuggestion) {
            this.selectedSuggestion = this.suggestedDocuments[this.suggestedDocuments.length - 1];
            return;
        }

        const index: number = this.suggestedDocuments.indexOf(this.selectedSuggestion) - 1;
        this.selectedSuggestion = index >= 0
            ? this.suggestedDocuments[index]
            : this.suggestedDocuments[this.suggestedDocuments.length - 1];
    }


    private close() {

        this.resourcesSearchBarComponent.suggestionsVisible = false;
        this.resourcesSearchBarComponent.blur();
    }
}
