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

import { Groups } from '../models/Groups';
import { UserRoleEnum } from '../models/UserRoleEnum';
import { HttpFile } from '../http/http';

export class Profile {
    'firstName'?: string | null;
    'lastName'?: string | null;
    'id': number;
    'login': string;
    'role': UserRoleEnum;
    'groups'?: Groups | null;
    'gravatarId'?: string | null;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "firstName",
            "baseName": "first_name",
            "type": "string",
            "format": ""
        },
        {
            "name": "lastName",
            "baseName": "last_name",
            "type": "string",
            "format": ""
        },
        {
            "name": "id",
            "baseName": "id",
            "type": "number",
            "format": ""
        },
        {
            "name": "login",
            "baseName": "login",
            "type": "string",
            "format": "email"
        },
        {
            "name": "role",
            "baseName": "role",
            "type": "UserRoleEnum",
            "format": ""
        },
        {
            "name": "groups",
            "baseName": "groups",
            "type": "Groups",
            "format": ""
        },
        {
            "name": "gravatarId",
            "baseName": "gravatar_id",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return Profile.attributeTypeMap;
    }

    public constructor() {
    }
}


