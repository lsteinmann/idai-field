import {Component, EventEmitter, Output, Renderer2} from '@angular/core';
import {MenuService} from '../menu-service';
import {MenuComponent} from '../widgets/menu.component';
import {MatrixLineMode, MatrixRelationsMode, MatrixState} from './matrix-state';


@Component({
    selector: 'matrix-options-menu',
    templateUrl: './matrix-options-menu.html'
})
/**
 * @author Thomas Kleinke
 * 
 * changes in the version for Miletus (hierarchyClustering)
 */
export class MatrixOptionsMenuComponent extends MenuComponent {

    @Output() onChange: EventEmitter<void> = new EventEmitter<void>();


    constructor(private matrixState: MatrixState,
                renderer: Renderer2,
                menuService: MenuService) {

        super(renderer, menuService, 'matrix-options-button', 'matrix-options-menu');
    }


    public getRelationsMode = () => this.matrixState.getRelationsMode();
    public getLineMode = () => this.matrixState.getLineMode();
    public getClusterMode = () => this.matrixState.getClusterMode();
    public getHierarchyMode = () => this.matrixState.getHierarchyMode();


    public async setRelationsMode(relationsMode: MatrixRelationsMode) {

        await this.matrixState.setRelationsMode(relationsMode);
        this.onChange.emit();
    }


    public async setLineMode(lineMode: MatrixLineMode) {

        await this.matrixState.setLineMode(lineMode);
        this.onChange.emit();
    }


    public async toggleClusterMode() {

        await this.matrixState.setClusterMode(
            this.matrixState.getClusterMode() === 'periods' ? 'none' : 'periods'
        );
        this.onChange.emit();
    }

    public async toggleHierarchyMode() {

        await this.matrixState.setHierarchyMode(
            this.matrixState.getHierarchyMode() === 'hierarchy' ? 'none' : 'hierarchy'
        );
        this.onChange.emit();
    }
}
