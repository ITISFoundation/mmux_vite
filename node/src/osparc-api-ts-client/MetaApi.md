# .MetaApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getServiceMetadata**](MetaApi.md#getServiceMetadata) | **GET** /v0/meta | Get Service Metadata


# **getServiceMetadata**
> Meta getServiceMetadata()


### Example


```typescript
import { createConfiguration, MetaApi } from '';

const configuration = createConfiguration();
const apiInstance = new MetaApi(configuration);

const request = {};

const data = await apiInstance.getServiceMetadata(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Meta**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


