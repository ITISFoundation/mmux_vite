// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ErrorGet } from '../models/ErrorGet';
import { FunctionJobCollection } from '../models/FunctionJobCollection';
import { FunctionJobCollectionListFunctionJobs200ResponseInner } from '../models/FunctionJobCollectionListFunctionJobs200ResponseInner';
import { FunctionJobCollectionStatus } from '../models/FunctionJobCollectionStatus';
import { HTTPValidationError } from '../models/HTTPValidationError';
import { PageRegisteredFunctionJobCollection } from '../models/PageRegisteredFunctionJobCollection';
import { RegisteredFunctionJobCollection } from '../models/RegisteredFunctionJobCollection';

/**
 * no description
 */
export class FunctionJobCollectionsApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Delete function job collection  New in *version 0.8.0*
     * Delete Function Job Collection
     * @param functionJobCollectionId 
     */
    public async deleteFunctionJobCollection(functionJobCollectionId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJobCollectionId' is not null or undefined
        if (functionJobCollectionId === null || functionJobCollectionId === undefined) {
            throw new RequiredError("FunctionJobCollectionsApi", "deleteFunctionJobCollection", "functionJobCollectionId");
        }


        // Path Params
        const localVarPath = '/v0/function_job_collections/{function_job_collection_id}'
            .replace('{' + 'function_job_collection_id' + '}', encodeURIComponent(String(functionJobCollectionId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.DELETE);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get the function jobs in function job collection  New in *version 0.8.0*
     * Function Job Collection List Function Jobs
     * @param functionJobCollectionId 
     */
    public async functionJobCollectionListFunctionJobs(functionJobCollectionId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJobCollectionId' is not null or undefined
        if (functionJobCollectionId === null || functionJobCollectionId === undefined) {
            throw new RequiredError("FunctionJobCollectionsApi", "functionJobCollectionListFunctionJobs", "functionJobCollectionId");
        }


        // Path Params
        const localVarPath = '/v0/function_job_collections/{function_job_collection_id}/function_jobs'
            .replace('{' + 'function_job_collection_id' + '}', encodeURIComponent(String(functionJobCollectionId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get function job collection status  New in *version 0.8.0*
     * Function Job Collection Status
     * @param functionJobCollectionId 
     */
    public async functionJobCollectionStatus(functionJobCollectionId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJobCollectionId' is not null or undefined
        if (functionJobCollectionId === null || functionJobCollectionId === undefined) {
            throw new RequiredError("FunctionJobCollectionsApi", "functionJobCollectionStatus", "functionJobCollectionId");
        }


        // Path Params
        const localVarPath = '/v0/function_job_collections/{function_job_collection_id}/status'
            .replace('{' + 'function_job_collection_id' + '}', encodeURIComponent(String(functionJobCollectionId)));

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

    /**
     * Get function job collection  New in *version 0.8.0*
     * Get Function Job Collection
     * @param functionJobCollectionId 
     */
    public async getFunctionJobCollection(functionJobCollectionId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJobCollectionId' is not null or undefined
        if (functionJobCollectionId === null || functionJobCollectionId === undefined) {
            throw new RequiredError("FunctionJobCollectionsApi", "getFunctionJobCollection", "functionJobCollectionId");
        }


        // Path Params
        const localVarPath = '/v0/function_job_collections/{function_job_collection_id}'
            .replace('{' + 'function_job_collection_id' + '}', encodeURIComponent(String(functionJobCollectionId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * List function job collections  New in *version 0.8.0*
     * List Function Job Collections
     * @param limit Page size limit
     * @param offset Page offset
     */
    public async listFunctionJobCollections(limit?: number, offset?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;



        // Path Params
        const localVarPath = '/v0/function_job_collections';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", ""));
        }

        // Query Params
        if (offset !== undefined) {
            requestContext.setQueryParam("offset", ObjectSerializer.serialize(offset, "number", ""));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Register function job collection  New in *version 0.8.0*
     * Register Function Job Collection
     * @param functionJobCollection 
     */
    public async registerFunctionJobCollection(functionJobCollection: FunctionJobCollection, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJobCollection' is not null or undefined
        if (functionJobCollection === null || functionJobCollection === undefined) {
            throw new RequiredError("FunctionJobCollectionsApi", "registerFunctionJobCollection", "functionJobCollection");
        }


        // Path Params
        const localVarPath = '/v0/function_job_collections';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(functionJobCollection, "FunctionJobCollection", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class FunctionJobCollectionsApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to deleteFunctionJobCollection
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async deleteFunctionJobCollectionWithHttpInfo(response: ResponseContext): Promise<HttpInfo<any >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: any = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "any", ""
            ) as any;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Function job collection not found", body, response.headers);
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
            const body: any = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "any", ""
            ) as any;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to functionJobCollectionListFunctionJobs
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async functionJobCollectionListFunctionJobsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<FunctionJobCollectionListFunctionJobs200ResponseInner> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<FunctionJobCollectionListFunctionJobs200ResponseInner> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<FunctionJobCollectionListFunctionJobs200ResponseInner>", ""
            ) as Array<FunctionJobCollectionListFunctionJobs200ResponseInner>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Function job collection not found", body, response.headers);
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
            const body: Array<FunctionJobCollectionListFunctionJobs200ResponseInner> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<FunctionJobCollectionListFunctionJobs200ResponseInner>", ""
            ) as Array<FunctionJobCollectionListFunctionJobs200ResponseInner>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to functionJobCollectionStatus
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async functionJobCollectionStatusWithHttpInfo(response: ResponseContext): Promise<HttpInfo<FunctionJobCollectionStatus >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: FunctionJobCollectionStatus = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "FunctionJobCollectionStatus", ""
            ) as FunctionJobCollectionStatus;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Function job collection not found", body, response.headers);
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
            const body: FunctionJobCollectionStatus = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "FunctionJobCollectionStatus", ""
            ) as FunctionJobCollectionStatus;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getFunctionJobCollection
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getFunctionJobCollectionWithHttpInfo(response: ResponseContext): Promise<HttpInfo<RegisteredFunctionJobCollection >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: RegisteredFunctionJobCollection = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RegisteredFunctionJobCollection", ""
            ) as RegisteredFunctionJobCollection;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Function job collection not found", body, response.headers);
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
            const body: RegisteredFunctionJobCollection = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RegisteredFunctionJobCollection", ""
            ) as RegisteredFunctionJobCollection;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to listFunctionJobCollections
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async listFunctionJobCollectionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<PageRegisteredFunctionJobCollection >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: PageRegisteredFunctionJobCollection = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PageRegisteredFunctionJobCollection", ""
            ) as PageRegisteredFunctionJobCollection;
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
            const body: PageRegisteredFunctionJobCollection = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PageRegisteredFunctionJobCollection", ""
            ) as PageRegisteredFunctionJobCollection;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to registerFunctionJobCollection
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async registerFunctionJobCollectionWithHttpInfo(response: ResponseContext): Promise<HttpInfo<RegisteredFunctionJobCollection >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: RegisteredFunctionJobCollection = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RegisteredFunctionJobCollection", ""
            ) as RegisteredFunctionJobCollection;
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
            const body: RegisteredFunctionJobCollection = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RegisteredFunctionJobCollection", ""
            ) as RegisteredFunctionJobCollection;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
