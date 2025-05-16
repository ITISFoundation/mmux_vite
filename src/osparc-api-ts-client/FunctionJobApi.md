# .FunctionJobApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getFunctionJob**](FunctionJobApi.md#getFunctionJob) | **GET** /functionJob/{function_job_id} | Get Function Job
[**getFunctionJobs**](FunctionJobApi.md#getFunctionJobs) | **GET** /function/{function_id}/jobs | Get Function Jobs
[**getJobsStatus**](FunctionJobApi.md#getJobsStatus) | **GET** /function/job/status | Get Jobs Status
[**listFunctionJobs**](FunctionJobApi.md#listFunctionJobs) | **GET** /functionJobs | List all function jobs with optional filtering


# **getFunctionJob**
> FunctionJob getFunctionJob()

Get the details of a specific function job.  Parameters:     function_job_id: ID of the function job to retrieve  Returns:     Function job details including status, inputs, and outputs  Raises:     HTTPException: If job is not found (404)

### Example


```typescript
import { createConfiguration, FunctionJobApi } from '';
import type { FunctionJobApiGetFunctionJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobApi(configuration);

const request: FunctionJobApiGetFunctionJobRequest = {
  
  functionJobId: 1,
};

const data = await apiInstance.getFunctionJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobId** | [**number**] |  | defaults to undefined


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

# **getFunctionJobs**
> Array<FunctionJob> getFunctionJobs()

Get all jobs for a specific function with optional filtering and pagination.

### Example


```typescript
import { createConfiguration, FunctionJobApi } from '';
import type { FunctionJobApiGetFunctionJobsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobApi(configuration);

const request: FunctionJobApiGetFunctionJobsRequest = {
    // ID of the function to get jobs for
  functionId: 1,
    // Maximum number of jobs to return (optional)
  limit: 1,
    // Number of jobs to skip (optional)
  offset: 0,
    // Filter by job status (optional)
  status: "PENDING",
    // Filter jobs after this date (optional)
  startDate: new Date('1970-01-01T00:00:00.00Z'),
    // Filter jobs before this date (optional)
  endDate: new Date('1970-01-01T00:00:00.00Z'),
};

const data = await apiInstance.getFunctionJobs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionId** | [**number**] | ID of the function to get jobs for | defaults to undefined
 **limit** | [**number**] | Maximum number of jobs to return | (optional) defaults to undefined
 **offset** | [**number**] | Number of jobs to skip | (optional) defaults to undefined
 **status** | **JobStatus** | Filter by job status | (optional) defaults to undefined
 **startDate** | [**Date**] | Filter jobs after this date | (optional) defaults to undefined
 **endDate** | [**Date**] | Filter jobs before this date | (optional) defaults to undefined


### Return type

**Array<FunctionJob>**

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

# **getJobsStatus**
> Array<FunctionJob> getJobsStatus()

Get status of multiple jobs.  Parameters:     job_ids: List of job IDs to check  Returns:     List of job statuses

### Example


```typescript
import { createConfiguration, FunctionJobApi } from '';
import type { FunctionJobApiGetJobsStatusRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobApi(configuration);

const request: FunctionJobApiGetJobsStatusRequest = {
  
  jobIds: [
    1,
  ],
};

const data = await apiInstance.getJobsStatus(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **jobIds** | **Array&lt;number&gt;** |  | defaults to undefined


### Return type

**Array<FunctionJob>**

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

# **listFunctionJobs**
> Array<FunctionJob> listFunctionJobs()

List all function jobs with optional filtering and pagination.  Parameters:     limit: Maximum number of jobs to return (default: all)     offset: Number of jobs to skip for pagination (default: 0)     status: Filter by job status (e.g., PENDING, RUNNING, COMPLETED, FAILED)     function_id: Filter jobs for a specific function     start_date: Include jobs created after this date     end_date: Include jobs created before this date  Returns:     List[FunctionJob]: A filtered list of function jobs

### Example


```typescript
import { createConfiguration, FunctionJobApi } from '';
import type { FunctionJobApiListFunctionJobsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionJobApi(configuration);

const request: FunctionJobApiListFunctionJobsRequest = {
    // Maximum number of jobs to return (optional)
  limit: 1,
    // Number of jobs to skip (optional)
  offset: 0,
    // Filter by job status (optional)
  status: "PENDING",
    // Filter by function ID (optional)
  functionId: 1,
    // Filter jobs after this date (optional)
  startDate: new Date('1970-01-01T00:00:00.00Z'),
    // Filter jobs before this date (optional)
  endDate: new Date('1970-01-01T00:00:00.00Z'),
};

const data = await apiInstance.listFunctionJobs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] | Maximum number of jobs to return | (optional) defaults to undefined
 **offset** | [**number**] | Number of jobs to skip | (optional) defaults to undefined
 **status** | **JobStatus** | Filter by job status | (optional) defaults to undefined
 **functionId** | [**number**] | Filter by function ID | (optional) defaults to undefined
 **startDate** | [**Date**] | Filter jobs after this date | (optional) defaults to undefined
 **endDate** | [**Date**] | Filter jobs before this date | (optional) defaults to undefined


### Return type

**Array<FunctionJob>**

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


