import {Document} from 'idai-components-2';
import {isNot, includedIn, isDefined, isEmpty, flatMap, to, on, empty, copy, is} from 'tsfun';
import {Edges} from './edges-builder';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module DotBuilder {

    export function build(projectConfiguration: ProjectConfiguration,
                          groups: { [group: string]: Array<Document> },
                          hierarchyClustering: boolean,
                          edges: { [id: string]: Edges },
                          findDocs: Array<Document>,
                          sampleDocs: Array<Document>,
                          curvedLineMode = true): string {

        const documents: Array<Document> = getDocuments(groups);

        return 'digraph { newrank=true; '
            + createNodeDefinitions(projectConfiguration, groups, findDocs, sampleDocs)
            + createRootDocumentMinRankDefinition(documents, edges)
            + createAboveEdgesDefinitions(documents, edges)
            + createSameRankEdgesDefinitions(documents, edges)
            + (hierarchyClustering ? createHierarchyCluster(projectConfiguration, documents) : '')
            + (!curvedLineMode ? ' splines=ortho }' : '}');
    }


    function findParents(docs: Array<Document>) {
        const parentIds: Array<string> = flatMap((doc: Document) => doc.resource.relations['liesWithin'] || [])(docs);
        return parentIds;
    }

    function checkIfParent(child: Document, parentIds: Array<string>): boolean {
        return parentIds.find((id: string) => id === child.resource.id) !== undefined;
    }

    function checkIfRoot(doc: Document): boolean {
        return (doc.resource.relations['liesWithin'] || []).length == 0;
    }

    function findChildren(projectConfiguration:ProjectConfiguration, docs: Array<Document>, clusterParentId: string, parentIds: Array<string>) {
        const children = docs.filter((doc: Document) => (doc.resource.relations['liesWithin'] || []).includes(clusterParentId));

        return children.map(doc => {
            if (checkIfParent(doc, parentIds)) {
                return 'subgraph "cluster ' + doc.resource.identifier + '" { ' +
                'label = "' + doc.resource.identifier + '" '
                + 'fontname="Roboto" '
                + 'color=grey '
                + 'bgcolor="'
                + projectConfiguration.getColorForCategory(doc.resource.category) +'60" '
                + 'style=dotted ' +
                '"' + doc.resource.identifier + '"; ' + 
                findChildren(projectConfiguration, docs, doc.resource.id, parentIds) +
                '} ';
            } else {                
                return `"${doc.resource.identifier}"; `;
            }
        }).join(" ")
    }


    function createHierarchyCluster(projectConfiguration:ProjectConfiguration, docs: Array<Document>) {
        const parentIds = findParents(docs);
        
        return docs.map(doc => {
            if (checkIfRoot(doc)) {
                if (checkIfParent(doc, parentIds)) {
                    return 'subgraph "cluster ' + doc.resource.identifier + '" { ' +
                    'label = "' + doc.resource.identifier + '" '
                    + 'fontname="Roboto" '
                    + 'labelcolor="red"'
                    + 'color=grey '
                    + 'bgcolor="grey90" '
                    + 'style=dotted ' +
                    '"' + doc.resource.identifier + '"' + 
                    findChildren(projectConfiguration, docs, doc.resource.id, parentIds) +
                    '} '
                }
            }
            return ''
        }).join('')
    }


    function getDocuments(groups: { [group: string]: Array<Document> }): Array<Document> {

        return flatMap<any, any>(group => groups[group])(Object.keys(groups))
    }


    function createSameRankEdgesDefinitions(documents: Array<Document>,
                                            edges: { [id: string]: Edges }): string {

        if (!hasSameRankEdges(edges)) return '';

        const result: string =
            documents
                .reduce(([defs, processedSameRankTargetIds]: [Array<string|undefined>, string[]], document) => {
                    const [def, updatedProcessedSameRankTargetIds] = createSameRankEdgesDefinition(
                        documents, document, edges[document.resource.id], processedSameRankTargetIds
                    );
                    return [defs.concat(def), updatedProcessedSameRankTargetIds];
                }, [[], []])[0]
                .filter(isDefined)
                .join(' ');

        return result.length > 0 ? result + ' ' : result;
    }


    function createAboveEdgesDefinitions(documents: Array<Document>,
                                         edges: { [id: string]: Edges }): string {

        const result: string = documents
            .map(createAboveEdgesDefinition(documents, edges))
            .filter(isDefined)
            .join(' ');

        return result.length > 0 ? result + ' ' : result;
    }


    function createRootDocumentMinRankDefinition(documents: Array<Document>,
                                                 edges: { [id: string]: Edges }): string {

        const rootDocuments = documents.filter(isRootDocument(documents, edges));

        return rootDocuments.length === 0 ? '' :
            '{rank=min "'
            + rootDocuments
                .map(to('resource.identifier'))
                .join('", "')
            + '"} ';
    }


    function createNodeDefinitions(projectConfiguration: ProjectConfiguration,
                                   groups: { [group: string]: Array<Document> },
                                   findDocs: Array<Document>,
                                   sampleDocs: Array<Document>): string {

        return 'node [style=filled, fontname="Roboto"] '
            + Object
                .keys(groups)
                .map(group => createNodeDefinitionsForGroup(
                    projectConfiguration, group, groups[group], findDocs, sampleDocs)
                )
                .join('');
    }


    function createNodeDefinitionsForGroup(projectConfiguration: ProjectConfiguration,
                                           group: string, documents: Array<Document>,
                                           findDocs: Array<Document>, sampleDocs: Array<Document>): string {

        const nodeDefinitions: string =
            documents
                .map(createNodeDefinition(projectConfiguration, findDocs, sampleDocs))
                .join('');

        return group === 'UNKNOWN'
            ? nodeDefinitions
            : 'subgraph "cluster ' + group + '" '
                + '{label="' + group + '" '
                + 'fontname="Roboto" '
                + 'color=grey '
                + 'bgcolor=aliceblue '
                + 'style=dashed '
                + nodeDefinitions + '} ';
    }


    function getRelationTargetIdentifiers(documents: Array<Document>, targetIds: string[]): string[] {

        return targetIds
            .map(findIdentifierIn(documents))
            .filter(isNot(empty))
    }


    function isRootDocument(documents: Array<Document>, edges: { [id: string]: Edges },
                            processedDocuments: string[] = []) {

        return (document: Document): boolean => {

            const documentEdges: Edges = edges[document.resource.id];

            if (isEmpty(documentEdges.aboveIds) || isNot(empty)(documentEdges.belowIds)) return false;

            processedDocuments.push(document.resource.id);

            return !isSameRankNonRootDocument(documents, documentEdges.sameRankIds, processedDocuments, edges);
        }
    }


    function isSameRankNonRootDocument(documents: Array<Document>, sameRankRelationTargets: string[],
                                       processedDocuments: string[], edges: { [id: string]: Edges }) {

        return (undefined !==
            sameRankRelationTargets
                .filter(isNot(includedIn(processedDocuments)))
                .find(isNonRootDocument(documents, processedDocuments, edges)));
    }


    function isNonRootDocument(documents: Array<Document>,
                               processedDocuments: string[], edges: { [id: string]: Edges }) {

        return (targetId: string) => {

            const targetDocument = documents.find(on('resource.id', is(targetId)));
            return (targetDocument
                && !isRootDocument(documents, edges, processedDocuments)(targetDocument)) === true;
        }
    }


    function createSameRankEdgesDefinition(documents: Array<Document>, document: Document, edges: Edges,
                                           processedSameRankTargetIds: string[]): [string|undefined, string[]] {

        const targetIds: string[]|undefined = edges.sameRankIds
            .filter(isNot(includedIn(processedSameRankTargetIds)));

        const updatedProcessedSameRankTargetIds: string[] =
            copy(processedSameRankTargetIds).concat(document.resource.id);

        if (isEmpty(targetIds)) return [undefined, copy(updatedProcessedSameRankTargetIds)];

        return [createEdgesDefinitions(targetIds, documents, document)
            + ' '
            + createSameRankDefinition(
                getRelationTargetIdentifiers(documents, [document.resource.id].concat(targetIds))
            ), updatedProcessedSameRankTargetIds];
    }


    function createEdgesDefinitions(targetIds: string[], documents: Document[], document: Document) {

        return targetIds
            .map(targetId => {
                const targetIdentifiers = getRelationTargetIdentifiers(documents, [targetId]);
                return targetIdentifiers.length === 0 ? '' :
                    createEdgesDefinition(document.resource.identifier, targetIdentifiers)
                    + ' [dir="none", class="same-rank-' + document.resource.id
                    + ' same-rank-' + targetId + '"]';
            })
            .join(' ');
    }


    function createSameRankDefinition(targetIdentifiers: string[]): string {

        return '{rank=same "' + targetIdentifiers.join('", "') + '"}';
    }


    function findIdentifierIn(documents: Array<Document>) {

        return (id: string): string => {

            const document: Document|undefined = documents.find(on('resource.id', is(id)));
            return document ? document.resource.identifier : '';
        }
    }


    function createAboveEdgesDefinition(documents: Array<Document>,
                                        edges: { [id: string]: Edges }) {

        return (document: Document): string|undefined => {

            const targetIds = edges[document.resource.id].aboveIds;
            if (targetIds.length === 0) return;

            return targetIds
                .map(createEdgeDefinition(documents, document.resource.id, document.resource.identifier))
                .join(' ');
        }
    }


    function createEdgeDefinition(documents: Array<Document>, resourceId: string, resourceIdentifier: string) {

        return (targetId: string): string => {

            return '"' + resourceIdentifier + '" -> "' + findIdentifierIn(documents)(targetId) + '"'
                + ' [class="above-' + resourceId + ' below-' + targetId + '"'
                + '  arrowsize="0.37" arrowhead="normal"]';
        }
    }


    function createEdgesDefinition(resourceIdentifier: string, targetIdentifiers: string[]): string {

        return targetIdentifiers.length == 1
            ? '"' + resourceIdentifier + '" -> "' + targetIdentifiers[0] + '"'
            : '"' + resourceIdentifier + '" -> {"' + targetIdentifiers.join('", "') + '"}';
    }


    function createNodeDefinition(projectConfiguration: ProjectConfiguration, findDocs: Array<Document>, sampleDocs: Array<Document>) {

        return (document: Document) => {
            const findCategories = [...new Set(findDocs.filter(fd => (fd.resource.relations['liesWithin'] || []).includes(document.resource.id)).map(fd => fd.resource.category))];
            let fishEyes = '';
            if (findCategories.length > 0) {
                fishEyes = '<br />' + findCategories.map(c => `<font bgcolor="white" color="${projectConfiguration.getColorForCategory(c)}">&#9673;</font>`).join('');
            }
            let diamond = '';
            if (sampleDocs.find(s => (s.resource.relations['liesWithin'] || []).includes(document.resource.id))) {
                diamond = '&#9670;<br />';
            }
            return '"' + document.resource.identifier + '"' // <- important to enclose the identifier in "", otherwise -.*# etc. cause errors or unexpected behaviour
                + ' [id="node-' + document.resource.id + '" fillcolor="'
                + projectConfiguration.getColorForCategory(document.resource.category)
                + '" color="'
                + projectConfiguration.getColorForCategory(document.resource.category)
                + '" fontcolor="'
                + projectConfiguration.getTextColorForCategory(document.resource.category)
                + '" label=< ' + diamond + document.resource.identifier + fishEyes + ' >] ';
        }
    }


    function hasSameRankEdges(edges: { [id: string]: Edges }): boolean {

        return isDefined(
                Object
                    .values(edges)
                    .find(isNot(on('sameRankIds', empty)))
            );
    }
}