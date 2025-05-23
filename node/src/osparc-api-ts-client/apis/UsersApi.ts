// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ErrorGet } from '../models/ErrorGet';
import { HTTPValidationError } from '../models/HTTPValidationError';
import { Profile } from '../models/Profile';
import { ProfileUpdate } from '../models/ProfileUpdate';

/**
 * no description
 */
export class UsersApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get My Profile
     */
    public async getMyProfile(_options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // Path Params
        const localVarPath = '/v0/me';

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
     * Update My Profile
     * @param profileUpdate 
     */
    public async updateMyProfile(profileUpdate: ProfileUpdate, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'profileUpdate' is not null or undefined
        if (profileUpdate === null || profileUpdate === undefined) {
            throw new RequiredError("UsersApi", "updateMyProfile", "profileUpdate");
        }


        // Path Params
        const localVarPath = '/v0/me';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.PUT);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(profileUpdate, "ProfileUpdate", ""),
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

}

export class UsersApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getMyProfile
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getMyProfileWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Profile >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Profile = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Profile", ""
            ) as Profile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "User not found", body, response.headers);
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
            const body: Profile = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Profile", ""
            ) as Profile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to updateMyProfile
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async updateMyProfileWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Profile >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Profile = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Profile", ""
            ) as Profile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "User not found", body, response.headers);
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
            const body: Profile = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Profile", ""
            ) as Profile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
