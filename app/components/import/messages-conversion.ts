import {isArray} from 'tsfun';
import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';
import {ImportErrors} from '../../core/import/import-errors';


/**
 * Converts messages of Validator / Importer to messages of M for ImportComponent.
 *
 * @author Daniel de Oliveira
 */
export module MessagesConversion {

    export function convertMessage(msgWithParams: string[]): string[] {

        if (!isArray(msgWithParams)) {
            console.warn('convertMessage. arg not of type array', msgWithParams);
            return [];
        }

        if (msgWithParams.length === 0) return [];
        let replacement = undefined;
        const msg = msgWithParams[0];

        // validation errors
        if (msg === ValidationErrors.INVALID_TYPE) replacement = M.IMPORT_VALIDATION_ERROR_INVALID_TYPE;
        if (msg === ValidationErrors.NO_ISRECORDEDIN) replacement = M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN;
        if (msg === ValidationErrors.NO_ISRECORDEDIN_TARGET) replacement = M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET;
        if (msg === ValidationErrors.IDENTIFIER_EXISTS) replacement = M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS;
        if (msg === ValidationErrors.MISSING_PROPERTY) replacement = M.IMPORT_VALIDATION_ERROR_MISSING_PROPERTY;
        if (msg === ValidationErrors.MISSING_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE;
        if (msg === ValidationErrors.MISSING_COORDINATES) replacement = M.MODEL_VALIDATION_ERROR_MISSING_COORDINATES;
        if (msg === ValidationErrors.INVALID_COORDINATES) replacement = M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES;
        if (msg === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE;
        if (msg === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE;

        // import errors - uncategorized
        if (msg === ImportErrors.MISSING_IDENTIFIER) replacement = M.IMPORT_ERROR_MISSING_IDENTIFIER;
        if (msg === ImportErrors.WRONG_IDENTIFIER_FORMAT) replacement = M.IMPORT_ERROR_IDENTIFIER_FORMAT;
        if (msg === ImportErrors.MISSING_RESOURCE) replacement = M.IMPORT_ERROR_MISSING_RESOURCE;

        // import errors - IO, parsing
        if (msg === ImportErrors.FILE_UNREADABLE) replacement = M.IMPORT_ERROR_FILE_UNREADABLE;
        if (msg === ImportErrors.FILE_INVALID_JSON) replacement = M.IMPORT_ERROR_INVALID_JSON;
        if (msg === ImportErrors.FILE_INVALID_JSONL) replacement = M.IMPORT_ERROR_INVALID_JSONL;
        if (msg === ImportErrors.SHAPEFILE_READ_ERROR) replacement = M.IMPORT_ERROR_SHAPEFILE_READ_ERROR;
        if (msg === ImportErrors.SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE) replacement = M.IMPORT_ERROR_SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE;
        if (msg === ImportErrors.SHAPEFILE_JSONL_WRITE_ERROR) replacement = M.IMPORT_ERROR_SHAPEFILE_JSONL_WRITE_ERROR;
        if (msg === ImportErrors.SHAPEFILE_GENERIC_ERROR) replacement = M.IMPORT_ERROR_SHAPEFILE_GENERIC_ERROR;
        if (msg === ImportErrors.INVALID_CSV) replacement = M.IMPORT_ERROR_INVALID_CSV;
        if (msg === ImportErrors.GENERIC_CSV_ERROR) replacement = M.IMPORT_ERROR_GENERIC_CSV_ERROR;
        if (msg === ImportErrors.MANDATORY_CSV_FIELD_MISSING) replacement = M.IMPORT_ERROR_MANDATORY_CSV_FIELD_MISSING;
        if (msg === ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT) replacement = M.IMPORT_ERROR_INVALID_GEOJSON_IMPORT_STRUCT;

        // import errors - content, structure of whole import
        if (msg === ImportErrors.OPERATIONS_NOT_ALLOWED) replacement = M.IMPORT_ERROR_OPERATIONS_NOT_ALLOWED;
        if (msg === ImportErrors.NO_OPERATION_ASSIGNED) replacement = M.IMPORT_ERROR_ONLYPLACEANDOPERATIONWITHOUTRECORDEDINALLOWED;
        if (msg === ImportErrors.NO_OPERATION_ASSIGNABLE) replacement = M.IMPORT_ERROR_NO_OPERATION_ASSIGNABLE;
        if (msg === ImportErrors.NO_FEATURE_ASSIGNABLE) replacement = M.IMPORT_ERROR_NO_FEATURE_ASSIGNABLE;

        // import errors other, execution of import
        if (msg === ImportErrors.RESOURCE_EXISTS) replacement = M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS;
        if (msg === ImportErrors.MISSING_RELATION_TARGET) replacement = M.IMPORT_ERROR_MISSING_RELATION_TARGET;
        if (msg === ImportErrors.INVALID_MAIN_TYPE_DOCUMENT) replacement = M.IMPORT_ERROR_INVALID_OPERATION_RESOURCE;
        if (msg === ImportErrors.INVALID_GEOMETRY) replacement = M.IMPORT_ERROR_INVALID_GEOMETRY;
        if (msg === ImportErrors.ROLLBACK_ERROR) replacement = M.IMPORT_ERROR_ROLLBACK_ERROR;
        if (msg === ImportErrors.GENERIC_DATASTORE_ERROR) replacement = M.IMPORT_ERROR_GENERIC_DATASTORE_ERROR;


        if (msg === ValidationErrors.INVALID_FIELDS) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_FIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALID_FIELD
        }
        if (msg === ValidationErrors.INVALID_RELATIONS) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELD
        }
        if (msg === ValidationErrors.INVALID_NUMERICAL_VALUES) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES
                : M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE
        }

        if (replacement) msgWithParams[0] = replacement;

        return msgWithParams;
    }
}