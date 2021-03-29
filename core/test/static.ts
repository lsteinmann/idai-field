import {Document} from 'idai-components-2';
import { FeatureDocument } from '../src/model/feature-document';
import { FieldDocument } from '../src/model/field-document';


// TODO duplicated, get rid of this
export class Static {

    public static fieldDoc = (sd, identifier?, category?, id?) =>
        Static.doc(sd, identifier, category, id) as FieldDocument;


    public static featureDoc = (sd, identifier?, category?, id?) => {

        const doc = Static.doc(sd, identifier, category, id) as FeatureDocument;
        doc.resource.relations.isContemporaryWith = [];
        doc.resource.relations.isBefore = [];
        doc.resource.relations.isAfter = [];
        return doc;
    };


    public static doc(sd, identifier?, category?, id?): Document {

        if (!identifier) identifier = 'identifer';
        if (!category) category = 'Find';
        const doc: Document = {
            _id: 'A',
            resource : {
                id: 'A',
                shortDescription: sd,
                identifier: identifier,
                title: 'title',
                category: category,
                relations : {}
            },
            created: {
                user: 'anonymous',
                date: new Date()
            },
            modified: [
                {
                    user: 'anonymous',
                    date: new Date()
                }
            ]
        };
        if (id) {
            doc._id = id;
            doc.resource.id = id;
        } else delete doc.resource.id;
        return doc as Document;
    }
}
