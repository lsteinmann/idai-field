import {Document} from 'idai-field-core';
import {M} from '../../../../src/app/components/messages/m';
import {ProjectConfiguration} from '../../../../src/app/core/configuration/project-configuration';
import {DocumentHolder} from '../../../../src/app/core/docedit/document-holder';
import {Tree} from 'idai-field-core';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('DocumentHolder', () => {

    let defaultDocument: Document;
    let changedDocument: Document;

    let docHolder;
    let datastore;
    let validator;


    beforeEach(() => {

        const pconf = new ProjectConfiguration([Tree.buildForest(
            [
                [{
                    name: 'Trench',
                    groups: [{ name: 'stem', fields: [
                        { name: 'id' },
                        { name: 'category' },
                        { name: 'emptyfield' }
                    ]}]}
                , []],
                [{
                    name: 'Find',
                    groups: [{
                        name: 'stem', fields: [
                            {name: 'id'},
                            {name: 'category'},
                            {name: 'unsignedIntField', inputType: 'unsignedInt'},
                            {name: 'unsignedFloatField', inputType: 'unsignedFloat'},
                            {name: 'floatField', inputType: 'float'}
                        ]
                    }]
                }, []]
            ] as any)
            ,[
                {
                    name: 'isFoundOn',
                    label: '',
                    inverse: 'bears',
                    domain: ['Trench'],
                    range: ['Find']
                },
                {
                    name: 'isFoundOn2',
                    label: '',
                    inverse: 'bears',
                    domain: ['Trench'],
                    range: ['Find']
                },
                {
                    name: 'isRecordedIn',
                    label: '',
                    domain: ['Find'],
                    range: ['Trench']
                }
            ]]);

        defaultDocument = {
            _id: '1',
            resource: {
                category: 'Trench',
                id: '1',
                emptyfield: '',
                undeffield: 'some',
                relations: {
                    'isFoundOn': [],
                    'isFoundOn2': ['1'],
                    'undefrel': ['2']
                }
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        validator = jasmine.createSpyObj('Validator', [
            'assertIsRecordedInTargetsExist', 'assertIdentifierIsUnique',
            'assertHasIsRecordedIn', 'assertNoFieldsMissing',
            'assertCorrectnessOfNumericalValues', 'assertGeometryIsValid']);

        const persistenceManager = jasmine.createSpyObj('PersistenceManager', ['update']);
        persistenceManager.update.and.callFake((doc, b, c, d) => {
            changedDocument = doc;
            return Promise.resolve(changedDocument);
        });

        const projectCategories = jasmine.createSpyObj('ProjectCategories', ['getRegularCategoryNames']);
        projectCategories.getRegularCategoryNames.and.returnValue(['Find']);

        const settingsProvider = jasmine.createSpyObj('UsernameProvider', ['getSettings']);
        settingsProvider.getSettings.and.returnValue({username:''});
        datastore = jasmine.createSpyObj('Datastore', ['get']);
        datastore.get.and.callFake((a, b) => changedDocument);

        docHolder = new DocumentHolder(
            pconf,
            persistenceManager,
            validator,
            datastore
        );
    });


    it('remove empty and undefined fields', async done => {

        const cloned = Document.clone(defaultDocument);
        delete cloned.resource.undeffield;
        docHolder.setDocument(cloned);

        docHolder.clonedDocument = defaultDocument;
        const savedDocument: Document = await docHolder.save();

        expect(savedDocument.resource.undeffield).toBeUndefined();
        expect(savedDocument.resource.emptyfield).toBeUndefined();
        expect(savedDocument.resource.category).not.toBeUndefined();
        done();
    });


    it('do not remove undefined field if it was part of the original object', async done => {

        docHolder.setDocument(defaultDocument);
        const savedDocument: Document = await docHolder.save();
        expect(savedDocument.resource.undeffield).toEqual('some');
        done();
    });


    it('do not remove undefined relation if it was part of the original object', async done => {

        docHolder.setDocument(defaultDocument);
        const savedDocument: Document = await docHolder.save();
        expect(savedDocument.resource.relations.undefrel[0]).toEqual('2');
        done();
    });


    it('throw exception if isRecordedIn relation is missing', async done => {

        validator.assertHasIsRecordedIn.and.callFake(() => { throw [M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN]; });

        const document: Document = {
            _id: '1',
            resource: {
                category: 'Find',
                id: '1',
                identifier: '1',
                relations: {}
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        docHolder.setDocument(document);

        try {
            await docHolder.save();
            fail();
        } catch (e) {
            expect(e).toEqual([M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN]);
        }
        done();
    });


    it('do not throw exception if isRecordedIn relation is found', async done => {

        const document: Document = {
            _id: '1',
            resource: {
                category: 'Find',
                id: '1',
                identifier: '1',
                relations: {
                    isRecordedIn: ['tX']
                }
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        docHolder.setDocument(document);

        try {
            await docHolder.save();
            done();
        } catch (e) {
            fail();
            done();
        }
    });


    it('do not throw exception if no isRecordedIn relation is expected', async done => {

        const document: Document = {
            _id: '1',
            resource: {
                category: 'Trench',
                id: '1',
                identifier: '1',
                relations: {}
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        docHolder.setDocument(document);

        try {
            await docHolder.save();
            done();
        } catch (e) {
            fail();
            done();
        }
    });


    it('convert strings to numbers for int & float fields', async done => {

        const document: Document = {
            _id: '1',
            resource: {
                category: 'Find',
                id: '1',
                identifier: '1',
                unsignedIntField: '7',
                unsignedFloatField: '7.49',
                floatField: '-7.49',
                relations: {}
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        docHolder.setDocument(document);
        const savedDocument = await docHolder.save();

        expect(savedDocument.resource.unsignedIntField).toBe(7);
        expect(savedDocument.resource.unsignedFloatField).toBe(7.49);
        expect(savedDocument.resource.floatField).toBe(-7.49);

        done();
    });
});
