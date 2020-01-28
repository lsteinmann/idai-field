import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ImageViewComponent} from './image-view.component';
import {GeoreferenceViewComponent} from './georeference-view.component';
import {WidgetsModule} from '../../../widgets/widgets.module';
import {ImageGridModule} from '../grid/image-grid.module';
import {ImageDocumentsManager} from '../../../core/images/overview/view/image-documents-manager';
import {ImageOverviewFacade} from '../../../core/images/overview/view/imageoverview-facade';
import {PersistenceHelper} from '../../../core/images/overview/service/persistence-helper';
import {DepictsRelationsViewComponent} from './depicts-relations-view.component';
import {ImagesState} from '../../../core/images/overview/view/images-state';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {TypeUtility} from '../../../core/model/type-utility';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {Imagestore} from '../../../core/images/imagestore/imagestore';

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
        {
            provide: ImageDocumentsManager,
            useClass: ImageDocumentsManager,
            deps: [ImagesState, ImageReadDatastore]
        },
        {
            provide: ImageOverviewFacade,
            useClass: ImageOverviewFacade,
            deps: [ImageDocumentsManager, ImagesState, TypeUtility]
        }
    ],
    entryComponents: [
        ImageViewComponent
    ]
})

export class ImageViewModule {}