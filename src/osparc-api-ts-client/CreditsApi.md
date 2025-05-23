# .CreditsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getCreditsPrice**](CreditsApi.md#getCreditsPrice) | **GET** /v0/credits/price | Get Credits Price


# **getCreditsPrice**
> GetCreditPriceLegacy getCreditsPrice()

New in *version 0.6*

### Example


```typescript
import { createConfiguration, CreditsApi } from '';

const configuration = createConfiguration();
const apiInstance = new CreditsApi(configuration);

const request = {};

const data = await apiInstance.getCreditsPrice(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**GetCreditPriceLegacy**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


