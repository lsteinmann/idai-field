import {Component, OnInit, Inject} from 'angular2/core';
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {ObjectEditComponent} from "./object-edit.component";


@Component({
    templateUrl: 'templates/overview.html',
    directives: [ObjectEditComponent]
})

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class OverviewComponent implements OnInit {

    public selectedObject: IdaiFieldObject;
    public objects: IdaiFieldObject[];

    constructor(private datastore: Datastore,
        @Inject('app.config') private config) {
    }

    onSelect(object: IdaiFieldObject) {
        this.selectedObject = object;
    }

    public onCreate() {

        var object: any = {};

        this.datastore.create(object).then(
            () => {
                console.log('NEW OBJECT', object);
                this.objects.push(object);
                this.selectedObject = object;
            },
            err => console.error(err)
        );
    }

    onKey(event:any) {
        if (event.target.value == "") {
            this.datastore.all({}).then(objects => {
                this.objects = objects;
            }).catch(err => console.error(err));
        } else {
            this.datastore.find(event.target.value, {}).then(objects => {
                this.objects = objects;
            }).catch(err => console.error(err));
        }
    }

    ngOnInit() {
        if (this.config.environment == "test") {
            setTimeout(() => this.fetchObjects(), 500);
        } else {
            this.fetchObjects();
        }
    }

    private fetchObjects() {

        this.datastore.all({}).then(objects => {
            this.objects = objects;
        }).catch(err => console.error(err));
    }

}
