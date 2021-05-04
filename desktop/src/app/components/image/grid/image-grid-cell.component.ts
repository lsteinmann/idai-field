import {Component, Input} from '@angular/core';
import {ImageDocument} from 'idai-field-core';

@Component({
    selector: 'image-grid-cell',
    templateUrl: './image-grid-cell.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageGridCellComponent {

    @Input() cell: any;
    @Input() main: ImageDocument;
    @Input() showLinkBadges: boolean = true;
    @Input() showIdentifier: boolean = true;
    @Input() showShortDescription: boolean = true;
    @Input() showGeoIcon: boolean = false;
    @Input() resourceIdentifiers: {[id: string]: string} = {};
    @Input() nrOfColumns: number = 0;


    public getIdentifier(id: string): string|undefined {

        if (!this.resourceIdentifiers ||
            (Object.keys(this.resourceIdentifiers).length < 1)) {
            return undefined;
        }
        return this.resourceIdentifiers[id];
    }
}
