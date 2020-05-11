import {reduce, includedIn, isNot, isnt, keys, keysAndValues, Map, pairWith, union,
    Pair, flow, map, filter, forEach} from 'tsfun';
import {lookup, assoc} from 'tsfun/associative';
import {clone} from 'tsfun/struct';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {TransientCategoryDefinition} from '../model/transient-category-definition';
import {checkFieldCategoryChanges} from './check-field-category-changes';
import {mergeFields} from './merge-fields';
import {ConfigurationErrors} from './configuration-errors';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function mergeCategories(customCategories: Map<CustomCategoryDefinition>,
                                assertInputTypePresentIfNotCommonField: Function) {

    return (selectableCategories: Map<TransientCategoryDefinition>) => {

        return reduce((mergedCategories: Map<TransientCategoryDefinition>,
                       [customCategoryName, customCategory]: Pair<string, CustomCategoryDefinition>) => {

            return assoc(customCategoryName,
                mergedCategories[customCategoryName]
                    ? handleDirectCategoryExtension(customCategoryName, customCategory, mergedCategories[customCategoryName])
                    : handleChildCategoryExtension(customCategoryName, customCategory, assertInputTypePresentIfNotCommonField))
            (mergedCategories);

        }, clone(selectableCategories))(keysAndValues(customCategories));
    }
}


function handleChildCategoryExtension(customCategoryName: string, customCategory: CustomCategoryDefinition,
                                      assertInputTypePresentIfNotCommonField: Function): TransientCategoryDefinition {

    if (!customCategory.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, customCategoryName];

    keysAndValues(customCategory.fields).forEach(([fieldName, field]: any) => {
        assertInputTypePresentIfNotCommonField(customCategoryName, fieldName, field);
    });

    return customCategory as TransientCategoryDefinition;
}


function handleDirectCategoryExtension(customCategoryName: string, customCategory: CustomCategoryDefinition,
                                       extendedCategory: TransientCategoryDefinition) {

    checkFieldCategoryChanges(customCategoryName, customCategory.fields, extendedCategory.fields);

    const newMergedCategory: any = clone(extendedCategory);
    mergePropertiesOfCategory(newMergedCategory, customCategory);
    mergeFields(newMergedCategory.fields, customCategory.fields);
    return newMergedCategory;
}


/**
 * excluding fields
 */
function mergePropertiesOfCategory(target: { [_: string]: any }, source: { [_: string]: any }) {

    if (source[TransientCategoryDefinition.COMMONS]) {
        target[TransientCategoryDefinition.COMMONS]
            = union([
                target[TransientCategoryDefinition.COMMONS]
                    ? target[TransientCategoryDefinition.COMMONS]
                    : [],
            source[TransientCategoryDefinition.COMMONS]]);
    }

    if (source[CustomCategoryDefinition.VALUELISTS]) {
        if (!target[CustomCategoryDefinition.VALUELISTS]) target[CustomCategoryDefinition.VALUELISTS] = {};
        keysAndValues(source[CustomCategoryDefinition.VALUELISTS]).forEach(([k, v]: any) => {
            target[CustomCategoryDefinition.VALUELISTS][k] = v;
        });
    }

    return flow(
        source,
        keys,
        filter(isnt(TransientCategoryDefinition.FIELDS)),
        filter(isNot(includedIn(keys(target)))),
        map(pairWith(lookup(source))),
        forEach(overwriteIn(target)));
}


function overwriteIn(target: Map) {

    return ([key, value]: [string, any]) => target[key] = value;
}