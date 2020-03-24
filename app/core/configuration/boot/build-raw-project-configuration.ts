import {assoc, clone, cond, dissoc, dissocOn, flow, includedIn, isDefined, isNot, keys, keysAndValues, map, Map, on,
    reduce, subtract, undefinedOrEmpty, update, identity, compose} from 'tsfun';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {ConfigurationErrors} from './configuration-errors';
import {ValuelistDefinition} from '../model/valuelist-definition';
import {debugId, withDissoc} from '../../util/utils';
import {TransientFieldDefinition, TransientCategoryDefinition} from '../model/transient-category-definition';
import {BuiltinCategoryDefinition} from '../model/builtin-category-definition';
import {mergeBuiltInWithLibraryCategories} from './merge-builtin-with-library-categories';
import {Assertions} from './assertions';
import {getDefinedParents, iterateOverFieldsOfCategories} from './helpers';
import {addSourceField} from './add-source-field';
import {mergeCategories} from './merge-categories';
import {addExtraFields} from './add-extra-fields';
import {copy} from 'tsfun/src/collection';
import {hideFields} from './hide-fields';
import {RelationDefinition} from '../model/relation-definition';
import {addRelations} from './add-relations';
import {applyLanguage} from './apply-language';
import {applySearchConfiguration} from './apply-search-configuration';
import {orderFields} from './order-fields';
import {makeCategoriesMap} from './make-categories-map';
import {RawProjectConfiguration} from '../project-configuration';


const CATEGORIES = 'categories';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildRawProjectConfiguration(builtInCategories: Map<BuiltinCategoryDefinition>,
                                             libraryCategories: Map<LibraryCategoryDefinition>,
                                             customCategories: Map<CustomCategoryDefinition> = {},
                                             commonFields: Map = {},
                                             valuelistsConfiguration: Map<ValuelistDefinition> = {},
                                             extraFields: Map = {},
                                             relations: Array<RelationDefinition> = [],
                                             languageConfiguration: any = {},
                                             customLanguageConfiguration: any = {},
                                             searchConfiguration: any = {},
                                             orderConfiguration: any = {},
                                             validateFields: any = identity): RawProjectConfiguration {

    Assertions.performAssertions(builtInCategories, libraryCategories, customCategories, commonFields, valuelistsConfiguration);
    addSourceField(builtInCategories, libraryCategories, customCategories, commonFields);

    return flow(
        mergeBuiltInWithLibraryCategories(builtInCategories, libraryCategories),
        Assertions.assertInputTypesAreSet(Assertions.assertInputTypePresentIfNotCommonField(commonFields)),
        Assertions.assertNoDuplicationInSelection(customCategories),
        mergeCategories(customCategories, Assertions.assertInputTypePresentIfNotCommonField(commonFields)),
        eraseUnusedCategories(keys(customCategories)),
        replaceCommonFields(commonFields),
        insertValuelistIds,
        Assertions.assertValuelistIdsProvided,
        hideFields(customCategories),
        toCategoriesByFamilyNames,
        replaceValuelistIdsWithValuelists(valuelistsConfiguration as any),
        addExtraFields(extraFields),
        wrapCategoriesInObject,
        addRelations(relations),
        applyLanguage(languageConfiguration),
        applyLanguage(customLanguageConfiguration),
        applySearchConfiguration(searchConfiguration),
        update(CATEGORIES, processCategories(orderConfiguration, validateFields)),
        asRawProjectConfiguration);
}


const asRawProjectConfiguration = ({categories, relations}: any) => ([categories, relations]);


function processCategories(orderConfiguration: any, validateFields: any) {

    return compose(
        addExtraFieldsOrder(orderConfiguration),
        orderFields(orderConfiguration),
        validateFields,
        makeCategoriesMap,
        map(dissoc('fields')),
        map(dissocOn('parentCategory.fields'))
    );
}


