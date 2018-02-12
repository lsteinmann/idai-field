import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */

export const has3DPointGeometry = (document: IdaiFieldDocument): boolean => {

    return document.resource.geometry != undefined &&
        document.resource.geometry.type == 'Point' &&
        document.resource.geometry.coordinates != undefined &&
        document.resource.geometry.coordinates.length == 3;
};


export const getPointVector = (geometry: IdaiFieldGeometry): THREE.Vector3 => {

    return new THREE.Vector3(geometry.coordinates[0], geometry.coordinates[2], geometry.coordinates[1]);
};