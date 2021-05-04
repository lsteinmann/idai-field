import {Component, Input, OnChanges} from '@angular/core';
import {isEmpty} from 'tsfun';

/**
 * @author Thomas Kleinke
 */
@Component({
    selector: 'relation-picker-group',
    templateUrl: './relation-picker-group.html'
})

export class RelationPickerGroupComponent implements OnChanges {

    @Input() document: any;
    @Input() relationDefinition: any;

    public relations: any;


    public ngOnChanges() {

        if (this.document) this.relations = this.document.resource.relations;
    }


    public createRelation() {

        if (!this.relations[this.relationDefinition.name])
            this.relations[this.relationDefinition.name] = [];

        this.relations[this.relationDefinition.name].push('')
    }


    public validateNewest(): boolean {

        const index: number = this.relations[this.relationDefinition.name].length - 1;

        return (this.relations[this.relationDefinition.name][index]
            && this.relations[this.relationDefinition.name][index].length > 0);
    }


    // Button not shown when waiting for input
    public showPlusButton(): boolean {

        if ((this.relationDefinition.name === 'isRecordedIn' || this.relationDefinition.name === 'liesWithin') &&
                (this.relations[this.relationDefinition.name] &&
                    this.relations[this.relationDefinition.name].length > 0)) return false;

        return !this.relations[this.relationDefinition.name]
            || isEmpty(this.relations[this.relationDefinition.name])
            || this.validateNewest();
    }
}
