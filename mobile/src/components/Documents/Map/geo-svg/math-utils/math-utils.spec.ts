import { TransformedDocument } from '..';
import { bu1 } from '../../../../../../test_data/test_docs/bu1';
import { lineBuilding } from '../../../../../../test_data/test_docs/lineBuilding';
import { multiPolyTrench } from '../../../../../../test_data/test_docs/multiPolyTrench';
import { pointBuilding } from '../../../../../../test_data/test_docs/pointBuilding';
import { pointRadius } from '../constants';
import { pointArea, polygonArea, sortDocumentByGeometryArea } from './math-utils';


describe('geo-svg/math-utils', () => {

    it('should calculate the point area correctly', () => {
        
        expect(pointArea()).toBe(Math.PI * Math.pow(pointRadius,2));
    });

    
    it('should calculate the area of a polygon regarding https://en.wikipedia.org/wiki/Polygon#Area', () => {

        const polygon = [
            [[2,11],[17,13],[11,2],[2,2]]
        ];
        expect(polygonArea(polygon)).toBe(117);
    });


    it('should calculate the area of a polygon with holes', () => {
        const polygon = [
            [[2,2],[2,5],[5,9],[8,7],[9,4],[5,2]],//32.5
            [[4,2],[4,5],[5,6],[6,5],[5,4],[6,3]]//5
        ];
        expect(polygonArea(polygon)).toBe(32.5 - 5);
    });


    it('should sort Document by FieldGeometry area', () => {

        const docs = [tBu1, tLineBuilding, tMultiPolyTrench, tPointBuilding];
        const expectedOrder = ['multiTrench', 'B1', 'pointBuilding', 'lineBuilding'];

        const sortedDocs = sortDocumentByGeometryArea(docs,[]);

        expect(sortedDocs.map(doc => doc.doc.resource.identifier)).toEqual(expectedOrder);
    });


    // eslint-disable-next-line max-len
    it('should sort Document by FieldGeometry area taking selected Docs into account. Selected docs should be sorted at the end of the array', () => {

        const docs = [tBu1, tLineBuilding, tMultiPolyTrench, tPointBuilding];
        const expectedOrder = ['multiTrench', 'lineBuilding', 'B1', 'pointBuilding'];

        const sortedDocs = sortDocumentByGeometryArea(docs,[pointBuilding._id,bu1._id]);

        expect(sortedDocs.map(doc => doc.doc.resource.identifier)).toEqual(expectedOrder);
    });
});

const tBu1: TransformedDocument = {
    doc: bu1,
    transformedCoordinates: [
        [
            [621.7385735809803, 451.1022099405527],
            [675.4748869910836, 451.1022099405527],
            [675.4748869910836, 409.1501757800579],
            [621.7385735809803, 409.1501757800579]
        ]
      ]
};

const tLineBuilding: TransformedDocument = {
    doc: lineBuilding,
    transformedCoordinates: [
        [473.25665494799614, 252.18357609212399],
        [288.479156203568, 593.456303358078],
      ]
};


const tMultiPolyTrench: TransformedDocument = {
    doc: multiPolyTrench,
    transformedCoordinates: [
        [
          [
            [544.9050728231668, 698.1007031649351],
            [630.6946258172393, 716.9555499702692],
            [620.324460066855, 805.5733299851418],
            [541.1341034621, 793.317679554224]
          ]
        ],
        [
          [
            [673.1180311366916, 826.3136614710093],
            [739.1099949777126, 860.2523857355118],
            [705.1712707132101, 906.4467604160309],
            [682.5454545468092, 938.5],
            [660.8623807132244, 919.6451531797647],
            [664.6333500742912, 890.4201406240463],
            [681.6027122065425, 866.8515821099281],
            [651.4349573031068, 858.3669010549784]
          ]
        ]
      ]
};

const tPointBuilding: TransformedDocument = {
    doc: pointBuilding,
    transformedCoordinates: [490.2260170727968, 546.3191863298416]
};