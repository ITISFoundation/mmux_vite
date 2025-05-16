# .WalletsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**checkoutLicensedItem**](WalletsApi.md#checkoutLicensedItem) | **POST** /v0/wallets/{wallet_id}/licensed-items/{licensed_item_id}/checkout | Checkout Licensed Item
[**getAvailableLicensedItemsForWallet**](WalletsApi.md#getAvailableLicensedItemsForWallet) | **GET** /v0/wallets/{wallet_id}/licensed-items | Get Available Licensed Items For Wallet
[**getDefaultWallet**](WalletsApi.md#getDefaultWallet) | **GET** /v0/wallets/default | Get Default Wallet
[**getWallet**](WalletsApi.md#getWallet) | **GET** /v0/wallets/{wallet_id} | Get Wallet


# **checkoutLicensedItem**
> LicensedItemCheckoutGet checkoutLicensedItem(licensedItemCheckoutData)

Checkout licensed item

### Example


```typescript
import { createConfiguration, WalletsApi } from '';
import type { WalletsApiCheckoutLicensedItemRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WalletsApi(configuration);

const request: WalletsApiCheckoutLicensedItemRequest = {
  
  walletId: 1,
  
  licensedItemId: "licensed_item_id_example",
  
  licensedItemCheckoutData: {
    numberOfSeats: 0,
    serviceRunId: "serviceRunId_example",
  },
};

const data = await apiInstance.checkoutLicensedItem(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **licensedItemCheckoutData** | **LicensedItemCheckoutData**|  |
 **walletId** | [**number**] |  | defaults to undefined
 **licensedItemId** | [**string**] |  | defaults to undefined


### Return type

**LicensedItemCheckoutGet**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Wallet not found |  -  |
**403** | Access to wallet is not allowed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getAvailableLicensedItemsForWallet**
> PageLicensedItemGet getAvailableLicensedItemsForWallet()

Get all available licensed items for a given wallet

### Example


```typescript
import { createConfiguration, WalletsApi } from '';
import type { WalletsApiGetAvailableLicensedItemsForWalletRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WalletsApi(configuration);

const request: WalletsApiGetAvailableLicensedItemsForWalletRequest = {
  
  walletId: 1,
    // Page size limit (optional)
  limit: 20,
    // Page offset (optional)
  offset: 0,
};

const data = await apiInstance.getAvailableLicensedItemsForWallet(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **walletId** | [**number**] |  | defaults to undefined
 **limit** | [**number**] | Page size limit | (optional) defaults to 20
 **offset** | [**number**] | Page offset | (optional) defaults to 0


### Return type

**PageLicensedItemGet**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Wallet not found |  -  |
**403** | Access to wallet is not allowed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDefaultWallet**
> WalletGetWithAvailableCreditsLegacy getDefaultWallet()

Get default wallet  New in *version 0.7*

### Example


```typescript
import { createConfiguration, WalletsApi } from '';

const configuration = createConfiguration();
const apiInstance = new WalletsApi(configuration);

const request = {};

const data = await apiInstance.getDefaultWallet(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**WalletGetWithAvailableCreditsLegacy**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Wallet not found |  -  |
**403** | Access to wallet is not allowed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getWallet**
> WalletGetWithAvailableCreditsLegacy getWallet()

Get wallet  New in *version 0.7*

### Example


```typescript
import { createConfiguration, WalletsApi } from '';
import type { WalletsApiGetWalletRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WalletsApi(configuration);

const request: WalletsApiGetWalletRequest = {
  
  walletId: 1,
};

const data = await apiInstance.getWallet(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **walletId** | [**number**] |  | defaults to undefined


### Return type

**WalletGetWithAvailableCreditsLegacy**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Wallet not found |  -  |
**403** | Access to wallet is not allowed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


