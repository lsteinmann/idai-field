import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'upload-modal',
    templateUrl: './upload-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class UploadModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
