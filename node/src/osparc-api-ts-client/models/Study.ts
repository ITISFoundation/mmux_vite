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

export class Study {
    'uid': string;
    'title'?: string | null;
    'description'?: string | null;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "uid",
            "baseName": "uid",
            "type": "string",
            "format": "uuid"
        },
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
        }    ];

    static getAttributeTypeMap() {
        return Study.attributeTypeMap;
    }

    public constructor() {
    }
}
