import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {imagesRouting} from './image-overview.routing';
import {ImageOverviewComponent} from './image-overview.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {LinkModalComponent} from './link-modal.component'
import {ImagesState} from '../../../core/images/overview/view/images-state';
import {ImageGridModule} from '../grid/image-grid.module';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ImageOverviewTaskbarComponent} from './image-overview-taskbar.component';
import {ImageOverviewSearchBarComponent} from './searchbar/image-overview-search-bar.component';
import {ImageOverviewSearchConstraintsComponent} from './searchbar/image-overview-search-constraints.component';
import {DeleteModalComponent} from './deletion/delete-modal.component';
import {ImageOverviewFacade} from '../../../core/images/overview/view/imageoverview-facade';
import {ImageDocumentsManager} from '../../../core/images/overview/view/image-documents-manager';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {DeletionInProgressModalComponent} from './deletion/deletion-in-progress-modal.component';
import { Datastore } from 'idai-field-core';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        imagesRouting,
        WidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ImageOverviewComponent,
        ImageOverviewTaskbarComponent,
        ImageOverviewSearchBarComponent,
        ImageOverviewSearchConstraintsComponent,
        LinkModalComponent,
        RemoveLinkModalComponent,
        DeleteModalComponent,
        DeletionInProgressModalComponent
    ],
    entryComponents: [
        LinkModalComponent,
        RemoveLinkModalComponent,
        DeleteModalComponent
    ],
    providers: [
        ImagesState,
        {
            provide: ImageDocumentsManager,
            useClass: ImageDocumentsManager,
            deps: [ImagesState, Datastore]
        },
        {
            provide: ImageOverviewFacade,
            useClass: ImageOverviewFacade,
            deps: [ImageDocumentsManager, ImagesState, ProjectConfiguration]
        }
    ]
})

export class ImageOverviewModule {}
