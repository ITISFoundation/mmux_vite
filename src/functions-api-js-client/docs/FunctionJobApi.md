# SwaggerFunctionsStoreOpenApi30.FunctionJobApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getFunctionJob**](FunctionJobApi.md#getFunctionJob) | **GET** /functionJob/{function_job_id} | Get Function Job
[**getFunctionJobs**](FunctionJobApi.md#getFunctionJobs) | **GET** /function/{function_id}/jobs | Get Function Jobs
[**getJobsStatus**](FunctionJobApi.md#getJobsStatus) | **GET** /function/job/status | Get Jobs Status
[**listFunctionJobs**](FunctionJobApi.md#listFunctionJobs) | **GET** /functionJobs | List all function jobs with optional filtering



## getFunctionJob

> FunctionJob getFunctionJob(functionJobId)

Get Function Job

Get the details of a specific function job.  Parameters:     function_job_id: ID of the function job to retrieve  Returns:     Function job details including status, inputs, and outputs  Raises:     HTTPException: If job is not found (404)

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionJobApi();
let functionJobId = 56; // Number | 
apiInstance.getFunctionJob(functionJobId, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobId** | **Number**|  | 

### Return type

[**FunctionJob**](FunctionJob.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## getFunctionJobs

> [FunctionJob] getFunctionJobs(functionId, opts)

Get Function Jobs

Get all jobs for a specific function with optional filtering and pagination.

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionJobApi();
let functionId = 56; // Number | ID of the function to get jobs for
let opts = {
  'limit': 56, // Number | Maximum number of jobs to return
  'offset': 56, // Number | Number of jobs to skip
  'status': new SwaggerFunctionsStoreOpenApi30.JobStatus(), // JobStatus | Filter by job status
  'startDate': new Date("2013-10-20T19:20:30+01:00"), // Date | Filter jobs after this date
  'endDate': new Date("2013-10-20T19:20:30+01:00") // Date | Filter jobs before this date
};
apiInstance.getFunctionJobs(functionId, opts, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionId** | **Number**| ID of the function to get jobs for | 
 **limit** | **Number**| Maximum number of jobs to return | [optional] 
 **offset** | **Number**| Number of jobs to skip | [optional] 
 **status** | [**JobStatus**](.md)| Filter by job status | [optional] 
 **startDate** | **Date**| Filter jobs after this date | [optional] 
 **endDate** | **Date**| Filter jobs before this date | [optional] 

### Return type

[**[FunctionJob]**](FunctionJob.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## getJobsStatus

> [FunctionJob] getJobsStatus(jobIds)

Get Jobs Status

Get status of multiple jobs.  Parameters:     job_ids: List of job IDs to check  Returns:     List of job statuses

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionJobApi();
let jobIds = [null]; // [Number] | 
apiInstance.getJobsStatus(jobIds, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **jobIds** | [**[Number]**](Number.md)|  | 

### Return type

[**[FunctionJob]**](FunctionJob.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## listFunctionJobs

> [FunctionJob] listFunctionJobs(opts)

List all function jobs with optional filtering

List all function jobs with optional filtering and pagination.  Parameters:     limit: Maximum number of jobs to return (default: all)     offset: Number of jobs to skip for pagination (default: 0)     status: Filter by job status (e.g., PENDING, RUNNING, COMPLETED, FAILED)     function_id: Filter jobs for a specific function     start_date: Include jobs created after this date     end_date: Include jobs created before this date  Returns:     List[FunctionJob]: A filtered list of function jobs

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionJobApi();
let opts = {
  'limit': 56, // Number | Maximum number of jobs to return
  'offset': 56, // Number | Number of jobs to skip
  'status': new SwaggerFunctionsStoreOpenApi30.JobStatus(), // JobStatus | Filter by job status
  'functionId': 56, // Number | Filter by function ID
  'startDate': new Date("2013-10-20T19:20:30+01:00"), // Date | Filter jobs after this date
  'endDate': new Date("2013-10-20T19:20:30+01:00") // Date | Filter jobs before this date
};
apiInstance.listFunctionJobs(opts, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **Number**| Maximum number of jobs to return | [optional] 
 **offset** | **Number**| Number of jobs to skip | [optional] 
 **status** | [**JobStatus**](.md)| Filter by job status | [optional] 
 **functionId** | **Number**| Filter by function ID | [optional] 
 **startDate** | **Date**| Filter jobs after this date | [optional] 
 **endDate** | **Date**| Filter jobs before this date | [optional] 

### Return type

[**[FunctionJob]**](FunctionJob.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

