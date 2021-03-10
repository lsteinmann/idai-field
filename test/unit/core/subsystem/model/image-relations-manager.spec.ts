import {
    createApp, createHelpers,
    setupSyncTestDb
} from '../subsystem-helper';
import {ImageRelations} from '../../../../../src/app/core/model/relation-constants';


describe('subsystem/image-relations-manager', () => {

    let app;
    let helpers;


    beforeEach(async done => {

        await setupSyncTestDb();
        app = await createApp();
        helpers = createHelpers(app);
        helpers.createProjectDir();

        spyOn(console, 'error');
        // spyOn(console, 'warn');
        done();
    });


    it('remove TypeCatalog with images', async done => {

        const documentsLookup = await helpers.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        await helpers.expectDocuments('tc1', 't1', 'i1', 'i2');
        helpers.expectImagesExist('i1', 'i2');

        await app.imageRelationsManager.remove(documentsLookup['tc1']);

        await helpers.expectDocuments();
        helpers.expectImagesDontExist('i1', 'i2')
        done();
    });


    it('remove Type with images', async done => {

        const documentsLookup = await helpers.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        await helpers.expectDocuments('tc1', 't1', 'i1', 'i2');
        helpers.expectImagesExist('i1', 'i2');

        await app.imageRelationsManager.remove(documentsLookup['t1']);

        await helpers.expectDocuments('tc1', 'i1');
        helpers.expectImagesExist('i1');
        helpers.expectImagesDontExist('i2');
        done();
    });


    it('remove Type and Catalog with same image', async done => {

        const documentsLookup = await helpers.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        await helpers.expectDocuments('tc1', 't1', 'i1');
        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove(documentsLookup['tc1']);

        await helpers.expectDocuments();
        helpers.expectImagesDontExist('i1');
        done();
    });


    it('do not remove images (with TypeCatalog) which are also connected to other resources', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['r1', 'Find'],
                ['i1', 'Image', ['tc1']],
                ['i2', 'Image', ['t1', 'r1']]
            ]
        );

        await helpers.expectDocuments('tc1', 't1', 'r1', 'i1', 'i2');
        helpers.expectImagesExist('i1', 'i2');

        await app.imageRelationsManager.remove(documentsLookup['tc1']);

        await helpers.expectDocuments('i2', 'r1');
        helpers.expectImagesDontExist('i1');
        helpers.expectImagesExist('i2');
        done();
    });


    it('remove 2 type with shared images', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1', 't2']],
                ['t1', 'Type'],
                ['t2', 'Type'],
                ['i1', 'Image', ['t1', 't2']]
            ]
        );

        await helpers.expectDocuments('tc1', 't1', 't2', 'i1');
        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove(documentsLookup['t1'], documentsLookup['t2']);

        await helpers.expectDocuments('tc1');
        helpers.expectImagesDontExist('i1');
        done();
    });


    it('remove 2 type with shared images, but image is also connected to other resources', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1', 't2']],
                ['t1', 'Type'],
                ['t2', 'Type'],
                ['i1', 'Image', ['t1', 't2', 'r1']],
                ['r1', 'Find']
            ]
        );

        await helpers.expectDocuments('tc1', 't1', 't2', 'i1', 'r1');
        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove(documentsLookup['t1'], documentsLookup['t2']);

        await helpers.expectDocuments('tc1', 'r1', 'i1');
        helpers.expectImagesExist('i1');
        done();
    });


    it('do not remove images (with TypeCatalog) which are also connected to ancestor resources', async done => {

        const documentsLookup = await helpers.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        await helpers.expectDocuments('tc1', 't1', 'i1');
        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove(documentsLookup['t1']);

        await helpers.expectDocuments('tc1', 'i1');
        helpers.expectImagesExist('i1');
        done();
    });


    it('remove images', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['i1', 'Image', ['tc1']]
            ]
        );
        expect(documentsLookup['tc1'].resource.relations[ImageRelations.ISDEPICTEDIN]).toEqual(['i1']);
        await app.imageRelationsManager.remove(documentsLookup['i1']);

        await helpers.expectDocuments('tc1');
        const tc1 = await app.documentDatastore.get('tc1');
        expect(tc1.resource.relations[ImageRelations.ISDEPICTEDIN]).toBeUndefined();
        done();
    });


    it('remove images - where image is connected to another resource, but is nevertheless deleted because image is amongst resources to be deleted', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['t1', 'Type'],
                ['i1', 'Image', ['t1', 'r1']],
                ['r1', 'Find']
            ]
        );

        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove(documentsLookup['t1'], documentsLookup['i1']);

        await helpers.expectDocuments('r1');
        helpers.expectImagesDontExist('i1');
        done();
    });


    it('add depicts relation', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['i1', 'Image']
            ]
        );

        expect(documentsLookup['tc1'].resource.relations[ImageRelations.ISDEPICTEDIN]).toBeUndefined()
        expect(documentsLookup['i1'].resource.relations[ImageRelations.DEPICTS]).toEqual([]);

        await app.imageRelationsManager.link(documentsLookup['tc1'], documentsLookup['i1']);

        const tc1 = await app.documentDatastore.get('tc1');
        const i1 = await app.documentDatastore.get('i1');
        expect(tc1.resource.relations[ImageRelations.ISDEPICTEDIN]).toEqual(['i1']);
        expect(i1.resource.relations[ImageRelations.DEPICTS]).toEqual(['tc1']);
        done();
    });


    it('add depicts relation - throw if trying to link image with resource if either is not owned', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['i1', 'Image']
            ]
        );

        documentsLookup['tc1'].project = 'other-project';
        try {
            await app.imageRelationsManager.link(documentsLookup['tc1'], documentsLookup['i1']);
            fail();
        } catch {}

        documentsLookup['i1'].project = 'other-project';
        try {
            await app.imageRelationsManager.link(documentsLookup['tc1'], documentsLookup['i1']);
            fail();
        } catch {}
        done();
    });


    it('remove depicts relation', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['i1', 'Image', ['tc1']]
            ]
        );

        expect(documentsLookup['tc1'].resource.relations[ImageRelations.ISDEPICTEDIN]).toEqual(['i1'])
        expect(documentsLookup['i1'].resource.relations[ImageRelations.DEPICTS]).toEqual(['tc1']);

        await app.imageRelationsManager.unlink(documentsLookup['i1']);

        const tc1 = await app.documentDatastore.get('tc1');
        const i1 = await app.documentDatastore.get('i1');
        expect(tc1.resource.relations[ImageRelations.ISDEPICTEDIN]).toBeUndefined();
        expect(i1.resource.relations[ImageRelations.DEPICTS]).toEqual([]);
        done();
    });
});
