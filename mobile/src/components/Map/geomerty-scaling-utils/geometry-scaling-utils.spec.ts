
import { bu1 } from '../../../../test_data/test_docs/bu1';
import { lineBuilding } from '../../../../test_data/test_docs/lineBuilding';
import { multiPointSurvey } from '../../../../test_data/test_docs/multiPointSurvey';
import { multiPolyTrench } from '../../../../test_data/test_docs/multiPolyTrench';
import { pointBuilding } from '../../../../test_data/test_docs/pointBuilding';
import {
    extractCoordsPositions,
    extractCoordsPositions2d,
    extractCoordsPositions3d,
    GeometryBoundings,
    getGeometryBoundings,
    getMinMaxCoords,
    mapValueToNewRange
} from './geometry-scaling-utils';

const positionArray = [[1,4], [3,5], [6,9], [0,5.5]];
const expectedArray = [
    [1, 3, 6, 0],
    [4, 5, 9, 5.5]];

const positionArray2d = [
    positionArray,
    [[1,1], [7,8], [0.34, 0.6], [4,90]],
    [[9,1], [300,546]]
];
const expectedArray2d = [
    [...expectedArray[0], 1, 7, 0.34, 4, 9, 300],
    [...expectedArray[1], 1, 8, 0.6, 90, 1, 546]
];
const expectedXmax = 27.189346313476562;
const expectedXmin = 27.189085960388184;
const expectedYmax = 39.141438484191895;
const expectedYmin = 39.14105033874512;

describe('geometry-utils functions', () => {


    it('returns array of x coordinate and array of y coords for Position[]', () => {
   
        expect(extractCoordsPositions(positionArray)).toEqual(expectedArray);
    });


    it('returns array of x coordinate and array of y coords for Position[][]', () => {
  
        expect(extractCoordsPositions2d(positionArray2d)).toEqual(expectedArray2d);
    });


    it('returns array of x coordinate and array of y coords for Position[][][]', () => {

        const positionArray3d = [
            positionArray2d,[
            [[1,1], [10,39],[93,23]],
            [[6,7],[234,254], [67,89], [9,94.56]]
            ]
        ];
        const expectedArray3d = [
            [...expectedArray2d[0], 1, 10, 93, 6, 234, 67, 9],
            [...expectedArray2d[1], 1, 39, 23, 7, 254, 89, 94.56]
        ];
        expect(extractCoordsPositions3d(positionArray3d)).toEqual(expectedArray3d);
    });


    it('gets min and max x and y coordinates of FieldGeometry[]', () => {

        const boundigs = getMinMaxCoords([
            bu1.resource.geometry, lineBuilding.resource.geometry, multiPointSurvey.resource.geometry,
            multiPolyTrench.resource.geometry, pointBuilding.resource.geometry
        ]);


        expect(boundigs.minX).toBe(expectedXmin);
        expect(boundigs.maxX).toBe(expectedXmax);
        expect(boundigs.minY).toBe(expectedYmin);
        expect(boundigs.maxY).toBe(expectedYmax);
    });


    it('defines the boundings of a list of Documents', () => {

        // eslint-disable-next-line max-len
        const expectedBoundings: GeometryBoundings = {
            minX: expectedXmin,
            minY: expectedYmin,
            maxX: expectedXmax,
            maxY: expectedYmax,
        };
        const calculatedViewBox = getGeometryBoundings(
            [bu1, pointBuilding, lineBuilding, multiPointSurvey, multiPolyTrench]);
        
        expect(calculatedViewBox).toEqual(expectedBoundings);
    });


    it('maps value from one range to another range', () => {
        const newMax = 400;
        const newMin = 100;
        const expectedMappedValue = 125.2;

        const oldMin = 50;
        const oldMax = 300;
        const value = 71;

        expect(mapValueToNewRange(newMax, newMin, value, oldMax, oldMin)).toBe(expectedMappedValue);

    });
    
});