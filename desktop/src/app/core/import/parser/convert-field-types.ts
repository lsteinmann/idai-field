import { Category, FieldDefinition, Relations, setOn } from 'idai-field-core';
import { Dating, Dimension, Resource } from 'idai-field-core';
import { includedIn, is, isNot, isnt, on, Path, to } from 'tsfun';
import { CsvExportConsts } from '../../export/csv/csv-export-consts';
import { ParserErrors } from './parser-errors';
import ARRAY_SEPARATOR = CsvExportConsts.ARRAY_SEPARATOR;


type FieldType = 'dating' | 'date' | 'dimension' | 'literature' | 'radio'
    | 'dropdownRange' | 'boolean' | 'text' | 'input' | 'unsignedInt' | 'float' | 'unsignedFloat'
    | 'checkboxes'; // | 'geometry'


const UNCHECKED_FIELDS = ['relation', 'geometry', 'category'];


const fields = (resource: Resource) => Object.keys(resource).filter(isNot(includedIn(UNCHECKED_FIELDS)));


/**
 * Converts string values to values of other categories, based on field type information.
 * No validation other than errors resulting from parsing values from strings is handled here.
 *
 * Conversion of resource done by reference, i.e. in place
 *
 * @author Daniel de Oliveira
 */
export function convertFieldTypes(category: Category) {

    return (resource: Resource) => {

        for (const fieldName of fields(resource)) {

            const fieldDefinition = Category.getFields(category).find(on(FieldDefinition.NAME, is(fieldName)));
            if (!fieldDefinition) continue;

            const inputType = fieldDefinition.inputType as unknown as FieldType;
            if (resource[fieldName] !== null) convertTypeDependent(resource, fieldName, inputType);
        }

        for (const relationName of Object.keys(resource.relations).filter(isnt(Relations.PARENT))) {
            if (resource.relations[relationName] === null) continue;
            resource.relations[relationName] = (resource.relations[relationName] as unknown as string).split(ARRAY_SEPARATOR)
        }

        return resource;
    }
}


// here only string to number, validation in exec
const convertUnsignedInt = (container: any, path: Path) => convertNumber(container, path, 'int');
const convertUnsignedFloat = (container: any, path: Path) => convertNumber(container, path, 'float');
const convertFloat = (container: any, path: string) => convertNumber(container, path, 'float');



function convertTypeDependent(resource: Resource, fieldName: string, inputType: FieldType) {

    // leave 'date' as is
    // leave 'radio' as is
    if (inputType === 'boolean')       convertBoolean(resource, fieldName);
    if (inputType === 'dating')        convertDating(resource, fieldName);
    if (inputType === 'dimension')     convertDimension(resource, fieldName);
    if (inputType === 'checkboxes')    convertCheckboxes(resource, fieldName);
    if (inputType === 'unsignedInt')   convertUnsignedInt(resource, fieldName);
    if (inputType === 'unsignedFloat') convertUnsignedFloat(resource, fieldName);
    if (inputType === 'float')         convertFloat(resource, fieldName);
}


function convertCheckboxes(resource: Resource, fieldName: string) {

    resource[fieldName] = resource[fieldName].split(';');
}


function convertDimension(resource: Resource, fieldName: string) {

    let i = 0;
    for (const dimension of resource[fieldName] as Array<Dimension>) {

        if (dimension === undefined) throw 'Undefined dimension found';
        if (dimension === null) continue;

        if (dimension.inputUnit) (dimension.inputUnit as string) = dimension.inputUnit.toLowerCase();

        try {
            convertFloat(dimension, 'value');
            convertFloat(dimension, Dimension.RANGEMIN);
            convertFloat(dimension, Dimension.RANGEMAX);
            convertFloat(dimension, Dimension.INPUTVALUE);
            convertFloat(dimension, Dimension.INPUTRANGEENDVALUE);
            convertBoolean(dimension, Dimension.ISIMPRECISE);
            convertBoolean(dimension, 'isRange');
        } catch (msgWithParams) {
            throw [msgWithParams[0], msgWithParams[1], fieldName + '.' + i + '.' + msgWithParams[2]];
        }
        i++;
    }
}


function convertDating(resource: Resource, fieldName: string) {

    let i = 0;
    for (let dating of resource[fieldName] as Array<Dating>) {

        if (dating === undefined) throw 'Undefined dating found';
        if (dating === null) continue;

        try {
            convertUnsignedInt(dating, ['begin','inputYear']);
            convertUnsignedInt(dating, ['end','inputYear']);
            convertUnsignedInt(dating, 'margin');
            convertBoolean(dating, 'isImprecise');
            convertBoolean(dating, 'isUncertain');
        } catch (msgWithParams) {
            throw [msgWithParams[0], msgWithParams[1], fieldName + '.' + i + '.' + msgWithParams[2]];
        }
        i++;
    }
}


/**
 * Modifies container at path by converting string to number.
 * Returns early if no value at path.
 */
function convertNumber(container: any, path: Path, type: 'int'|'float') {

    let value = to(path, undefined)(container);
    if (!value) return;

    if (type === 'float') value = value.replace(',', '.');

    const converted = type === 'int' ? parseInt(value) : parseFloat(value);
    if (isNaN(converted)) throw [ParserErrors.CSV_NOT_A_NUMBER, value, path];
    setOn(container, path)(converted);
}


/**
 * Modifies container at path by converting string to boolean.
 * Returns early if no value at path.
 */
function convertBoolean(container: any, path: Path) {

    const val = to(path, undefined)(container);
    if (!val) return;
    if (isNot(includedIn(['true', 'false']))(val)) throw [ParserErrors.CSV_NOT_A_BOOLEAN, val, path];
    setOn(container, path)(val === 'true');
}
