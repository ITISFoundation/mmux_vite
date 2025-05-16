# .FunctionJobCollectionApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createFunctionJobCollection**](FunctionJobCollectionApi.md#createFunctionJobCollection) | **POST** /functionJobCollection | Create Function Job Collection
[**getCollectionStatus**](FunctionJobCollectionApi.md#getCollectionStatus) | **GET** /functionJobCollection/{collection_id}/status | Get Collection Status
[**listFunctionJobCollections**](FunctionJobCollectionApi.md#listFunctionJobCollections) | **GET** /functionJobCollection/list | List Function Job Collections


# **createFunctionJobCollection**
> FunctionJobCollection createFunctionJobCollection(functionJobCollection)

Create a new function job collection.  Parameters:     collection: Collection details including name and optional description  Returns:     Created function job collection

### Example


```typescript
import { createConfiguration, FunctionJobCollectionApi } from '';
import type { FunctionJobCollectionApiCreateFunctionJobCollectionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobCollectionApi(configuration);

const request: FunctionJobCollectionApiCreateFunctionJobCollectionRequest = {
  
  functionJobCollection: {
    id: 1,
    name: "name_example",
    description: "description_example",
    jobIds: [
      1,
    ],
    status: "status_example",
  },
};

const data = await apiInstance.createFunctionJobCollection(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobCollection** | **FunctionJobCollection**|  |


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

# **getCollectionStatus**
> FunctionJobCollection getCollectionStatus()

Get status of a function job collection.  Parameters:     collection_id: ID of the collection to check  Returns:     Collection details including current status of all jobs

### Example


```typescript
import { createConfiguration, FunctionJobCollectionApi } from '';
import type { FunctionJobCollectionApiGetCollectionStatusRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobCollectionApi(configuration);

const request: FunctionJobCollectionApiGetCollectionStatusRequest = {
  
  collectionId: 1,
};

const data = await apiInstance.getCollectionStatus(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **collectionId** | [**number**] |  | defaults to undefined


### Return type

**FunctionJobCollection**

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

# **listFunctionJobCollections**
> Array<FunctionJobCollection> listFunctionJobCollections()

List all function job collections.  Returns:     List of all function job collections

### Example


```typescript
import { createConfiguration, FunctionJobCollectionApi } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobCollectionApi(configuration);

const request = {};

const data = await apiInstance.listFunctionJobCollections(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<FunctionJobCollection>**

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


