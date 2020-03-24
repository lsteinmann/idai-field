import {append, assoc, cond, defined, flatten, flow, isNot, lookup,
    map, Map, on, prune, reduce, separate, throws, to, update, values} from 'tsfun';
import {Category} from '../model/category';
import {CategoryDefinition} from '../model/category-definition';
import {DEFAULT_GROUP_ORDER, Group, Groups} from '../model/group';
import {makeLookup} from '../../util/utils';
import {FieldDefinition} from '../model/field-definition';
import {isUndefined} from 'tsfun/src/predicate';
import {MDInternal} from 'idai-components-2/index';
import {GroupUtil} from '../group-util';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export function makeCategoriesMap(categories: any): Map<Category> {

    const [parentDefs, childDefs] =
        separate(on(CategoryDefinition.PARENT, isNot(defined)))(categories);

    const parentCategories = flow(
        parentDefs,
        map(buildCategoryFromDefinition),
        map(update('fields', Category.ifUndefinedSetGroupTo(Groups.PARENT))),
        makeLookup(Category.NAME));

    return flow(
        childDefs,
        reduce(addChildCategory, parentCategories),
        flattenCategoriesTreeMapToCategoriesMap,
        fillGroups
    );
}


/**
 * Creates the groups array for each category.
 * @param categoriesMap modified in place
 */
function fillGroups(categoriesMap: Map<Category>): Map<Category> {

    return map((category: Category) => {

        category.groups = flow(
            (category as any)['fields'],
            makeGroupsMap,
            map(sortGroupFields),
            convertToSortedArray(DEFAULT_GROUP_ORDER)
        );

        return category;

    })(categoriesMap);
}


function makeGroupsMap(fields: Array<FieldDefinition>) {

    const groups: Map<Group> = {};
    for (let field of fields) {
        if (!groups[field.group]) groups[field.group] = { fields: [], name: field.group };
        groups[field.group].fields = groups[field.group].fields.concat(field);
    }
    return groups;
}


function flattenCategoriesTreeMapToCategoriesMap(categoriesMap: Map<Category>): Map<Category> {

    const topLevelCategories: Array<Category> = values(categoriesMap);
    const children: Array<Category> = flatten(topLevelCategories.map(to(Category.CHILDREN)));
    return makeLookup(Category.NAME)(topLevelCategories.concat(children))
}


function addChildCategory(categoriesMap: Map<Category>,
                          childDefinition: CategoryDefinition): Map<Category> {

    return flow(childDefinition.parent,
        lookup(categoriesMap),
        cond(
            isUndefined,
            throws(MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC)
        ),
        addChildCategoryToParent(categoriesMap, childDefinition)
    );
}


// TODO make pure
function sortGroupFields(group: Group) {

    group.fields = GroupUtil.sortGroups(group.fields, group.name);
    return group;
}


function convertToSortedArray(defaultOrder: string[]) {

    return (groups: Map<Group>) => flow(
        defaultOrder,
        map(lookup(groups)),
        prune
    );
}



function addChildCategoryToParent(categoriesMap: Map<Category>, childDefinition: CategoryDefinition) {

    return (parentCategory: Category): Map<Category> => {

        const childCategory = buildCategoryFromDefinition(childDefinition);
        (childCategory as any)['fields'] = Category.makeChildFields(parentCategory, childCategory);

        const newParentCategory: any
            = update(Category.CHILDREN, append(childCategory))(parentCategory as any);
        childCategory.parentCategory = newParentCategory;

        return assoc(parentCategory.name, newParentCategory)(categoriesMap);
    }
}


function buildCategoryFromDefinition(definition: CategoryDefinition): Category {

    const category: any = {};
    category.mustLieWithin = definition.mustLieWithin;
    category.name = definition.name;
    category.label = definition.label || category.name;
    category.description = definition.description;
    category.groups = [];
    category.isAbstract = definition.abstract || false;
    category.color = definition.color ?? Category.generateColorForCategory(definition.name);
    category.children = [];

    category['fields'] = definition.fields || []; // TODO remove after construction
    return category as Category;
}