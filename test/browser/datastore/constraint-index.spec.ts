import {ConstraintIndex} from "../../../app/datastore/constraint-index";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ConstraintIndex', () => {

        let ci;

        function doc(id) {
            return {
                resource: {
                    id: id,
                    identifier: 'identifier1',
                    relations: { } // TODO test for undefined relations,
                },
                created:
                    {
                        date: '2017-12-31'
                    },
                modified: [
                    {
                        date: '2018-01-01'
                    }
                ]
            }
        }

        it('multiple docs are recorded in another', () => {

            const docs = [
                doc('2'),
                doc('3')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['1'];
            docs[1].resource.relations['isRecordedIn'] = ['1'];

            ci = new ConstraintIndex([
                { path: 'resource.relations.isRecordedIn' }
            ]);
            ci.setDocs(docs);

            expect(ci.get({'resource.relations.isRecordedIn': '1'}).intersect(r=>r.id))
                .toEqual([{id: '2', date: '2018-01-01'}, {id: '3', date: '2018-01-01'}]);
        });

        function docWithMultipleConstraintTargets() {
            const docs = [
                doc('1')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['2', '3'];

            ci = new ConstraintIndex([
                { path: 'resource.relations.isRecordedIn' }
            ]);
            ci.setDocs(docs);
            return docs;
        }

        it('one doc is recorded in multiple others', () => {

            docWithMultipleConstraintTargets();

            expect(ci.get({'resource.relations.isRecordedIn': '2'}).intersect(r=>r.id))
                .toEqual([{id: '1', date: '2018-01-01'}]);
            expect(ci.get({'resource.relations.isRecordedIn': '3'}).intersect(r=>r.id))
                .toEqual([{id: '1', date: '2018-01-01'}]);
        });

        function docWithMultipleConstraints() {
            const docs = [
                doc('1')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['2'];
            docs[0].resource.relations['liesWithin'] = ['3'];

            ci = new ConstraintIndex([
                { path: 'resource.relations.liesWithin' } ,
                { path: 'resource.relations.isRecordedIn' },
                { path: 'resource.identifier', string: true },
            ]);
            ci.setDocs(docs);
            return docs;
        }

        it('works for multiple constrains', () => {

            docWithMultipleConstraints();

            expect(ci.get({'resource.relations.liesWithin': '3'}).intersect(r=>r.id))
                .toEqual([{id: '1', date: '2018-01-01'}]);
            expect(ci.get({'resource.relations.isRecordedIn': '2'}).intersect(r=>r.id))
                .toEqual([{id: '1', date: '2018-01-01'}]);
        });

        it('index also works if doc does not have the field', () => {

            const docs = [
                doc('1')
            ];

            ci = new ConstraintIndex([
                { path: 'resource.relations.liesWithin' }
            ]);
            ci.setDocs(docs);

            expect(ci.get({'resource.relations.liesWithin': '3'}).intersect(r=>r.id))
                .toEqual([]);
        });

        function docWithIdentifier() {
            const docs = [
                doc('1')
            ];

            ci = new ConstraintIndex([
                { path: 'resource.identifier', string: true }
            ]);
            ci.setDocs(docs);
            return docs;
        }

        it('work with non arrays', () => {

            docWithIdentifier();

            expect(ci.get({'resource.identifier': 'identifier1'}).intersect(r=>r.id))
                .toEqual([{id: '1', date: '2018-01-01'}]);
        });

        it('clear index', () => {

            docWithIdentifier();

            ci.clear();

            expect(ci.get({'resource.identifier': 'identifier1'}).intersect(r=>r.id))
                .toEqual([ ]);
        });

        it('ask for non existing index', () => {

            const docs = [
            ];

            ci = new ConstraintIndex([ ]);
            ci.setDocs(docs);

            expect(ci.get({'resource.identifier': 'identifier1'}))
                .toEqual(undefined);
        });

        it('ask without constraints', () => {

            const docs = [
            ];

            ci = new ConstraintIndex([ ]);
            ci.setDocs(docs);

            expect(ci.get(undefined))
                .toEqual(undefined);
        });

        it('ask for one existing index and one nonexisting index', () => {

            const docs = [
            ];

            ci = new ConstraintIndex([
                { path: 'resource.identifier' }
            ]);
            ci.setDocs(docs);

            expect(ci.get({'resource.identifier': 'identifier1'}).intersect(r=>r.id))
                .toEqual([ ]);
        });

        it('remove doc', () => {

            const doc = docWithMultipleConstraints()[0];

            ci.remove(doc);

            expect(ci.get({'resource.identifier': 'identifier1'}).intersect(r=>r.id))
                .toEqual([ ]);
            expect(ci.get({'resource.relations.isRecordedIn': '2'}).intersect(r=>r.id))
                .toEqual([ ]);
            expect(ci.get({'resource.relations.liesWithin': '3'}).intersect(r=>r.id))
                .toEqual([ ]);
        });

        it('remove where one doc was recorded in multiple docs for the same constraint', () => {

            const doc = docWithMultipleConstraintTargets()[0];

            ci.remove(doc);

            expect(ci.get({'resource.relations.isRecordedIn': '2'}).intersect(r=>r.id))
                .toEqual([ ]);
            expect(ci.get({'resource.relations.isRecordedIn': '3'}).intersect(r=>r.id))
                .toEqual([ ]);
        });

        it('update docs where the relations change', () => {

            let doc = docWithMultipleConstraints()[0];

            doc.resource.relations['isRecordedIn'] = ['4'];
            doc.resource.relations['liesWithin'] = ['5'];
            doc.resource.identifier = 'identifier2';
            ci.update(doc);

            expect(ci.get({'resource.identifier': 'identifier1'}).intersect(r=>r.id))
                .toEqual([ ]);
            expect(ci.get({'resource.relations.isRecordedIn': '2'}).intersect(r=>r.id))
                .toEqual([ ]);
            expect(ci.get({'resource.relations.liesWithin': '3'}).intersect(r=>r.id))
                .toEqual([ ]);

            expect(ci.get({'resource.identifier': 'identifier2'}).intersect(r=>r.id))
                .toEqual([{id: '1', date: '2018-01-01'}]);
            expect(ci.get({'resource.relations.isRecordedIn': '4'}).intersect(r=>r.id))
                .toEqual([{id: '1', date: '2018-01-01'}]);
            expect(ci.get({'resource.relations.liesWithin': '5'}).intersect(r=>r.id))
                .toEqual([{id: '1', date: '2018-01-01'}]);
        });

        it('query for unkown', () => {

            const docs = [
                doc('1'),
                doc('2')
            ];
            docs[0].resource.relations['liesWithin'] = ['3'];

            ci = new ConstraintIndex([
                { path: 'resource.relations.liesWithin' } ,
            ]);
            ci.setDocs(docs);

            expect(ci.get({'resource.relations.liesWithin': 'UNKOWN'}).intersect(r=>r.id))
                .toEqual([{id: '2', date: '2018-01-01'}]);
        });

        it('query with multiple constraints at the same time', () => {

            const docs = [
                doc('1'),
                doc('2')
            ];
            docs[0].resource.relations['liesWithin'] = ['3'];
            docs[0].resource.relations['isRecordedIn'] = ['2'];
            docs[1].resource.relations['isRecordedIn'] = ['2'];

            ci = new ConstraintIndex([
                { path: 'resource.relations.isRecordedIn' },
                { path: 'resource.relations.liesWithin' }
            ]);
            ci.setDocs(docs);

            expect(ci.get(
                {
                    'resource.relations.liesWithin': '3',
                    'resource.relations.isRecordedIn': '2'
                }
                ).intersect(r=>r.id))
                .toEqual([{id: '1', date: '2018-01-01'}]);
        });

        // TODO update docs where doc is new

        // TODO remove the target docs, for example delete the trench, then also the findings recorded in in are not to be found
    });
}