import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ImageViewModalComponent} from './image/image-view-modal.component';
import {ResourceViewModalComponent} from './resource/resource-view-modal.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {ImageGridModule} from '../image/grid/image-grid.module';
import {ImageRowModule} from '../image/row/image-row.module';
import {ImageViewerModule} from '../image/viewer/image-viewer.module';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        ImageGridModule,
        ImageRowModule,
        ImageViewerModule
    ],
    declarations: [
        ImageViewModalComponent,
        ResourceViewModalComponent
    ],
    entryComponents: [
        ImageViewModalComponent,
        ResourceViewModalComponent
    ]
})

export class ViewModalModule {}
