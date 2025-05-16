# .FunctionJobsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteFunctionJob**](FunctionJobsApi.md#deleteFunctionJob) | **DELETE** /v0/function_jobs/{function_job_id} | Delete Function Job
[**functionJobOutputs**](FunctionJobsApi.md#functionJobOutputs) | **GET** /v0/function_jobs/{function_job_id}/outputs | Function Job Outputs
[**functionJobStatus**](FunctionJobsApi.md#functionJobStatus) | **GET** /v0/function_jobs/{function_job_id}/status | Function Job Status
[**getFunctionJob**](FunctionJobsApi.md#getFunctionJob) | **GET** /v0/function_jobs/{function_job_id} | Get Function Job
[**listFunctionJobs**](FunctionJobsApi.md#listFunctionJobs) | **GET** /v0/function_jobs | List Function Jobs
[**registerFunctionJob**](FunctionJobsApi.md#registerFunctionJob) | **POST** /v0/function_jobs | Register Function Job


# **deleteFunctionJob**
> any deleteFunctionJob()

Delete function job

### Example


```typescript
import { createConfiguration, FunctionJobsApi } from '';
import type { FunctionJobsApiDeleteFunctionJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobsApi(configuration);

const request: FunctionJobsApiDeleteFunctionJobRequest = {
  
  functionJobId: "function_job_id_example",
};

const data = await apiInstance.deleteFunctionJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobId** | [**string**] |  | defaults to undefined


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
**404** | Function job not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **functionJobOutputs**
> any functionJobOutputs()

Get function job outputs

### Example


```typescript
import { createConfiguration, FunctionJobsApi } from '';
import type { FunctionJobsApiFunctionJobOutputsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobsApi(configuration);

const request: FunctionJobsApiFunctionJobOutputsRequest = {
  
  functionJobId: "function_job_id_example",
};

const data = await apiInstance.functionJobOutputs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobId** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **functionJobStatus**
> FunctionJobStatus functionJobStatus()

Get function job status

### Example


```typescript
import { createConfiguration, FunctionJobsApi } from '';
import type { FunctionJobsApiFunctionJobStatusRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobsApi(configuration);

const request: FunctionJobsApiFunctionJobStatusRequest = {
  
  functionJobId: "function_job_id_example",
};

const data = await apiInstance.functionJobStatus(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobId** | [**string**] |  | defaults to undefined


### Return type

**FunctionJobStatus**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getFunctionJob**
> ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet getFunctionJob()

Get function job

### Example


```typescript
import { createConfiguration, FunctionJobsApi } from '';
import type { FunctionJobsApiGetFunctionJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobsApi(configuration);

const request: FunctionJobsApiGetFunctionJobRequest = {
  
  functionJobId: "function_job_id_example",
};

const data = await apiInstance.getFunctionJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobId** | [**string**] |  | defaults to undefined


### Return type

**ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listFunctionJobs**
> PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass listFunctionJobs()

List function jobs

### Example


```typescript
import { createConfiguration, FunctionJobsApi } from '';
import type { FunctionJobsApiListFunctionJobsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobsApi(configuration);

const request: FunctionJobsApiListFunctionJobsRequest = {
    // Page size limit (optional)
  limit: 20,
    // Page offset (optional)
  offset: 0,
};

const data = await apiInstance.listFunctionJobs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] | Page size limit | (optional) defaults to 20
 **offset** | [**number**] | Page offset | (optional) defaults to 0


### Return type

**PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass**

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

# **registerFunctionJob**
> ResponseRegisterFunctionJobV0FunctionJobsPost registerFunctionJob(functionJob)

Create function job

### Example


```typescript
import { createConfiguration, FunctionJobsApi } from '';
import type { FunctionJobsApiRegisterFunctionJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobsApi(configuration);

const request: FunctionJobsApiRegisterFunctionJobRequest = {
  
  functionJob: null,
};

const data = await apiInstance.registerFunctionJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJob** | **FunctionJob**|  |


### Return type

**ResponseRegisterFunctionJobV0FunctionJobsPost**

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


