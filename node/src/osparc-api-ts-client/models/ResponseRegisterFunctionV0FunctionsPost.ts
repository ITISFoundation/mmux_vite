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
 * @type ResponseRegisterFunctionV0FunctionsPost
 * Type
 * @export
 */
export type ResponseRegisterFunctionV0FunctionsPost = RegisteredProjectFunction | RegisteredPythonCodeFunction | RegisteredSolverFunction;

/**
* @type ResponseRegisterFunctionV0FunctionsPostClass
* @export
*/
export class ResponseRegisterFunctionV0FunctionsPostClass {
    static readonly discriminator: string | undefined = "functionClass";

    static readonly mapping: {[index: string]: string} | undefined = {
        "PROJECT": "RegisteredProjectFunction",
        "PYTHON_CODE": "RegisteredPythonCodeFunction",
        "SOLVER": "RegisteredSolverFunction",
    };
}


