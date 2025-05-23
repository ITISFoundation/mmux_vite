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

export class Job {
    'id': string;
    'name': string;
    /**
    * Input\'s checksum
    */
    'inputsChecksum': string;
    /**
    * Job creation timestamp
    */
    'createdAt': Date;
    /**
    * Runner that executes job
    */
    'runnerName': string;
    'url': string | null;
    'runnerUrl': string | null;
    'outputsUrl': string | null;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string",
            "format": "uuid"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string",
            "format": ""
        },
        {
            "name": "inputsChecksum",
            "baseName": "inputs_checksum",
            "type": "string",
            "format": ""
        },
        {
            "name": "createdAt",
            "baseName": "created_at",
            "type": "Date",
            "format": "date-time"
        },
        {
            "name": "runnerName",
            "baseName": "runner_name",
            "type": "string",
            "format": ""
        },
        {
            "name": "url",
            "baseName": "url",
            "type": "string",
            "format": "uri"
        },
        {
            "name": "runnerUrl",
            "baseName": "runner_url",
            "type": "string",
            "format": "uri"
        },
        {
            "name": "outputsUrl",
            "baseName": "outputs_url",
            "type": "string",
            "format": "uri"
        }    ];

    static getAttributeTypeMap() {
        return Job.attributeTypeMap;
    }

    public constructor() {
    }
}
