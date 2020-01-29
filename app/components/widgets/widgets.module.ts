import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiMessagesModule} from 'idai-components-2';
import {DocumentPickerComponent} from './document-picker.component';
import {Loading} from './loading';
import {LoadingIconComponent} from './loading-icon.component';
import {SearchBarComponent} from './search-bar.component';
import {TypePickerComponent} from './type-picker.component';
import {ZoomButtonsComponent} from './zoom-buttons.component';
import {FieldsViewComponent} from './fields-view.component';
import {DocumentTeaserComponent} from './document-teaser.component';
import {TypeIconComponent} from './type-icon.component';
import {TypeRowComponent} from './type-row.component';
import {ImageRowComponent} from './image-row.component';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        RouterModule,
        IdaiMessagesModule
    ],
    declarations: [
        DocumentPickerComponent,
        DocumentTeaserComponent,
        FieldsViewComponent,
        LoadingIconComponent,
        SearchBarComponent,
        TypePickerComponent,
        ZoomButtonsComponent,
        TypeIconComponent,
        TypeRowComponent,
        ImageRowComponent
    ],
    providers: [
        Loading
    ],
    exports: [
        DocumentPickerComponent,
        DocumentTeaserComponent,
        FieldsViewComponent,
        LoadingIconComponent,
        SearchBarComponent,
        TypePickerComponent,
        ZoomButtonsComponent,
        TypeIconComponent,
        TypeRowComponent,
        ImageRowComponent
    ],
    entryComponents: []
})

export class WidgetsModule {}