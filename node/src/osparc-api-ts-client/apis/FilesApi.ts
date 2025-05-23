// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { BodyAbortMultipartUploadV0FilesFileIdAbortPost } from '../models/BodyAbortMultipartUploadV0FilesFileIdAbortPost';
import { BodyCompleteMultipartUploadV0FilesFileIdCompletePost } from '../models/BodyCompleteMultipartUploadV0FilesFileIdCompletePost';
import { ClientFile } from '../models/ClientFile';
import { ClientFileUploadData } from '../models/ClientFileUploadData';
import { ErrorGet } from '../models/ErrorGet';
import { HTTPValidationError } from '../models/HTTPValidationError';
import { PageFile } from '../models/PageFile';

/**
 * no description
 */
export class FilesApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Abort Multipart Upload
     * @param fileId 
     * @param bodyAbortMultipartUploadV0FilesFileIdAbortPost 
     */
    public async abortMultipartUpload(fileId: string, bodyAbortMultipartUploadV0FilesFileIdAbortPost: BodyAbortMultipartUploadV0FilesFileIdAbortPost, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'fileId' is not null or undefined
        if (fileId === null || fileId === undefined) {
            throw new RequiredError("FilesApi", "abortMultipartUpload", "fileId");
        }


        // verify required parameter 'bodyAbortMultipartUploadV0FilesFileIdAbortPost' is not null or undefined
        if (bodyAbortMultipartUploadV0FilesFileIdAbortPost === null || bodyAbortMultipartUploadV0FilesFileIdAbortPost === undefined) {
            throw new RequiredError("FilesApi", "abortMultipartUpload", "bodyAbortMultipartUploadV0FilesFileIdAbortPost");
        }


        // Path Params
        const localVarPath = '/v0/files/{file_id}:abort'
            .replace('{' + 'file_id' + '}', encodeURIComponent(String(fileId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(bodyAbortMultipartUploadV0FilesFileIdAbortPost, "BodyAbortMultipartUploadV0FilesFileIdAbortPost", ""),
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
     * Complete Multipart Upload
     * @param fileId 
     * @param bodyCompleteMultipartUploadV0FilesFileIdCompletePost 
     */
    public async completeMultipartUpload(fileId: string, bodyCompleteMultipartUploadV0FilesFileIdCompletePost: BodyCompleteMultipartUploadV0FilesFileIdCompletePost, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'fileId' is not null or undefined
        if (fileId === null || fileId === undefined) {
            throw new RequiredError("FilesApi", "completeMultipartUpload", "fileId");
        }


        // verify required parameter 'bodyCompleteMultipartUploadV0FilesFileIdCompletePost' is not null or undefined
        if (bodyCompleteMultipartUploadV0FilesFileIdCompletePost === null || bodyCompleteMultipartUploadV0FilesFileIdCompletePost === undefined) {
            throw new RequiredError("FilesApi", "completeMultipartUpload", "bodyCompleteMultipartUploadV0FilesFileIdCompletePost");
        }


        // Path Params
        const localVarPath = '/v0/files/{file_id}:complete'
            .replace('{' + 'file_id' + '}', encodeURIComponent(String(fileId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(bodyCompleteMultipartUploadV0FilesFileIdCompletePost, "BodyCompleteMultipartUploadV0FilesFileIdCompletePost", ""),
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
     * Delete File
     * @param fileId 
     */
    public async deleteFile(fileId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'fileId' is not null or undefined
        if (fileId === null || fileId === undefined) {
            throw new RequiredError("FilesApi", "deleteFile", "fileId");
        }


        // Path Params
        const localVarPath = '/v0/files/{file_id}'
            .replace('{' + 'file_id' + '}', encodeURIComponent(String(fileId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.DELETE);
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
     * Download File
     * @param fileId 
     */
    public async downloadFile(fileId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'fileId' is not null or undefined
        if (fileId === null || fileId === undefined) {
            throw new RequiredError("FilesApi", "downloadFile", "fileId");
        }


        // Path Params
        const localVarPath = '/v0/files/{file_id}/content'
            .replace('{' + 'file_id' + '}', encodeURIComponent(String(fileId)));

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
     * Gets metadata for a given file resource
     * Get File
     * @param fileId 
     */
    public async getFile(fileId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'fileId' is not null or undefined
        if (fileId === null || fileId === undefined) {
            throw new RequiredError("FilesApi", "getFile", "fileId");
        }


        // Path Params
        const localVarPath = '/v0/files/{file_id}'
            .replace('{' + 'file_id' + '}', encodeURIComponent(String(fileId)));

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
     * Get Files Page
     * @param limit Page size limit
     * @param offset Page offset
     */
    public async getFilesPage(limit?: number, offset?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;



        // Path Params
        const localVarPath = '/v0/files/page';

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
     * Get upload links for uploading a file to storage
     * Get Upload Links
     * @param clientFile 
     */
    public async getUploadLinks(clientFile: ClientFile, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'clientFile' is not null or undefined
        if (clientFile === null || clientFile === undefined) {
            throw new RequiredError("FilesApi", "getUploadLinks", "clientFile");
        }


        // Path Params
        const localVarPath = '/v0/files/content';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(clientFile, "ClientFile", ""),
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
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/files/page` instead.    Lists all files stored in the system  Added in *version 0.5*:   Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Files
     */
    public async listFiles(_options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // Path Params
        const localVarPath = '/v0/files';

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
     * Search files
     * Search Files Page
     * @param sha256Checksum 
     * @param fileId 
     * @param limit Page size limit
     * @param offset Page offset
     */
    public async searchFilesPage(sha256Checksum?: string, fileId?: string, limit?: number, offset?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;





        // Path Params
        const localVarPath = '/v0/files:search';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (sha256Checksum !== undefined) {
            requestContext.setQueryParam("sha256_checksum", ObjectSerializer.serialize(sha256Checksum, "string", ""));
        }

        // Query Params
        if (fileId !== undefined) {
            requestContext.setQueryParam("file_id", ObjectSerializer.serialize(fileId, "string", "uuid"));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", ""));
        }

        // Query Params
        if (offset !== undefined) {
            requestContext.setQueryParam("offset", ObjectSerializer.serialize(offset, "number", ""));
        }


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
     * Uploads a single file to the system
     * Upload File
     * @param file 
     * @param contentLength 
     */
    public async uploadFile(file: HttpFile, contentLength?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'file' is not null or undefined
        if (file === null || file === undefined) {
            throw new RequiredError("FilesApi", "uploadFile", "file");
        }



        // Path Params
        const localVarPath = '/v0/files/content';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.PUT);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Header Params
        requestContext.setHeaderParam("content-length", ObjectSerializer.serialize(contentLength, "string", ""));

        // Form Params
        const useForm = canConsumeForm([
            'multipart/form-data',
        ]);

        let localVarFormParams
        if (useForm) {
            localVarFormParams = new FormData();
        } else {
            localVarFormParams = new URLSearchParams();
        }

        if (file !== undefined) {
             // TODO: replace .append with .set
             if (localVarFormParams instanceof FormData) {
                 localVarFormParams.append('file', file, file.name);
             }
        }

        requestContext.setBody(localVarFormParams);

        if(!useForm) {
            const contentType = ObjectSerializer.getPreferredMediaType([
                "multipart/form-data"
            ]);
            requestContext.setHeaderParam("Content-Type", contentType);
        }

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

export class FilesApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to abortMultipartUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async abortMultipartUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<any >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: any = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "any", ""
            ) as any;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Too many requests", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Internal server error", body, response.headers);
        }
        if (isCodeInRange("502", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Unexpected error when communicating with backend service", body, response.headers);
        }
        if (isCodeInRange("503", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Service unavailable", body, response.headers);
        }
        if (isCodeInRange("504", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Request to a backend service timed out.", body, response.headers);
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
     * @params response Response returned by the server for a request to completeMultipartUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async completeMultipartUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<any >> {
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
            throw new ApiException<ErrorGet>(response.httpStatusCode, "File not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Too many requests", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Internal server error", body, response.headers);
        }
        if (isCodeInRange("502", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Unexpected error when communicating with backend service", body, response.headers);
        }
        if (isCodeInRange("503", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Service unavailable", body, response.headers);
        }
        if (isCodeInRange("504", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Request to a backend service timed out.", body, response.headers);
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
     * @params response Response returned by the server for a request to deleteFile
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async deleteFileWithHttpInfo(response: ResponseContext): Promise<HttpInfo<any >> {
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
            throw new ApiException<ErrorGet>(response.httpStatusCode, "File not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Too many requests", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Internal server error", body, response.headers);
        }
        if (isCodeInRange("502", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Unexpected error when communicating with backend service", body, response.headers);
        }
        if (isCodeInRange("503", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Service unavailable", body, response.headers);
        }
        if (isCodeInRange("504", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Request to a backend service timed out.", body, response.headers);
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
     * @params response Response returned by the server for a request to downloadFile
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async downloadFileWithHttpInfo(response: ResponseContext): Promise<HttpInfo<HttpFile >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("307", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Successful Response", undefined, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", "binary"
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "File not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", "binary"
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Too many requests", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", "binary"
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Internal server error", body, response.headers);
        }
        if (isCodeInRange("502", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", "binary"
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Unexpected error when communicating with backend service", body, response.headers);
        }
        if (isCodeInRange("503", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", "binary"
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Service unavailable", body, response.headers);
        }
        if (isCodeInRange("504", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", "binary"
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Request to a backend service timed out.", body, response.headers);
        }
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: HttpFile = await response.getBodyAsFile() as any as HttpFile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("422", response.httpStatusCode)) {
            const body: HTTPValidationError = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "HTTPValidationError", "binary"
            ) as HTTPValidationError;
            throw new ApiException<HTTPValidationError>(response.httpStatusCode, "Validation Error", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: HttpFile = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "HttpFile", "binary"
            ) as HttpFile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getFile
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getFileWithHttpInfo(response: ResponseContext): Promise<HttpInfo<any >> {
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
            throw new ApiException<ErrorGet>(response.httpStatusCode, "File not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Too many requests", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Internal server error", body, response.headers);
        }
        if (isCodeInRange("502", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Unexpected error when communicating with backend service", body, response.headers);
        }
        if (isCodeInRange("503", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Service unavailable", body, response.headers);
        }
        if (isCodeInRange("504", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Request to a backend service timed out.", body, response.headers);
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
     * @params response Response returned by the server for a request to getFilesPage
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getFilesPageWithHttpInfo(response: ResponseContext): Promise<HttpInfo< void>> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("501", response.httpStatusCode)) {
            const body: PageFile = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PageFile", ""
            ) as PageFile;
            throw new ApiException<PageFile>(response.httpStatusCode, "Successful Response", body, response.headers);
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
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getUploadLinks
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getUploadLinksWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ClientFileUploadData >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ClientFileUploadData = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ClientFileUploadData", ""
            ) as ClientFileUploadData;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "File not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Too many requests", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Internal server error", body, response.headers);
        }
        if (isCodeInRange("502", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Unexpected error when communicating with backend service", body, response.headers);
        }
        if (isCodeInRange("503", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Service unavailable", body, response.headers);
        }
        if (isCodeInRange("504", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Request to a backend service timed out.", body, response.headers);
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
            const body: ClientFileUploadData = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ClientFileUploadData", ""
            ) as ClientFileUploadData;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to listFiles
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async listFilesWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<any> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<any> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<any>", ""
            ) as Array<any>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "File not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Too many requests", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Internal server error", body, response.headers);
        }
        if (isCodeInRange("502", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Unexpected error when communicating with backend service", body, response.headers);
        }
        if (isCodeInRange("503", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Service unavailable", body, response.headers);
        }
        if (isCodeInRange("504", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Request to a backend service timed out.", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<any> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<any>", ""
            ) as Array<any>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to searchFilesPage
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async searchFilesPageWithHttpInfo(response: ResponseContext): Promise<HttpInfo<PageFile >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: PageFile = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PageFile", ""
            ) as PageFile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "File not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Too many requests", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Internal server error", body, response.headers);
        }
        if (isCodeInRange("502", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Unexpected error when communicating with backend service", body, response.headers);
        }
        if (isCodeInRange("503", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Service unavailable", body, response.headers);
        }
        if (isCodeInRange("504", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Request to a backend service timed out.", body, response.headers);
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
            const body: PageFile = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PageFile", ""
            ) as PageFile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to uploadFile
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async uploadFileWithHttpInfo(response: ResponseContext): Promise<HttpInfo<any >> {
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
            throw new ApiException<ErrorGet>(response.httpStatusCode, "File not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Too many requests", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Internal server error", body, response.headers);
        }
        if (isCodeInRange("502", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Unexpected error when communicating with backend service", body, response.headers);
        }
        if (isCodeInRange("503", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Service unavailable", body, response.headers);
        }
        if (isCodeInRange("504", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Request to a backend service timed out.", body, response.headers);
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

}
