/**
 * osparc.io public API
 * osparc-simcore public API specifications
 *
 * OpenAPI spec version: 0.8.0.post0.dev0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { RegisteredProjectFunction } from '../models/RegisteredProjectFunction';
import { RegisteredPythonCodeFunction } from '../models/RegisteredPythonCodeFunction';
import { RegisteredSolverFunction } from '../models/RegisteredSolverFunction';
import { HttpFile } from '../http/http';

/**
 * @type ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch
 * Type
 * @export
 */
export type ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch = RegisteredProjectFunction | RegisteredPythonCodeFunction | RegisteredSolverFunction;

/**
* @type ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatchClass
* @export
*/
export class ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatchClass {
    static readonly discriminator: string | undefined = "functionClass";

    static readonly mapping: {[index: string]: string} | undefined = {
        "PROJECT": "RegisteredProjectFunction",
        "PYTHON_CODE": "RegisteredPythonCodeFunction",
        "SOLVER": "RegisteredSolverFunction",
    };
}


