# .LicensedItemsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getLicensedItems**](LicensedItemsApi.md#getLicensedItems) | **GET** /v0/licensed-items | Get Licensed Items
[**releaseLicensedItem**](LicensedItemsApi.md#releaseLicensedItem) | **POST** /v0/licensed-items/{licensed_item_id}/checked-out-items/{licensed_item_checkout_id}/release | Release Licensed Item


# **getLicensedItems**
> PageLicensedItemGet getLicensedItems()

Get all licensed items

### Example


```typescript
import { createConfiguration, LicensedItemsApi } from '';
import type { LicensedItemsApiGetLicensedItemsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new LicensedItemsApi(configuration);

const request: LicensedItemsApiGetLicensedItemsRequest = {
    // Page size limit (optional)
  limit: 20,
    // Page offset (optional)
  offset: 0,
};

const data = await apiInstance.getLicensedItems(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
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
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **releaseLicensedItem**
> LicensedItemCheckoutGet releaseLicensedItem()

Release previously checked out licensed item

### Example


```typescript
import { createConfiguration, LicensedItemsApi } from '';
import type { LicensedItemsApiReleaseLicensedItemRequest } from '';

const configuration = createConfiguration();
const apiInstance = new LicensedItemsApi(configuration);

const request: LicensedItemsApiReleaseLicensedItemRequest = {
  
  licensedItemId: "licensed_item_id_example",
  
  licensedItemCheckoutId: "licensed_item_checkout_id_example",
};

const data = await apiInstance.releaseLicensedItem(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **licensedItemId** | [**string**] |  | defaults to undefined
 **licensedItemCheckoutId** | [**string**] |  | defaults to undefined


### Return type

**LicensedItemCheckoutGet**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


