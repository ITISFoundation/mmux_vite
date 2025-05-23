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

import { HttpFile } from '../http/http';

export class RegisteredPythonCodeFunctionJob {
    'title'?: string;
    'description'?: string;
    'functionUid': string;
    'inputs': any | null;
    'outputs': any | null;
    'functionClass'?: RegisteredPythonCodeFunctionJobFunctionClassEnum;
    'uid': string;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "title",
            "baseName": "title",
            "type": "string",
            "format": ""
        },
        {
            "name": "description",
            "baseName": "description",
            "type": "string",
            "format": ""
        },
        {
            "name": "functionUid",
            "baseName": "function_uid",
            "type": "string",
            "format": "uuid"
        },
        {
            "name": "inputs",
            "baseName": "inputs",
            "type": "any",
            "format": ""
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "any",
            "format": ""
        },
        {
            "name": "functionClass",
            "baseName": "function_class",
            "type": "RegisteredPythonCodeFunctionJobFunctionClassEnum",
            "format": ""
        },
        {
            "name": "uid",
            "baseName": "uid",
            "type": "string",
            "format": "uuid"
        }    ];

    static getAttributeTypeMap() {
        return RegisteredPythonCodeFunctionJob.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum RegisteredPythonCodeFunctionJobFunctionClassEnum {
    PythonCode = 'PYTHON_CODE'
}

