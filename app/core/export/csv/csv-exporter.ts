import * as fs from 'fs';
import {FieldResource} from 'idai-components-2';
import {CSVExport} from './csv-export';
import {M} from '../../../components/messages/m';
import {PerformExport} from '../export-helper';
import {Category} from '../../configuration/model/category';

/**
 * Small wrapper to separate async and file handling, including
 * the choice of line endings, from the main logic
 *
 * @author Daniel de Oliveira
 */
export module CsvExporter {

    /**
     * @param outputFilePath
     */
    export function performExport(outputFilePath: string): PerformExport {

        return (category: Category, relations: string[]) => {

            return async (resources: Array<FieldResource>) => {

                await writeFile(
                    outputFilePath,
                    CSVExport.createExportable(resources, Category.getFields(category), relations));
            }
        }
    }


    function writeFile(outputFilePath: string, lines: string[]): Promise<void> {

        return new Promise((resolve, reject) => {
            fs.writeFile(outputFilePath, lines.join('\n'),
                (err: any) => {
                if (err) {
                    console.error(err);
                    reject([M.EXPORT_ERROR_GENERIC]);
                } else {
                    resolve();
                }
            });
        });
    }
}