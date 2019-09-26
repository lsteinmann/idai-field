import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ImageViewComponent} from './image-view.component';
import {GeoreferenceViewComponent} from './georeference-view.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {ImageDocumentsManager} from '../imageoverview/view/image-documents-manager';
import {ImageOverviewFacade} from '../imageoverview/view/imageoverview-facade';
import {PersistenceHelper} from '../imageoverview/service/persistence-helper';
import {DepictsRelationsViewComponent} from './depicts-relations-view.component';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ImageViewComponent,
        GeoreferenceViewComponent,
        DepictsRelationsViewComponent
    ],
    providers: [
        ImageDocumentsManager,
        ImageOverviewFacade,
        PersistenceHelper
    ],
    entryComponents: [
        ImageViewComponent
    ]
})

export class ImageViewModule {}