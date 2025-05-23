// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost } from '../models/BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost';
import { HTTPValidationError } from '../models/HTTPValidationError';
import { Job } from '../models/Job';
import { Program } from '../models/Program';

/**
 * no description
 */
export class ProgramsApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Creates a program job
     * Create Program Job
     * @param programKey 
     * @param version 
     * @param xSimcoreParentProjectUuid 
     * @param xSimcoreParentNodeId 
     * @param bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost 
     */
    public async createProgramJob(programKey: string, version: string, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost?: BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'programKey' is not null or undefined
        if (programKey === null || programKey === undefined) {
            throw new RequiredError("ProgramsApi", "createProgramJob", "programKey");
        }


        // verify required parameter 'version' is not null or undefined
        if (version === null || version === undefined) {
            throw new RequiredError("ProgramsApi", "createProgramJob", "version");
        }





        // Path Params
        const localVarPath = '/v0/programs/{program_key}/releases/{version}/jobs'
            .replace('{' + 'program_key' + '}', encodeURIComponent(String(programKey)))
            .replace('{' + 'version' + '}', encodeURIComponent(String(version)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Header Params
        requestContext.setHeaderParam("x-simcore-parent-project-uuid", ObjectSerializer.serialize(xSimcoreParentProjectUuid, "string", "uuid"));

        // Header Params
        requestContext.setHeaderParam("x-simcore-parent-node-id", ObjectSerializer.serialize(xSimcoreParentNodeId, "string", "uuid"));


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, "BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["HTTPBasic"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Gets a specific release of a solver
     * Get Program Release
     * @param programKey 
     * @param version 
     */
    public async getProgramRelease(programKey: string, version: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'programKey' is not null or undefined
        if (programKey === null || programKey === undefined) {
            throw new RequiredError("ProgramsApi", "getProgramRelease", "programKey");
        }


        // verify required parameter 'version' is not null or undefined
        if (version === null || version === undefined) {
            throw new RequiredError("ProgramsApi", "getProgramRelease", "version");
        }


        // Path Params
        const localVarPath = '/v0/programs/{program_key}/releases/{version}'
            .replace('{' + 'program_key' + '}', encodeURIComponent(String(programKey)))
            .replace('{' + 'version' + '}', encodeURIComponent(String(version)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["HTTPBasic"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class ProgramsApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createProgramJob
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async createProgramJobWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Job >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: Job = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Job", ""
            ) as Job;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("422", response.httpStatusCode)) {
            const body: HTTPValidationError = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "HTTPValidationError", ""
            ) as HTTPValidationError;
            throw new ApiException<HTTPValidationError>(response.httpStatusCode, "Validation Error", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Job = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Job", ""
            ) as Job;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getProgramRelease
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getProgramReleaseWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Program >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Program = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Program", ""
            ) as Program;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("422", response.httpStatusCode)) {
            const body: HTTPValidationError = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "HTTPValidationError", ""
            ) as HTTPValidationError;
            throw new ApiException<HTTPValidationError>(response.httpStatusCode, "Validation Error", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Program = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Program", ""
            ) as Program;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
