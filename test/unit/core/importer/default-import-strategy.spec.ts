import {DefaultImportStrategy} from '../../../../app/core/import/default-import-strategy';
import {ImportStrategy} from '../../../../app/core/import/import-strategy';

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportStrategy', () => {

    let mockDatastore;
    let mockValidator;
    let mockSettingsService;
    let mockConfigLoader;
    let importStrategy: ImportStrategy;


    beforeEach(() => {
        mockDatastore = jasmine.createSpyObj('datastore', ['create']);
        mockValidator = jasmine.createSpyObj('validator', ['validate']);
        mockSettingsService = jasmine.createSpyObj('settingsService', ['getUsername']);
        mockConfigLoader = jasmine.createSpyObj('configLoader', ['getProjectConfiguration']);

        mockValidator.validate.and.callFake(function() { return Promise.resolve(); });
        mockDatastore.create.and.callFake(function(a) { return Promise.resolve(a); });
        mockSettingsService.getUsername.and.callFake(function() { return 'testuser'; });
        mockConfigLoader.getProjectConfiguration.and.callFake(function() { return null; });

        importStrategy = new DefaultImportStrategy(mockValidator, mockDatastore, mockSettingsService,
            mockConfigLoader);
    });


    it('should resolve on success', async done => {

        await importStrategy.importDoc({ resource: {type: undefined, id: undefined, relations: undefined } })
        done();
    });


    it('should reject on err in validator', async done => {

        mockValidator.validate.and.callFake(function() { return Promise.reject(['abc']); });

        try {
            await importStrategy.importDoc({resource: {type: undefined, id: undefined, relations: undefined}})
            fail();
        } catch (err) {
            expect(err[0]).toBe('abc');
        }
        done();
    });


    it('should reject on err in datastore', async done => {

        mockDatastore.create.and.callFake(function() { return Promise.reject(['abc']); });

        try {
            await importStrategy.importDoc({resource: {type: undefined, id: undefined, relations: undefined}})
            fail();
        } catch (err) {
            expect(err[0]).toBe('abc');
        }
        done();
    });
});