import { RESOURCE_DOT_ID } from 'idai-field-core';
import { Document, Relations } from 'idai-field-core';
import { includedIn, isArray, isnt, isUndefined, isUndefinedOrEmpty, on, isObject } from 'tsfun';
import { makeLookup } from '../../../../../../core/src/tools/transformers';
import { ImportContext, ImportHelpers, ImportOptions } from './import-documents';
import { ImportErrors as E } from './import-errors';
import { Find, Get, Id, Identifier, IdentifierMap } from './types';
import { iterateRelationsInImport } from './utils';
import LIES_WITHIN = Relations.Hierarchy.LIESWITHIN;

// @author Thomas Kleinke
// @author Daniel de Oliveira


/**
 * When useIdentifiersInRelations
 * sets (defined) inverse relations in relation targets, when not already existent.
 *
 * Expects documents to have at least empty relations ({}).
 * Relations set to null are left untouched.
 *
 * @throws FATAL - should not be handled.
 *
 * // TODO nulls here should not exist, because we are not in merge mode
 */
export function complementInverseRelationsBetweenImportDocs(context: ImportContext,
                                                            options: ImportOptions,
                                                            documents: Array<Document> /*inplace*/) {

    if (!options.useIdentifiersInRelations) return;
    const identifierLookup = makeLookup(['resource','identifier'])(documents);

    for (const document of documents) {
        const identifier = document.resource.identifier;
        const relations = document.resource.relations;

        for (const relation of Object.keys(relations)) {
            if (relations[relation] === null) continue;

            const inverse = context.inverseRelationsMap[relation];
            if (inverse) for (const targetIdentifier of relations[relation]) {
                if (!identifierLookup[targetIdentifier]) continue; // this means it must point to an existing resource, which gets validated later

                const targetRelations = identifierLookup[targetIdentifier].resource.relations;
                if (!isObject(targetRelations)) throw 'FATAL - relations should exist';

                if (targetRelations[inverse] === null) {
                    // do nothing
                } else if (targetRelations[inverse] === undefined) {
                    targetRelations[inverse] = [identifier];
                } else {
                    if (!targetRelations[inverse].includes(identifier)) {

                        targetRelations[inverse].push(identifier);
                    }
                }
            }
        }
    }
}


export function makeSureRelationStructuresExists(documents: Array<Document>) {

    for (const document of documents) {
        if (document.resource.relations === undefined) {
            document.resource.relations = {};
        }
    }
}



/**
 * Converts identifiers in relations to ids, if useIdentifiersInRelations is true.
 * Converts PARENT relations to LIES_WITHIN.
 * Makes sure the resources have at least an empty relations map.
 *
 * @throws ImportErrors.*
 * @throws [MISSING_RELATION_TARGET]
 * @throws [MUST_BE_ARRAY]
 * @throws [INVALID_RELATIONS]
 * @throws [PARENT_MUST_NOT_BE_ARRAY]
 */
export async function preprocessRelations(documents: Array<Document>,
                                          helpers: ImportHelpers,
                                          { mergeMode, permitDeletions, useIdentifiersInRelations}: ImportOptions) {

    const generateId = helpers.generateId;
    const identifierMap: IdentifierMap = mergeMode ? {} : assignIds(documents, generateId);

    for (let document of documents) {
        const relations = document.resource.relations;
        if (!relations) throw 'FATAL - relations should exist';

        adjustRelations(document, relations);
        removeSelfReferencingIdentifiers(relations, document.resource.identifier); // TODO do in makeSureRelationStructuresExist; rename that one
        if (!permitDeletions) Relations.removeEmpty(relations);
        if (useIdentifiersInRelations) {
            await rewriteIdentifiersInRelations(relations, helpers.find, identifierMap);
        } else {
            await assertNoMissingRelationTargets(relations, helpers.get)
        }
    }
}


async function rewriteIdentifiersInRelations(relations: Relations,
                                             find: Find,
                                             identifierMap: IdentifierMap) {

    return iterateRelationsInImport(relations, async (relation: string, identifier: Identifier, i: number) => {
        if (identifierMap[identifier]) {
            relations[relation][i] = identifierMap[identifier];
        } else {
            const found = await find(identifier);
            if (!found) throw [E.PREVALIDATION_MISSING_RELATION_TARGET, identifier];
            relations[relation][i] = found.resource.id;
        }
    });
}


async function assertNoMissingRelationTargets(relations: Relations, get: Get) {

    return iterateRelationsInImport(relations,
        async (_: never, id: Id, __: never) => {
            try { await get(id) }
            catch { throw [E.PREVALIDATION_MISSING_RELATION_TARGET, id] }
        });
}


function assignIds(documents: Array<Document>,
                   generateId: Function): IdentifierMap {

    return documents
        .filter(on(RESOURCE_DOT_ID, isUndefined))
        .reduce((identifierMap, document) => {

        identifierMap[document.resource.identifier] = document.resource.id = generateId();
        return identifierMap;

    }, {} as IdentifierMap);
}


function adjustRelations(document: Document, relations: Relations) {

    assertHasNoHierarchicalRelations(document);
    const assertIsntArrayRelation = assertIsNotArrayRelation(document);

    Object.keys(document.resource.relations)
        .filter(isnt(Relations.PARENT))
        .forEach(assertIsntArrayRelation);

    assertParentNotArray(relations[Relations.PARENT], document.resource.identifier);
    if (relations[Relations.PARENT]) {
        (relations[LIES_WITHIN] = [relations[Relations.PARENT] as any]) && delete relations[Relations.PARENT];
    }
}


/**
 * Hierarchical relations are not used directly but instead one uses PARENT.
 */
function assertHasNoHierarchicalRelations(document: Document) {

    const foundForbiddenRelations = Object.keys(document.resource.relations)
        .filter(includedIn(Relations.Hierarchy.ALL))
        .join(', ');
    if (foundForbiddenRelations) {
        throw [E.INVALID_RELATIONS, document.resource.category, foundForbiddenRelations];
    }
}


function assertIsNotArrayRelation(document: Document) {

    return (name: string) => {

        const relationValue = document.resource.relations[name];
        if (!isArray(relationValue) && relationValue !== null) throw [E.MUST_BE_ARRAY, document.resource.identifier];
    }
}


function assertParentNotArray(parentRelation: any, resourceIdentifier: string) {

    if (isArray(parentRelation)) throw [E.PARENT_MUST_NOT_BE_ARRAY, resourceIdentifier];
}


function removeSelfReferencingIdentifiers(relations: Relations, resourceIdentifier: Identifier) {

    for (let relName of Object.keys(relations)) {
        if (relations[relName] === null) continue;

        relations[relName] = relations[relName].filter(isnt(resourceIdentifier));
        if (isUndefinedOrEmpty(relations[relName])) delete relations[relName];
    }
}
