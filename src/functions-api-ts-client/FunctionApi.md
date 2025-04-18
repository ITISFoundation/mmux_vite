# .FunctionApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**batchRunFunction**](FunctionApi.md#batchRunFunction) | **POST** /function/{function_id}/batch | Batch Run Function
[**createFunction**](FunctionApi.md#createFunction) | **POST** /function | Create Function
[**deleteAllFunctions**](FunctionApi.md#deleteAllFunctions) | **DELETE** /function/all | Delete All Functions
[**listFunctions**](FunctionApi.md#listFunctions) | **GET** /function/list | List Functions
[**mapFunction**](FunctionApi.md#mapFunction) | **POST** /function/{function_id}/map | Map Function
[**runFunction**](FunctionApi.md#runFunction) | **POST** /function/{function_id}/run | Run Function
[**searchFunctionsByName**](FunctionApi.md#searchFunctionsByName) | **GET** /function/searchByName | Search Functions By Name
[**searchFunctionsByTags**](FunctionApi.md#searchFunctionsByTags) | **GET** /function/searchByTags | Search Functions By Tags
[**updateFunctionConfigFunctionConfigPost**](FunctionApi.md#updateFunctionConfigFunctionConfigPost) | **POST** /function/config | Update Function Config


# **batchRunFunction**
> FunctionJobCollection batchRunFunction(requestBody)

Run a function with multiple inputs and create a job collection.  Parameters:     function_id: ID of the function to run     collection_name: Name for the job collection     request_body: List of JSON strings containing input parameters     max_workers: Optional maximum number of parallel workers  Returns:     Created function job collection containing all job IDs

### Example


```typescript
import { createConfiguration, FunctionApi } from '';
import type { FunctionApiBatchRunFunctionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionApi(configuration);

const request: FunctionApiBatchRunFunctionRequest = {
  
  functionId: 1,
  
  collectionName: "collection_name_example",
  
  requestBody: [
    "requestBody_example",
  ],
  
  maxWorkers: 1,
};

const data = await apiInstance.batchRunFunction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **requestBody** | **Array<string>**|  |
 **functionId** | [**number**] |  | defaults to undefined
 **collectionName** | [**string**] |  | defaults to undefined
 **maxWorkers** | [**number**] |  | (optional) defaults to undefined


### Return type

**FunctionJobCollection**

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

# **createFunction**
> Function createFunction(_function)

Create a new function with optional JSON Schema definitions for input and output. Validates that provided schemas are valid JSON Schema. Supports tags for better organization and searchability.

### Example


```typescript
import { createConfiguration, FunctionApi } from '';
import type { FunctionApiCreateFunctionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionApi(configuration);

const request: FunctionApiCreateFunctionRequest = {
  
  _function: {
    id: 1,
    name: "name_example",
    type: "type_example",
    url: "url_example",
    description: "description_example",
    inputSchema: {},
    outputSchema: {},
    tags: [
      "tags_example",
    ],
  },
};

const data = await apiInstance.createFunction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **_function** | **Function**|  |


### Return type

**Function**

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

# **deleteAllFunctions**
> any deleteAllFunctions()

Delete all functions from the store.  Returns:     Message confirming deletion with count of deleted functions

### Example


```typescript
import { createConfiguration, FunctionApi } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionApi(configuration);

const request = {};

const data = await apiInstance.deleteAllFunctions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listFunctions**
> Array<Function> listFunctions()

List all functions in the store.  Returns:     List of all registered functions

### Example


```typescript
import { createConfiguration, FunctionApi } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionApi(configuration);

const request = {};

const data = await apiInstance.listFunctions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<Function>**

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

# **mapFunction**
> Array<FunctionJob> mapFunction(requestBody)

Start asynchronous processing of multiple inputs with schema validation.

### Example


```typescript
import { createConfiguration, FunctionApi } from '';
import type { FunctionApiMapFunctionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionApi(configuration);

const request: FunctionApiMapFunctionRequest = {
  
  functionId: 1,
  
  requestBody: [
    "requestBody_example",
  ],
  
  maxWorkers: 1,
};

const data = await apiInstance.mapFunction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **requestBody** | **Array<string>**|  |
 **functionId** | [**number**] |  | defaults to undefined
 **maxWorkers** | [**number**] |  | (optional) defaults to undefined


### Return type

**Array<FunctionJob>**

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

# **runFunction**
> FunctionJob runFunction()

Run a function with the given inputs. Validates inputs and outputs against JSON Schema if defined.

### Example


```typescript
import { createConfiguration, FunctionApi } from '';
import type { FunctionApiRunFunctionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionApi(configuration);

const request: FunctionApiRunFunctionRequest = {
  
  functionId: 1,
  
  inputs: "inputs_example",
};

const data = await apiInstance.runFunction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionId** | [**number**] |  | defaults to undefined
 **inputs** | [**string**] |  | defaults to undefined


### Return type

**FunctionJob**

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

# **searchFunctionsByName**
> Array<Function> searchFunctionsByName()

Search for functions by name.  Parameters:     name: String to search for in function names (case-sensitive partial match)  Returns:     List of functions whose names contain the search string

### Example


```typescript
import { createConfiguration, FunctionApi } from '';
import type { FunctionApiSearchFunctionsByNameRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionApi(configuration);

const request: FunctionApiSearchFunctionsByNameRequest = {
  
  name: "name_example",
};

const data = await apiInstance.searchFunctionsByName(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **name** | [**string**] |  | defaults to undefined


### Return type

**Array<Function>**

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

# **searchFunctionsByTags**
> Array<Function> searchFunctionsByTags()

Search for functions by tags.  Parameters:     tags: List of tags to search for     match_all: If True, functions must have all specified tags. If False, functions must have any of the specified tags.  Returns:     List of functions that match the tag criteria

### Example


```typescript
import { createConfiguration, FunctionApi } from '';
import type { FunctionApiSearchFunctionsByTagsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionApi(configuration);

const request: FunctionApiSearchFunctionsByTagsRequest = {
    // Tags to search for
  tags: [
    "tags_example",
  ],
    // If True, functions must have all tags. If False, functions must have any of the tags. (optional)
  matchAll: false,
};

const data = await apiInstance.searchFunctionsByTags(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **tags** | **Array&lt;string&gt;** | Tags to search for | defaults to undefined
 **matchAll** | [**boolean**] | If True, functions must have all tags. If False, functions must have any of the tags. | (optional) defaults to false


### Return type

**Array<Function>**

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

# **updateFunctionConfigFunctionConfigPost**
> any updateFunctionConfigFunctionConfigPost()

Update function execution configuration settings.  Parameters:     max_parallel_jobs: Maximum number of parallel jobs allowed (default: 10)  Returns:     Updated configuration settings

### Example


```typescript
import { createConfiguration, FunctionApi } from '';
import type { FunctionApiUpdateFunctionConfigFunctionConfigPostRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionApi(configuration);

const request: FunctionApiUpdateFunctionConfigFunctionConfigPostRequest = {
  
  maxParallelJobs: 10,
};

const data = await apiInstance.updateFunctionConfigFunctionConfigPost(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **maxParallelJobs** | [**number**] |  | (optional) defaults to 10


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
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


