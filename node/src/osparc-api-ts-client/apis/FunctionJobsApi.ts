// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ErrorGet } from '../models/ErrorGet';
import { FunctionJob } from '../models/FunctionJob';
import { FunctionJobStatus } from '../models/FunctionJobStatus';
import { HTTPValidationError } from '../models/HTTPValidationError';
import { PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass } from '../models/PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass';
import { ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet } from '../models/ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet';
import { ResponseRegisterFunctionJobV0FunctionJobsPost } from '../models/ResponseRegisterFunctionJobV0FunctionJobsPost';

/**
 * no description
 */
export class FunctionJobsApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Delete function job  New in *version 0.8.0*
     * Delete Function Job
     * @param functionJobId 
     */
    public async deleteFunctionJob(functionJobId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJobId' is not null or undefined
        if (functionJobId === null || functionJobId === undefined) {
            throw new RequiredError("FunctionJobsApi", "deleteFunctionJob", "functionJobId");
        }


        // Path Params
        const localVarPath = '/v0/function_jobs/{function_job_id}'
            .replace('{' + 'function_job_id' + '}', encodeURIComponent(String(functionJobId)));

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
     * Get function job outputs  New in *version 0.8.0*
     * Function Job Outputs
     * @param functionJobId 
     */
    public async functionJobOutputs(functionJobId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJobId' is not null or undefined
        if (functionJobId === null || functionJobId === undefined) {
            throw new RequiredError("FunctionJobsApi", "functionJobOutputs", "functionJobId");
        }


        // Path Params
        const localVarPath = '/v0/function_jobs/{function_job_id}/outputs'
            .replace('{' + 'function_job_id' + '}', encodeURIComponent(String(functionJobId)));

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
     * Get function job status  New in *version 0.8.0*
     * Function Job Status
     * @param functionJobId 
     */
    public async functionJobStatus(functionJobId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJobId' is not null or undefined
        if (functionJobId === null || functionJobId === undefined) {
            throw new RequiredError("FunctionJobsApi", "functionJobStatus", "functionJobId");
        }


        // Path Params
        const localVarPath = '/v0/function_jobs/{function_job_id}/status'
            .replace('{' + 'function_job_id' + '}', encodeURIComponent(String(functionJobId)));

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
     * Get function job  New in *version 0.8.0*
     * Get Function Job
     * @param functionJobId 
     */
    public async getFunctionJob(functionJobId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJobId' is not null or undefined
        if (functionJobId === null || functionJobId === undefined) {
            throw new RequiredError("FunctionJobsApi", "getFunctionJob", "functionJobId");
        }


        // Path Params
        const localVarPath = '/v0/function_jobs/{function_job_id}'
            .replace('{' + 'function_job_id' + '}', encodeURIComponent(String(functionJobId)));

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
     * List function jobs  New in *version 0.8.0*
     * List Function Jobs
     * @param limit Page size limit
     * @param offset Page offset
     */
    public async listFunctionJobs(limit?: number, offset?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;



        // Path Params
        const localVarPath = '/v0/function_jobs';

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
     * Create function job  New in *version 0.8.0*
     * Register Function Job
     * @param functionJob 
     */
    public async registerFunctionJob(functionJob: FunctionJob, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'functionJob' is not null or undefined
        if (functionJob === null || functionJob === undefined) {
            throw new RequiredError("FunctionJobsApi", "registerFunctionJob", "functionJob");
        }


        // Path Params
        const localVarPath = '/v0/function_jobs';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(functionJob, "FunctionJob", ""),
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

export class FunctionJobsApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to deleteFunctionJob
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async deleteFunctionJobWithHttpInfo(response: ResponseContext): Promise<HttpInfo<any >> {
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
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Function job not found", body, response.headers);
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
     * @params response Response returned by the server for a request to functionJobOutputs
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async functionJobOutputsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<any >> {
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
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Function job not found", body, response.headers);
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
     * @params response Response returned by the server for a request to functionJobStatus
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async functionJobStatusWithHttpInfo(response: ResponseContext): Promise<HttpInfo<FunctionJobStatus >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: FunctionJobStatus = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "FunctionJobStatus", ""
            ) as FunctionJobStatus;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Function job not found", body, response.headers);
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
            const body: FunctionJobStatus = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "FunctionJobStatus", ""
            ) as FunctionJobStatus;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getFunctionJob
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getFunctionJobWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet", ""
            ) as ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Function job not found", body, response.headers);
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
            const body: ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet", ""
            ) as ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to listFunctionJobs
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async listFunctionJobsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass", ""
            ) as PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass;
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
            const body: PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass", ""
            ) as PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to registerFunctionJob
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async registerFunctionJobWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ResponseRegisterFunctionJobV0FunctionJobsPost >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ResponseRegisterFunctionJobV0FunctionJobsPost = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResponseRegisterFunctionJobV0FunctionJobsPost", ""
            ) as ResponseRegisterFunctionJobV0FunctionJobsPost;
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
            const body: ResponseRegisterFunctionJobV0FunctionJobsPost = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResponseRegisterFunctionJobV0FunctionJobsPost", ""
            ) as ResponseRegisterFunctionJobV0FunctionJobsPost;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
