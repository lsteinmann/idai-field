import { doc, IndexFacade, Query } from 'idai-field-core';
import { IndexerConfiguration } from '../../../../../src/app/indexer-configuration';
import { createMockProjectConfiguration } from './helpers';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
describe('IndexFacade', () => {

    let indexFacade: IndexFacade;


    beforeEach(() => {

        const { createdIndexFacade } =
            IndexerConfiguration.configureIndexers(createMockProjectConfiguration(), false);
        indexFacade = createdIndexFacade;
    });


    it('should put a type and then a find', () => {

        const typeDocB = doc('sd1', 'identifier1', 'Type', 'id1');
        const typeDocA = doc('sd0', 'identifier0', 'Type', 'id0');
        const findDocB = doc('sd3', 'identifier3', 'FindB', 'id3');
        const findDocA = doc('sd2', 'identifier2', 'FindA', 'id2');
        findDocB.resource.relations = { isInstanceOf: ['id1'] };
        findDocA.resource.relations = { isInstanceOf: ['id0'] };

        indexFacade.put(typeDocB);
        indexFacade.put(typeDocA);

        const items1 = indexFacade.find(
            { categories: ['Type'], sort: { matchCategory: 'SomeFindCategory'} /* query is designed to trigger Type-based sort */
            });
        expect(items1).toEqual(['id0', 'id1']);

        // ->
        indexFacade.put(findDocB);
        indexFacade.put(findDocA);

        const items = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'FindB'} });
        expect(items).toEqual(['id1', 'id0']);
    });


    it('put a type, add finds, delete finds afterward', () => {

        const typeDocB = doc('sd1', 'identifier1', 'Type', 'id1');
        const typeDocA = doc('sd0', 'identifier0', 'Type', 'id0');
        const findDocC = doc('sd4', 'identifier4', 'Find', 'id4');
        const findDocB = doc('sd3', 'identifier3', 'Find', 'id3');
        const findDocA = doc('sd2', 'identifier2', 'Find', 'id2');
        findDocA.resource.relations = { isInstanceOf: ['id0'] };
        findDocB.resource.relations = { isInstanceOf: ['id1'] };
        findDocC.resource.relations = { isInstanceOf: ['id1'] };

        indexFacade.put(typeDocA);
        indexFacade.put(typeDocB);

        const items1 = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'Find'} });
        expect(items1).toEqual(['id0', 'id1']);

        indexFacade.put(findDocB);
        indexFacade.put(findDocA);
        indexFacade.put(findDocC);

        const items2 = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'Find'} });
        expect(items2).toEqual(['id1', 'id0']);

        // ->
        indexFacade.remove(findDocB);
        indexFacade.remove(findDocC);

        const result = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'Find'} });
        expect(result).toEqual(['id0', 'id1']);
    });


    it('put a type, add finds, put finds afterward again', () => {

        const typeDocB = doc('sd1', 'identifier1', 'Type', 'id1');
        const typeDocA = doc('sd0', 'identifier0', 'Type', 'id0');
        const findDocC = doc('sd4', 'identifier4', 'Find', 'id4');
        const findDocB = doc('sd3', 'identifier3', 'Find', 'id3');
        const findDocA = doc('sd2', 'identifier2', 'Find', 'id2');
        findDocA.resource.relations = { isInstanceOf: ['id0'] };
        findDocB.resource.relations = { isInstanceOf: ['id1'] };
        findDocC.resource.relations = { isInstanceOf: ['id1'] };

        indexFacade.put(typeDocA);
        indexFacade.put(typeDocB);

        const items1 = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'Find'} });
        expect(items1).toEqual(['id0', 'id1']);

        indexFacade.put(findDocB);
        indexFacade.put(findDocA);
        indexFacade.put(findDocC);

        const items2 = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'Find'} });
        expect(items2).toEqual(['id1', 'id0']);

        // ->
        findDocB.resource.relations = { isInstanceOf: ['id0'] };
        findDocC.resource.relations = { isInstanceOf: ['id0'] };
        indexFacade.put(findDocB);
        indexFacade.put(findDocC);

        const result = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'Find'} });
        expect(result).toEqual(['id0', 'id1']);
    });


    it('keep instances after re-putting type', () => {

        const typeDocB = doc('sd1', 'identifier1', 'Type', 'id1');
        const typeDocA = doc('sd0', 'identifier0', 'Type', 'id0');
        const findDocC = doc('sd4', 'identifier4', 'Find', 'id4');
        const findDocB = doc('sd3', 'identifier3', 'Find', 'id3');
        const findDocA = doc('sd2', 'identifier2', 'Find', 'id2');
        findDocA.resource.relations = { isInstanceOf: ['id0'] };
        findDocB.resource.relations = { isInstanceOf: ['id1'] };
        findDocC.resource.relations = { isInstanceOf: ['id1'] };

        indexFacade.put(typeDocA);
        indexFacade.put(typeDocB);

        const items1 = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'Find'} });
        expect(items1).toEqual(['id0', 'id1']);

        indexFacade.put(findDocB);
        indexFacade.put(findDocA);
        indexFacade.put(findDocC);

        const items2 = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'Find'} });
        expect(items2).toEqual(['id1', 'id0']);

        // ->
        indexFacade.put(typeDocA);

        const result = indexFacade.find({ categories: ['Type'], sort: { matchCategory: 'Find'} });
        expect(result).toEqual(['id1', 'id0']);
    });


    it('should sort by identifier ascending', () => {

        const doc1 = doc('bla1', 'blub1', 'category1','id1');
        const doc3 = doc('bla3', 'blub3', 'category3','id3');
        doc3.resource.relations['isRecordedIn'] = ['id1'];

        const doc2 = doc('bla2', 'blub2', 'category2','id2');
        doc2.resource.relations['isRecordedIn'] = ['id1'];

        const q: Query = {
            q: 'blub',
            constraints: {
                'isRecordedIn:contain': 'id1'
            }
        };

        indexFacade.put(doc1);
        indexFacade.put(doc2);
        indexFacade.put(doc3);

        const result = indexFacade.find(q);
        expect(result).toEqual(['id2', 'id3']);
    });


    it('should not sort', () => {

        const doc1 = doc('1', '1', 'category1','id1');
        const doc2 = doc('2', '2', 'category2','id2');
        const doc3 = doc('3', '3', 'category2','id3');
        doc1.resource.relations['isDepictedIn'] = ['id3', 'id2'];

        const q: Query = {
            constraints: {
                'isDepictedIn:links': 'id1'
            },
            sort: {
                mode: 'none'
            }
        };

        indexFacade.put(doc1);
        indexFacade.put(doc2);
        indexFacade.put(doc3);

        const result = indexFacade.find(q);
        expect(result).toEqual(['id3', 'id2']);
    });


    it('do not index if no identifier', () => {

        const doc1 = doc('sd0', 'identifier0', 'Type', 'id0');
        delete doc1.resource.identifier;
        const doc2 = doc('sd1', 'identifier1', 'Type', 'id1');

        indexFacade.put(doc1);
        indexFacade.put(doc2);

        const result = indexFacade.find({});
        expect(result).toEqual(['id1']);
    });


    it('get descendant ids', () => {

        const doc1 = doc('sd0', 'identifier0', 'Type', 'id0');
        const doc2 = doc('sd1', 'identifier1', 'Type', 'id1');
        doc2.resource.relations['liesWithin'] = ['id0'];

        indexFacade.put(doc1);
        indexFacade.put(doc2);

        const result = indexFacade.getDescendantIds('liesWithin:contain', 'id0');
        expect(result).toEqual(['id1']);
    });
});
