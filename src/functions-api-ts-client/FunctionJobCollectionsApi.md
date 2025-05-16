# .FunctionJobCollectionsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteFunctionJobCollection**](FunctionJobCollectionsApi.md#deleteFunctionJobCollection) | **DELETE** /v0/function_job_collections/{function_job_collection_id} | Delete Function Job Collection
[**functionJobCollectionListFunctionJobs**](FunctionJobCollectionsApi.md#functionJobCollectionListFunctionJobs) | **GET** /v0/function_job_collections/{function_job_collection_id}/function_jobs | Function Job Collection List Function Jobs
[**functionJobCollectionStatus**](FunctionJobCollectionsApi.md#functionJobCollectionStatus) | **GET** /v0/function_job_collections/{function_job_collection_id}/status | Function Job Collection Status
[**getFunctionJobCollection**](FunctionJobCollectionsApi.md#getFunctionJobCollection) | **GET** /v0/function_job_collections/{function_job_collection_id} | Get Function Job Collection
[**listFunctionJobCollections**](FunctionJobCollectionsApi.md#listFunctionJobCollections) | **GET** /v0/function_job_collections | List Function Job Collections
[**registerFunctionJobCollection**](FunctionJobCollectionsApi.md#registerFunctionJobCollection) | **POST** /v0/function_job_collections | Register Function Job Collection


# **deleteFunctionJobCollection**
> any deleteFunctionJobCollection()

Delete function job collection

### Example


```typescript
import { createConfiguration, FunctionJobCollectionsApi } from '';
import type { FunctionJobCollectionsApiDeleteFunctionJobCollectionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobCollectionsApi(configuration);

const request: FunctionJobCollectionsApiDeleteFunctionJobCollectionRequest = {
  
  functionJobCollectionId: "function_job_collection_id_example",
};

const data = await apiInstance.deleteFunctionJobCollection(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobCollectionId** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job collection not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **functionJobCollectionListFunctionJobs**
> Array<FunctionJobCollectionListFunctionJobs200ResponseInner> functionJobCollectionListFunctionJobs()

Get the function jobs in function job collection

### Example


```typescript
import { createConfiguration, FunctionJobCollectionsApi } from '';
import type { FunctionJobCollectionsApiFunctionJobCollectionListFunctionJobsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobCollectionsApi(configuration);

const request: FunctionJobCollectionsApiFunctionJobCollectionListFunctionJobsRequest = {
  
  functionJobCollectionId: "function_job_collection_id_example",
};

const data = await apiInstance.functionJobCollectionListFunctionJobs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobCollectionId** | [**string**] |  | defaults to undefined


### Return type

**Array<FunctionJobCollectionListFunctionJobs200ResponseInner>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job collection not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **functionJobCollectionStatus**
> FunctionJobCollectionStatus functionJobCollectionStatus()

Get function job collection status

### Example


```typescript
import { createConfiguration, FunctionJobCollectionsApi } from '';
import type { FunctionJobCollectionsApiFunctionJobCollectionStatusRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobCollectionsApi(configuration);

const request: FunctionJobCollectionsApiFunctionJobCollectionStatusRequest = {
  
  functionJobCollectionId: "function_job_collection_id_example",
};

const data = await apiInstance.functionJobCollectionStatus(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobCollectionId** | [**string**] |  | defaults to undefined


### Return type

**FunctionJobCollectionStatus**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job collection not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getFunctionJobCollection**
> RegisteredFunctionJobCollection getFunctionJobCollection()

Get function job collection

### Example


```typescript
import { createConfiguration, FunctionJobCollectionsApi } from '';
import type { FunctionJobCollectionsApiGetFunctionJobCollectionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobCollectionsApi(configuration);

const request: FunctionJobCollectionsApiGetFunctionJobCollectionRequest = {
  
  functionJobCollectionId: "function_job_collection_id_example",
};

const data = await apiInstance.getFunctionJobCollection(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobCollectionId** | [**string**] |  | defaults to undefined


### Return type

**RegisteredFunctionJobCollection**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job collection not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listFunctionJobCollections**
> PageRegisteredFunctionJobCollection listFunctionJobCollections()

List function job collections

### Example


```typescript
import { createConfiguration, FunctionJobCollectionsApi } from '';
import type { FunctionJobCollectionsApiListFunctionJobCollectionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobCollectionsApi(configuration);

const request: FunctionJobCollectionsApiListFunctionJobCollectionsRequest = {
    // Page size limit (optional)
  limit: 20,
    // Page offset (optional)
  offset: 0,
};

const data = await apiInstance.listFunctionJobCollections(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] | Page size limit | (optional) defaults to 20
 **offset** | [**number**] | Page offset | (optional) defaults to 0


### Return type

**PageRegisteredFunctionJobCollection**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **registerFunctionJobCollection**
> RegisteredFunctionJobCollection registerFunctionJobCollection(functionJobCollection)

Register function job collection

### Example


```typescript
import { createConfiguration, FunctionJobCollectionsApi } from '';
import type { FunctionJobCollectionsApiRegisterFunctionJobCollectionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobCollectionsApi(configuration);

const request: FunctionJobCollectionsApiRegisterFunctionJobCollectionRequest = {
  
  functionJobCollection: {
    title: "",
    description: "",
    jobIds: [],
  },
};

const data = await apiInstance.registerFunctionJobCollection(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobCollection** | **FunctionJobCollection**|  |


### Return type

**RegisteredFunctionJobCollection**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


