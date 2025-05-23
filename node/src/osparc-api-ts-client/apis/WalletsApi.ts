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
import { LicensedItemCheckoutData } from '../models/LicensedItemCheckoutData';
import { LicensedItemCheckoutGet } from '../models/LicensedItemCheckoutGet';
import { PageLicensedItemGet } from '../models/PageLicensedItemGet';
import { WalletGetWithAvailableCreditsLegacy } from '../models/WalletGetWithAvailableCreditsLegacy';

/**
 * no description
 */
export class WalletsApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Checkout licensed item
     * Checkout Licensed Item
     * @param walletId 
     * @param licensedItemId 
     * @param licensedItemCheckoutData 
     */
    public async checkoutLicensedItem(walletId: number, licensedItemId: string, licensedItemCheckoutData: LicensedItemCheckoutData, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'walletId' is not null or undefined
        if (walletId === null || walletId === undefined) {
            throw new RequiredError("WalletsApi", "checkoutLicensedItem", "walletId");
        }


        // verify required parameter 'licensedItemId' is not null or undefined
        if (licensedItemId === null || licensedItemId === undefined) {
            throw new RequiredError("WalletsApi", "checkoutLicensedItem", "licensedItemId");
        }


        // verify required parameter 'licensedItemCheckoutData' is not null or undefined
        if (licensedItemCheckoutData === null || licensedItemCheckoutData === undefined) {
            throw new RequiredError("WalletsApi", "checkoutLicensedItem", "licensedItemCheckoutData");
        }


        // Path Params
        const localVarPath = '/v0/wallets/{wallet_id}/licensed-items/{licensed_item_id}/checkout'
            .replace('{' + 'wallet_id' + '}', encodeURIComponent(String(walletId)))
            .replace('{' + 'licensed_item_id' + '}', encodeURIComponent(String(licensedItemId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(licensedItemCheckoutData, "LicensedItemCheckoutData", ""),
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
     * Get all available licensed items for a given wallet  New in *version 0.6*
     * Get Available Licensed Items For Wallet
     * @param walletId 
     * @param limit Page size limit
     * @param offset Page offset
     */
    public async getAvailableLicensedItemsForWallet(walletId: number, limit?: number, offset?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'walletId' is not null or undefined
        if (walletId === null || walletId === undefined) {
            throw new RequiredError("WalletsApi", "getAvailableLicensedItemsForWallet", "walletId");
        }




        // Path Params
        const localVarPath = '/v0/wallets/{wallet_id}/licensed-items'
            .replace('{' + 'wallet_id' + '}', encodeURIComponent(String(walletId)));

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
     * Get default wallet  New in *version 0.7*
     * Get Default Wallet
     */
    public async getDefaultWallet(_options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // Path Params
        const localVarPath = '/v0/wallets/default';

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
     * Get wallet  New in *version 0.7*
     * Get Wallet
     * @param walletId 
     */
    public async getWallet(walletId: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'walletId' is not null or undefined
        if (walletId === null || walletId === undefined) {
            throw new RequiredError("WalletsApi", "getWallet", "walletId");
        }


        // Path Params
        const localVarPath = '/v0/wallets/{wallet_id}'
            .replace('{' + 'wallet_id' + '}', encodeURIComponent(String(walletId)));

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

export class WalletsApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to checkoutLicensedItem
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async checkoutLicensedItemWithHttpInfo(response: ResponseContext): Promise<HttpInfo<LicensedItemCheckoutGet >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: LicensedItemCheckoutGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "LicensedItemCheckoutGet", ""
            ) as LicensedItemCheckoutGet;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Wallet not found", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Access to wallet is not allowed", body, response.headers);
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
            const body: LicensedItemCheckoutGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "LicensedItemCheckoutGet", ""
            ) as LicensedItemCheckoutGet;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getAvailableLicensedItemsForWallet
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getAvailableLicensedItemsForWalletWithHttpInfo(response: ResponseContext): Promise<HttpInfo<PageLicensedItemGet >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: PageLicensedItemGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PageLicensedItemGet", ""
            ) as PageLicensedItemGet;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Wallet not found", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Access to wallet is not allowed", body, response.headers);
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
            const body: PageLicensedItemGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PageLicensedItemGet", ""
            ) as PageLicensedItemGet;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDefaultWallet
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDefaultWalletWithHttpInfo(response: ResponseContext): Promise<HttpInfo<WalletGetWithAvailableCreditsLegacy >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: WalletGetWithAvailableCreditsLegacy = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "WalletGetWithAvailableCreditsLegacy", ""
            ) as WalletGetWithAvailableCreditsLegacy;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Wallet not found", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Access to wallet is not allowed", body, response.headers);
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
            const body: WalletGetWithAvailableCreditsLegacy = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "WalletGetWithAvailableCreditsLegacy", ""
            ) as WalletGetWithAvailableCreditsLegacy;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getWallet
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getWalletWithHttpInfo(response: ResponseContext): Promise<HttpInfo<WalletGetWithAvailableCreditsLegacy >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: WalletGetWithAvailableCreditsLegacy = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "WalletGetWithAvailableCreditsLegacy", ""
            ) as WalletGetWithAvailableCreditsLegacy;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Wallet not found", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ErrorGet = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ErrorGet", ""
            ) as ErrorGet;
            throw new ApiException<ErrorGet>(response.httpStatusCode, "Access to wallet is not allowed", body, response.headers);
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
            const body: WalletGetWithAvailableCreditsLegacy = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "WalletGetWithAvailableCreditsLegacy", ""
            ) as WalletGetWithAvailableCreditsLegacy;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
