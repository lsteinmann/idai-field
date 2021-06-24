import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal } from 'tsfun';
import { AppConfigurator } from 'idai-field-core';
import { SettingsProvider } from '../../../core/settings/settings-provider';
import { MenuService } from '../../menu-service';
import { Messages } from '../../messages/messages';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';


@Component({
    templateUrl: './category-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class CategoryEditorModalComponent extends ConfigurationEditorModalComponent {

    protected changeMessage = this.i18n({
        id: 'docedit.saveModal.categoryChanged', value: 'Die Kategorie wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                appConfigurator: AppConfigurator,
                settingsProvider: SettingsProvider,
                modalService: NgbModal,
                menuService: MenuService,
                messages: Messages,
                private i18n: I18n) {
        
        super(activeModal, appConfigurator, settingsProvider, modalService, menuService, messages);
    }


    public initialize() {

        super.initialize();

        if (this.new) {
            this.clonedConfigurationDocument.resource.categories[this.category.name] = {
                color: '#000',
                parent: this.category.parentCategory.name,
                fields: {}
            }
        } else {
            if (!this.getClonedCategoryDefinition().color) {
                this.getClonedCategoryDefinition().color = this.category.color;
            }
        }
    }


    public async save() {

        if (this.getClonedCategoryDefinition().color === this.category.defaultColor) {
            delete this.getClonedCategoryDefinition().color;
        }

        super.save();
    }


    public isChanged(): boolean {

        return this.new
            || !equal(this.label)(this.clonedLabel)
            || !equal(this.description)(this.clonedDescription)
            || this.getClonedCategoryDefinition().color !== this.category.color;
    }
}