function addExtraFieldsOrder(orderConfiguration: any) {

    return (categories: any) => {

        if (!orderConfiguration.fields) orderConfiguration.fields = {};

        Object.keys(categories).forEach(categoryName => {
            if (!orderConfiguration.fields[categoryName]) orderConfiguration.fields[categoryName] = [];
            orderConfiguration.fields[categoryName]
                = [].concat(orderConfiguration.fields[categoryName]);
        });

        return categories;
    }
}


function wrapCategoriesInObject(configuration: Map<TransientCategoryDefinition>) {

    return { categories: configuration, relations: [], groups: {} }
}


function insertValuelistIds(mergedCategories: Map<TransientCategoryDefinition>) {

    iterateOverFieldsOfCategories(mergedCategories,
        (categoryName, category, fieldName, field) => {

        if (category.valuelists && category.valuelists[fieldName]) {
            field.valuelistId = category.valuelists[fieldName];
        }
    });

    return mergedCategories;
}


function replaceValuelistIdsWithValuelists(valuelistDefinitionsMap: Map<ValuelistDefinition>)
    : (categories: Map<TransientCategoryDefinition>) => Map<TransientCategoryDefinition> {

    return map(
        cond(
            on(TransientCategoryDefinition.FIELDS, isNot(undefinedOrEmpty)),
            update(TransientCategoryDefinition.FIELDS,
                map(
                    cond(
                        on(TransientFieldDefinition.VALUELISTID, isDefined),
                        replaceValuelistIdWithActualValuelist(valuelistDefinitionsMap)))))) as any;
}


function replaceValuelistIdWithActualValuelist(valuelistDefinitionMap: Map<ValuelistDefinition>) {

    return (fd: TransientFieldDefinition) =>
        flow(fd,
            assoc(TransientFieldDefinition.VALUELIST, valuelistDefinitionMap[fd.valuelistId!]),
            dissoc(TransientFieldDefinition.VALUELISTID)
        );
}


function eraseUnusedCategories(selectedCategoriesNames: string[]) {

    return (categories: Map<TransientCategoryDefinition>): Map<TransientCategoryDefinition> => {

        const keysOfUnselectedCategories = Object.keys(categories)
            .filter(isNot(includedIn(selectedCategoriesNames)));

        const parentNamesOfSelectedCategories: string[] = flow(
            keysOfUnselectedCategories,
            reduce(withDissoc, categories),
            getDefinedParents
        );

        const categoriesToErase = subtract(parentNamesOfSelectedCategories)(keysOfUnselectedCategories);
        return categoriesToErase.reduce(withDissoc, categories) as Map<TransientCategoryDefinition>;
    }
}


function replaceCommonFields(commonFields: Map)
        : (mergedCategories: Map<TransientCategoryDefinition>) => Map<TransientCategoryDefinition> {

    return map(
        cond(
            on(TransientCategoryDefinition.COMMONS, isDefined),
            (mergedCategory: TransientCategoryDefinition) => {

                const clonedMergedCategory = clone(mergedCategory);
                for (let commonFieldName of clonedMergedCategory.commons) {
                    if (!commonFields[commonFieldName]) {
                        throw [ConfigurationErrors.COMMON_FIELD_NOT_PROVIDED, commonFieldName];
                    }

                    if (!clonedMergedCategory.fields[commonFieldName]) {
                        clonedMergedCategory.fields[commonFieldName] = {};
                    }

                    clonedMergedCategory.fields[commonFieldName] = copy(commonFields[commonFieldName]) as any;
                }
                delete clonedMergedCategory.commons;
                return clonedMergedCategory;
            }));
}


function toCategoriesByFamilyNames(transientCategories: Map<TransientCategoryDefinition>)
        : Map<TransientCategoryDefinition> {

    return flow(
        transientCategories,
        keysAndValues,
        reduce(
            (acc: any, [transientCategoryName, transientCategory]) => {
                acc[transientCategory.categoryName
                    ? transientCategory.categoryName
                    : transientCategoryName] = transientCategory;
                return acc;
            }, {}));
}