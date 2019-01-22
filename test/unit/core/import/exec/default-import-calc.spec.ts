import {DefaultImportCalc} from '../../../../../app/core/import/exec/default-import-calc';
import {ImportErrors as E} from '../../../../../app/core/import/exec/import-errors';
import {Document} from 'idai-components-2';
import {logging} from 'selenium-webdriver';

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportCalc', () => {


    let validator;

    const RECORDED_IN = 'isRecordedIn';
    const LIES_WITHIN = 'liesWithin';
    
    let opTypeNames = ['Trench'];

    const existingTrench = {resource: {type: 'Trench', identifier: 'existingTrench', id: 'et1', relations:{ }}};
    const existingTrench2 = {resource: {type: 'Trench', identifier: 'existingTrench2', id: 'et2', relations:{ }}};
    const existingFeature = {resource: {type: 'Feature', identifier: 'existingFeature', id: 'ef1', relations:{ isRecordedIn: ['et1']}}};
    const existingFeature2 = {resource: {type: 'Feature', identifier: 'existingFeature2', id: 'ef2', relations:{ isRecordedIn: ['et2']}}};

    let generateId = () => { resourceIdCounter++; return '10' + resourceIdCounter.toString() };

    let getInverse = (_: string) => {

        if (_ === 'isAfter') return 'isBefore';
    };


    let get = async (resourceId): Promise<any> => {

        if (resourceId === 'ef1') return existingFeature;
        if (resourceId === 'ef2') return existingFeature2;
        if (resourceId === 'et1') return existingTrench;
        if (resourceId === 'et2') return existingTrench2;
        else throw 'missing';
    };


    let find = async (_: any): Promise<any> => {

        if (_ === 'existingTrench') return existingTrench;
        if (_ === 'existingTrench2') return existingTrench2;
        if (_ === 'existingFeature') return existingFeature;
        if (_ === 'existingFeature2') return existingFeature2;
        return undefined;
    };


    function d(type: string, identifier: string, rels?: any) {

        const document = { resource: { identifier: identifier, type: type, relations: {} }};
        if (rels) document.resource['relations'] = rels;
        return document as unknown as Document;
    }


    let resourceIdCounter;
    let process;
    let processWithMainType;
    let processWithPlainIds;
    let processMerge;
    let processMergeOverwriteRelations;


    beforeEach(() => {

        resourceIdCounter = 0;

        validator = jasmine.createSpyObj('validator', [
            'assertIsRecordedInTargetsExist', 'assertIsWellformed',
            'assertIsKnownType', 'assertHasLiesWithin', 'assertIsAllowedType',
            'assertSettingIsRecordedInIsPermissibleForType',
            'assertIsNotOverviewType', 'isRecordedInTargetAllowedRelationDomainType', 'assertNoForbiddenRelations']);

        process = DefaultImportCalc.build(validator, opTypeNames, generateId, find, get, getInverse,
            false,
            false,
            '',
            true);

        processWithMainType = DefaultImportCalc.build(validator, opTypeNames, generateId, find, get, getInverse,
            false,
            false,
            'et1',
            true);

        processWithPlainIds = DefaultImportCalc.build(validator, opTypeNames, generateId, find, get, getInverse,
            false,
            false,
            '',
            false);

        processMerge = DefaultImportCalc.build(validator, opTypeNames, generateId, find, get, getInverse,
            true,
            false,
            '',
            false);

        processMergeOverwriteRelations = DefaultImportCalc.build(validator, opTypeNames, generateId, find, get, getInverse,
            true,
            true,
            '',
            true);
    });


    // TODO test that includes relation gets not set


    it('set inverse relation', async done => {

        const result = await process([
            d('Feature', 'newFeature', { parent: 'existingTrench',
                isAfter: ['existingFeature2']}) // TODO should not be allowed since not in same trench
        ]);

        expect(result[1][0].resource.relations['isBefore'][0]).toBe('101');
        done();
    });


    it('child of existing operation', async done => {

        const result = await process([
            d('Feature', 'newFeature', { parent: 'existingTrench' })
            ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('101');
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('child of existing operation, assign via resource id', async done => {

        const result = await processWithPlainIds([
            d('Feature', 'newFeature', { parent: 'et1' })
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('101');
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('child of existing feature', async done => {

        const result = await process([
            d('Feature', 'newFeature', { parent: 'existingFeature'})
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('101');
        expect(resource.relations[RECORDED_IN][0]).toEqual('et1');
        expect(resource.relations[LIES_WITHIN][0]).toEqual('ef1');
        done();
    });


    it('import operation', async done => {

        const result = await process([
            d('Trench', 'zero')
        ]);

        const resource = result[0][0].resource;
        expect(resource.identifier).toBe('zero');
        expect(resource.relations[RECORDED_IN]).toBeUndefined();
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import operation including feature', async done => {

        const result = await process([
            d('Trench', 'one'),
            d('Feature', 'two', { parent: 'one' })
        ]);

        const resource = result[0][1].resource;
        expect(resource.identifier).toBe('two');
        expect(resource.relations[RECORDED_IN][0]).toBe('101');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import operation including feature, order reversed', async done => {

        const result = await process([
            d('Feature', 'two', { parent: 'one' }),
            d('Trench', 'one')
        ]);

        const resource = result[0][0].resource;
        expect(resource.identifier).toBe('two');
        expect(resource.relations[RECORDED_IN][0]).toBe('102');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import operation including feature, nest deeper', async done => {

        const result = await process([
            d('Trench', 'one'),
            d('Feature', 'two', { parent: 'one' }),
            d('Find', 'three', { parent: 'two' })
        ]);

        const resource = result[0][2].resource;
        expect(resource.identifier).toBe('three');
        expect(resource.relations[RECORDED_IN][0]).toBe('101');
        expect(resource.relations[LIES_WITHIN][0]).toEqual('102');
        done();
    });


    it('import operation including feature, nest deeper, order reversed', async done => {

        const result = await process([
            d('Find', 'three', { parent: 'two' }),
            d('Feature', 'two', { parent: 'one' }),
            d('Trench', 'one')
        ]);

        const resource = result[0][0].resource;
        expect(resource.identifier).toBe('three');
        expect(resource.relations[RECORDED_IN][0]).toBe('103');
        expect(resource.relations[LIES_WITHIN][0]).toEqual('102');
        done();
    });


    it('import feature as child of existing operation', async done => {

        const result = await process([
            d('Feature', 'one', { parent: 'existingTrench' })
        ]);

        const resource = result[0][0].resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import feature as child of existing operation, via operation assignment parameter', async done => {

        const result = await processWithMainType([
            d('Feature', 'one')
        ]);

        const resource = result[0][0].resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('nested resources, topmost child of existing operation', async done => {

        const result = await process([
            d('Feature', 'one', { parent: 'existingTrench' }),
            d('Find', 'two', { parent: 'one' })
        ]);

        expect(result[0][0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][0].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(result[0][1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][1].resource.relations[LIES_WITHIN][0]).toBe('101');
        done();
    });


    it('nested resources, topmost child of existing operation, order reversed', async done => {

        const result = await process([
            d('Find', 'two', { parent: 'one' }),
            d('Feature', 'one', { parent: 'existingTrench'})
        ]);

        expect(result[0][0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][0].resource.relations[LIES_WITHIN][0]).toBe('102');
        expect(result[0][1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][1].resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('nested resources, assignment to operation via operation assignment parameter', async done => {

        const result = await processWithMainType([
            d('Feature', 'one'),
            d('Find', 'two', { parent: 'one' })
        ]);

        expect(result[0][0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][0].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(result[0][1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][1].resource.relations[LIES_WITHIN][0]).toBe('101');
        done();
    });


    it('nested resources, assignment to operation via operation assignment parameter, order reversed', async done => {

        const result = await processWithMainType([
            d('Find', 'two', { parent: 'one' }),
            d('Feature', 'one')
        ]);

        expect(result[0][0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][0].resource.relations[LIES_WITHIN][0]).toBe('102');
        expect(result[0][1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][1].resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('assignment to existing operation via parameter, also nested in existing', async done => {

        const result = await processWithMainType([
            d('Feature', 'one', { parent: 'existingFeature'})
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('101');
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN][0]).toBe('ef1');
        done();
    });


    // merge mode //////////////////////////////////////////////////////////////////////////////////////////////////////

    it('merge, add field', async done => {

        const result = await processMerge([
            { resource: { type: 'Feature', identifier: 'existingFeature',
                    field: 'new',
                    geometry: { type: 'Point',  coordinates: [ 27.189335972070694, 39.14122423529625]}
            }}
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('ef1');
        expect(resource.relations[RECORDED_IN][0]).toEqual('et1');
        expect(resource['field']).toEqual('new');
        expect(resource['geometry']).toEqual({ type: 'Point', coordinates: [ 27.189335972070694, 39.14122423529625] });
        done();
    });


    it('merge, overwrite relations', async done => {

        const result = await processMergeOverwriteRelations([
            d('Feature', 'existingFeature', { isAfter: ['existingFeature2']})
        ]);

        expect(result[0][0].resource.relations['isAfter'][0]).toEqual('ef2');
        expect(result[1][0].resource.id).toEqual('ef2');
        expect(result[1][0].resource.relations['isBefore'][0]).toEqual('ef1');
        done();
    });


    it('merge, overwrite relations, reassign parent', async done => {

        const result = await processMergeOverwriteRelations([
            d('Feature', 'existingFeature2', { parent: 'existingFeature' })
        ]);

        const resource = result[0][0].resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN][0]).toBe('ef1');
        done();
    });


    it('merge, ignore wrong relations when not setting overwrite relations', async done => {

        const result = await processMerge([
            d('Feature', 'existingFeature', { isAfter: 'unknown' })
        ]);

        expect(result[0].length).toBe(1);
        expect(result[2]).toBeUndefined();
        done();
    });


    // err cases ///////////////////////////////////////////////////////////////////////////////////////////////////////

    it('assignment to existing feature, via mismatch with operation assignment parameter , ', async done => {

        const result = await processWithMainType([
            d('Feature', 'one', { parent: 'existingFeature2'})
        ]);

        expect(result[2][0]).toEqual(E.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN);
        expect(result[2][1]).toEqual('one');
        done();
    });


    it('duplicate identifiers in import file', async done => {

        const result = await process(<any>[
            d('Feature', 'dup', { parent: 'etc1' }),
            d('Feature', 'dup', { parent: 'etc1' }),
        ]);

        const error = result[2];
        expect(error[0]).toEqual(E.DUPLICATE_IDENTIFIER);
        expect(error[1]).toEqual('dup');
        done();
    });


    it('duplicate identifiers, resource with such identifier already exists', async done => {

        const result = await process([
            d('Feature', 'existingFeature', { parent: 'existingTrench' })
        ]);

        const error = result[2];
        expect(error[0]).toEqual(E.RESOURCE_EXISTS);
        expect(error[1]).toEqual('existingFeature');
        done();
    });


    it('parent not found', async done => {

        const result = await process(<any>[
            d('Feature', 'zero', { parent: 'notfound' })
        ]);

        expect(result[2][0]).toEqual(E.MISSING_RELATION_TARGET);
        expect(result[2][1]).toEqual('notfound');
        done();
    });


    it('parent not found, when using plain ids', async done => {

        const result = await processWithPlainIds(<any>[
            d('Feature', 'zero', { parent: 'notfound' })
        ]);

        expect(result[2][0]).toEqual(E.MISSING_RELATION_TARGET);
        expect(result[2][1]).toEqual('notfound');
        done();
    });


    it('clash of assigned main type id with use of parent', async done => {

        const result = await processWithMainType([
            d('Feature', 'one', { parent: 'existingTrench'})
        ]);
        expect(result[2][0]).toEqual(E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED);
        done();
    });


    it('parent is an array', async done => {

        const result = await process([
            d('Feature', 'one', { parent: [] })
        ]);
        expect(result[2][0]).toEqual(E.PARENT_MUST_NOT_BE_ARRAY);
        expect(result[2][1]).toEqual('one');
        done();
    });


    it('missing liesWithin and no operation assigned', async done => {

        validator.assertHasLiesWithin.and.throwError('E');

        const result = await process([
            d('Feature', 'one')
        ]);
        expect(result[2][0]).toEqual(E.NO_LIES_WITHIN_SET);
        done();
    });


    it('forbidden relation', async done => {

        const result = await process([
            d('Feature', 'one', { includes: [] })
        ]);
        expect(result[2][0]).toEqual(E.INVALID_RELATIONS);
        expect(result[2][2]).toEqual('includes');
        done();
    });


    it('validation error - not wellformed', async done => {

        validator.assertIsWellformed.and.callFake(() => { throw [E.INVALID_FIELDS, 'invalidField'] });

        const result = await processWithMainType([
            d('Feature', 'one')
        ]);

        expect(result[2][0]).toEqual(E.INVALID_FIELDS);
        expect(result[2][1]).toEqual('invalidField');
        done();
    });


    xit('remove self referencing relation target', async done => { // TODO unxit

        // importFunction = DefaultImport.build(
        //     mockValidator, operationTypeNames,
        //     mockProjectConfiguration,
        //
        //     () => '101', false,  false, '', true);
        //
        // const docToImport = { resource: { type: 'Find', identifier: '1a',
        //         relations: { parent: ['three', '1a'], liesWithin: ['1a'] } } };
        //
        // mockDatastore.find.and.returnValues(
        //     Promise.resolve({ documents: [{ resource: { id: '3' }}], totalCount: 1 }), // relation target
        //     Promise.resolve({ documents: [], totalCount: 0 })); // looking if already exists
        //
        // const {errors} = await importFunction([ docToImport as any ],
        //     mockDatastore,'user1');
        //
        // expect(errors.length).toBe(0);
        // expect(Object.keys(docToImport.resource.relations).length).toBe(1);
        // expect(Object.keys(docToImport.resource.relations)[0]).toBe(RECORDED_IN);
        // expect(docToImport.resource.relations[RECORDED_IN].length).toBe(1);
        // expect(docToImport.resource.relations[RECORDED_IN][0]).toBe('3');
        done();
    });
});