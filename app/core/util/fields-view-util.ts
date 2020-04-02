import {FieldResource, Resource} from 'idai-components-2/index';
import {ValuelistDefinition} from '../configuration/model/valuelist-definition';
import {ValuelistUtil} from './valuelist-util';
import {assoc, compose, flow, and, includedIn, isNot, filter,
    isString, lookup, map, Map, on, to, undefinedOrEmpty, Predicate, or, is, empty} from 'tsfun';
import {RelationDefinition} from '../configuration/model/relation-definition';
import {HierarchicalRelations} from '../model/relation-constants';
import {Labelled, Named} from './named';
import {Category} from '../configuration/model/category';
import {Groups} from '../configuration/model/group';
import {Filter} from './utils';
import {FieldDefinition} from '../configuration/model/field-definition';
import {ProjectConfiguration} from '../configuration/project-configuration';


export interface FieldsViewGroup extends Named, Labelled {

    shown: boolean;
    relations: Array<FieldsViewRelation>;
    fields: Array<FieldsViewField>;
}


export interface FieldsViewRelation extends Labelled {

    targets: Array<any>;
}


export interface FieldsViewField extends Labelled {

    value: string;
    isArray: boolean;
}


export module FieldsViewGroup {

    export const SHOWN = 'shown';
    export const RELATIONS = 'relations';
    export const FIELDS = 'fields';
}


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export module FieldsViewUtil {

    export function getValue(fieldContent: any, fieldName: string, projectConfiguration: ProjectConfiguration,
                             valuelist?: ValuelistDefinition): any {

        return fieldName === Resource.CATEGORY
            ? projectConfiguration.getLabelForCategory(fieldContent)
            : valuelist
                ? ValuelistUtil.getValueLabel(valuelist, fieldContent)
                : isString(fieldContent)
                    ? fieldContent
                        .replace(/^\s+|\s+$/g, '')
                        .replace(/\n/g, '<br>')
                    : fieldContent;
    }


    export function filterRelationsToShowFor(resource: Resource): Filter<Array<RelationDefinition>> {

        return filter(
            on(Named.NAME,
                and(
                    isNot(includedIn(HierarchicalRelations.ALL)),
                    compose(lookup(resource.relations), isNot(undefinedOrEmpty))
                )
            )
        );
    }


    export const isDefaultField: Predicate<FieldDefinition> = or(
        on(FieldDefinition.VISIBLE, is(true)),
        on(Named.NAME, is(Resource.CATEGORY)),
        on(Named.NAME, is(FieldResource.SHORTDESCRIPTION))
    );


    export const shouldBeDisplayed: Predicate<FieldsViewGroup> = or(
        on(FieldsViewGroup.FIELDS, isNot(empty)),
        on(FieldsViewGroup.RELATIONS, isNot(empty))
    );


    export function getGroups(category: string, categories: Map<Category>) {

        return flow(category,
            lookup(categories),
            to(Category.GROUPS),
            map(group =>
                assoc<any>(
                    FieldsViewGroup.SHOWN,
                    group.name === Groups.STEM)(group)
            )) as Array<FieldsViewGroup>;
    }
}