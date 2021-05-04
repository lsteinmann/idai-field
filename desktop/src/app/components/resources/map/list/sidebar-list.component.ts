import { AfterViewInit, Component, ElementRef, ViewChild, Input, OnChanges } from '@angular/core';
import { to } from 'tsfun';
import { FieldDocument } from 'idai-field-core';
import { ResourcesComponent } from '../../resources.component';
import { Loading } from '../../../widgets/loading';
import { BaseList } from '../../base-list';
import { ContextMenuAction } from '../../widgets/context-menu.component';
import { ViewFacade } from '../../../../core/resources/view/view-facade';
import { NavigationService } from '../../../../core/resources/navigation/navigation-service';
import { ContextMenu } from '../../widgets/context-menu';
import { MenuContext, MenuService } from '../../../menu-service';


@Component({
    selector: 'sidebar-list',
    templateUrl: './sidebar-list.html',
    host: {
        '(window:contextmenu)': 'handleClick($event, true)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SidebarListComponent extends BaseList implements AfterViewInit, OnChanges {

    @Input() selectedDocument: FieldDocument;

    @ViewChild('sidebar', { static: false }) sidebarElement: ElementRef;

    public contextMenu: ContextMenu = new ContextMenu();

    private lastSelectedDocument: FieldDocument|undefined;


    constructor(private navigationService: NavigationService,
                resourcesComponent: ResourcesComponent,
                loading: Loading,
                viewFacade: ViewFacade,
                menuService: MenuService) {

        super(resourcesComponent, viewFacade, loading, menuService);

        this.navigationService.moveIntoNotifications().subscribe(async () => {
            await this.viewFacade.deselect();
            this.resourcesComponent.closePopover();
        });

        resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));

        this.viewFacade.navigationPathNotifications().subscribe(() => {
            this.contextMenu.close();
            this.sidebarElement.nativeElement.focus();
        });
    }


    ngAfterViewInit() {

        this.sidebarElement.nativeElement.focus();
    }


    ngOnChanges() {

        this.resourcesComponent.additionalSelectedDocuments = [];
        this.lastSelectedDocument = undefined;
        this.scrollTo(this.selectedDocument);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            await this.viewFacade.navigateDocumentList(event.key === 'ArrowUp' ? 'previous' : 'next');
            event.preventDefault();
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            await this.resourcesComponent
                .navigatePopoverMenus(event.key === 'ArrowLeft' ? 'previous' : 'next');
            event.preventDefault();
        }

        if (event.key === 'Enter') {
            await this.openChildCollection();
            event.preventDefault();
        }

        if (event.key === 'Backspace') {
            await this.goToUpperHierarchyLevel();
            event.preventDefault();
        }
    }


    public async select(document: FieldDocument, event: MouseEvent, allowDeselection: boolean = true) {

        if (!this.lastSelectedDocument) this.lastSelectedDocument = this.selectedDocument;

        if (event.shiftKey && this.lastSelectedDocument) {
            this.selectBetween(this.lastSelectedDocument, document);
            this.lastSelectedDocument = document;
        } else if ((event.metaKey || event.ctrlKey) && this.selectedDocument && document !== this.selectedDocument) {
            this.resourcesComponent.toggleAdditionalSelected(document, allowDeselection);
            this.lastSelectedDocument = document;
        } else if (!event.metaKey && !event.ctrlKey && (allowDeselection || !this.isPartOfSelection(document))) {
            this.resourcesComponent.additionalSelectedDocuments = [];
            await this.resourcesComponent.select(document);
        }
    }


    public getSelection(): Array<FieldDocument> {

        return this.selectedDocument
            ? [this.selectedDocument].concat(this.resourcesComponent.additionalSelectedDocuments)
            : [];
    }


    public async editDocument(document: FieldDocument) {

        await this.resourcesComponent.editDocument(document);
    }


    public async performContextMenuAction(action: ContextMenuAction) {

        if (this.resourcesComponent.isPopoverMenuOpened() &&
                ['edit-geometry', 'create-polygon', 'create-line-string', 'create-point'].includes(action)) {
            this.resourcesComponent.closePopover();
        }

        if (!this.selectedDocument) return;
        this.contextMenu.close();

        switch (action) {
            case 'edit':
                await this.resourcesComponent.editDocument(this.selectedDocument);
                break;
            case 'move':
                await this.resourcesComponent.moveDocuments(this.getSelection());
                break;
            case 'delete':
                await this.resourcesComponent.deleteDocument(this.getSelection());
                break;
            case 'edit-geometry':
                await this.viewFacade.setSelectedDocument(this.selectedDocument.resource.id);
                this.menuService.setContext(MenuContext.GEOMETRY_EDIT);
                break;
            case 'create-polygon':
                await this.viewFacade.setSelectedDocument(this.selectedDocument.resource.id);
                this.resourcesComponent.createGeometry('Polygon');
                break;
            case 'create-line-string':
                await this.viewFacade.setSelectedDocument(this.selectedDocument.resource.id);
                this.resourcesComponent.createGeometry('LineString');
                break;
            case 'create-point':
                await this.viewFacade.setSelectedDocument(this.selectedDocument.resource.id);
                this.resourcesComponent.createGeometry('Point');
                break;
        }
    }


    public handleClick(event: any, rightClick: boolean = false) {

        if (!this.contextMenu.position) return;

        let target = event.target;
        let inside = false;

        do {
            if (target.id === 'context-menu'
                || (rightClick && target.id && target.id.startsWith('resource-'))) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.contextMenu.close();
    }


    public trackDocument = (index: number, item: FieldDocument) => item.resource.id;


    private selectBetween(document1: FieldDocument, document2: FieldDocument) {

        const documents: Array<FieldDocument> = this.viewFacade.getDocuments();
        const index1 = documents.indexOf(document1);
        const index2 = documents.indexOf(document2);

        for (let i = Math.min(index1, index2); i <= Math.max(index1, index2); i++) {
            const document: FieldDocument = documents[i];
            if (this.selectedDocument !== document
                    && !this.resourcesComponent.additionalSelectedDocuments.includes(document)) {
                this.resourcesComponent.additionalSelectedDocuments.push(document);
            }
        }
        this.resourcesComponent.additionalSelectedDocuments
            = this.resourcesComponent.additionalSelectedDocuments.slice();
    }


    private isPartOfSelection(document: FieldDocument): boolean {

        return document === this.selectedDocument
            || this.resourcesComponent.additionalSelectedDocuments.includes(document);
    }


    private async openChildCollection() {

        const selectedDocument = this.selectedDocument;
        if (selectedDocument) await this.navigationService.moveInto(selectedDocument);
    }


    private async goToUpperHierarchyLevel() {

        const navigationPath = this.viewFacade.getNavigationPath();
        if (!navigationPath.selectedSegmentId || navigationPath.segments.length === 0) return;

        const newSegmentIndex: number = navigationPath.segments
            .map(to(['document', 'resource', 'id']))
            .indexOf(navigationPath.selectedSegmentId) - 1;

        await this.navigationService.moveInto(
            newSegmentIndex < 0
                ? undefined
                : navigationPath.segments[newSegmentIndex].document
        );
    }
}
