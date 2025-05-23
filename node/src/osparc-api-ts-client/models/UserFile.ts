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

/**
* Represents a file stored on the client side
*/
export class UserFile {
    /**
    * File name
    */
    'filename': string;
    /**
    * File size in bytes
    */
    'filesize': number;
    /**
    * SHA256 checksum
    */
    'sha256Checksum': string;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "filename",
            "baseName": "filename",
            "type": "string",
            "format": ""
        },
        {
            "name": "filesize",
            "baseName": "filesize",
            "type": "number",
            "format": ""
        },
        {
            "name": "sha256Checksum",
            "baseName": "sha256_checksum",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return UserFile.attributeTypeMap;
    }

    public constructor() {
    }
}
