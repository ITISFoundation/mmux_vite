# .StudiesApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**cloneStudy**](StudiesApi.md#cloneStudy) | **POST** /v0/studies/{study_id}:clone | Clone Study
[**createStudyJob**](StudiesApi.md#createStudyJob) | **POST** /v0/studies/{study_id}/jobs | Create Study Job
[**deleteStudyJob**](StudiesApi.md#deleteStudyJob) | **DELETE** /v0/studies/{study_id}/jobs/{job_id} | Delete Study Job
[**getStudy**](StudiesApi.md#getStudy) | **GET** /v0/studies/{study_id} | Get Study
[**getStudyJobCustomMetadata**](StudiesApi.md#getStudyJobCustomMetadata) | **GET** /v0/studies/{study_id}/jobs/{job_id}/metadata | Get Study Job Custom Metadata
[**getStudyJobOutputLogfile**](StudiesApi.md#getStudyJobOutputLogfile) | **GET** /v0/studies/{study_id}/jobs/{job_id}/outputs/log-links | Get download links for study job log files
[**getStudyJobOutputs**](StudiesApi.md#getStudyJobOutputs) | **POST** /v0/studies/{study_id}/jobs/{job_id}/outputs | Get Study Job Outputs
[**inspectStudyJob**](StudiesApi.md#inspectStudyJob) | **POST** /v0/studies/{study_id}/jobs/{job_id}:inspect | Inspect Study Job
[**listStudies**](StudiesApi.md#listStudies) | **GET** /v0/studies | List Studies
[**listStudyPorts**](StudiesApi.md#listStudyPorts) | **GET** /v0/studies/{study_id}/ports | List Study Ports
[**replaceStudyJobCustomMetadata**](StudiesApi.md#replaceStudyJobCustomMetadata) | **PUT** /v0/studies/{study_id}/jobs/{job_id}/metadata | Replace Study Job Custom Metadata
[**startStudyJob**](StudiesApi.md#startStudyJob) | **POST** /v0/studies/{study_id}/jobs/{job_id}:start | Start Study Job
[**stopStudyJob**](StudiesApi.md#stopStudyJob) | **POST** /v0/studies/{study_id}/jobs/{job_id}:stop | Stop Study Job


# **cloneStudy**
> Study cloneStudy()


### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiCloneStudyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiCloneStudyRequest = {
  
  studyId: "study_id_example",
  
  xSimcoreParentProjectUuid: "x-simcore-parent-project-uuid_example",
  
  xSimcoreParentNodeId: "x-simcore-parent-node-id_example",
};

const data = await apiInstance.cloneStudy(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined
 **xSimcoreParentProjectUuid** | [**string**] |  | (optional) defaults to undefined
 **xSimcoreParentNodeId** | [**string**] |  | (optional) defaults to undefined


### Return type

**Study**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**404** | Study not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createStudyJob**
> Job createStudyJob(jobInputs)

hidden -- if True (default) hides project from UI

### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiCreateStudyJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiCreateStudyJobRequest = {
  
  studyId: "study_id_example",
  
  jobInputs: {
    values: {
      "key": null,
    },
  },
  
  hidden: true,
  
  xSimcoreParentProjectUuid: "x-simcore-parent-project-uuid_example",
  
  xSimcoreParentNodeId: "x-simcore-parent-node-id_example",
};

const data = await apiInstance.createStudyJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **jobInputs** | **JobInputs**|  |
 **studyId** | [**string**] |  | defaults to undefined
 **hidden** | [**boolean**] |  | (optional) defaults to true
 **xSimcoreParentProjectUuid** | [**string**] |  | (optional) defaults to undefined
 **xSimcoreParentNodeId** | [**string**] |  | (optional) defaults to undefined


### Return type

**Job**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteStudyJob**
> void deleteStudyJob()

Deletes an existing study job

### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiDeleteStudyJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiDeleteStudyJobRequest = {
  
  studyId: "study_id_example",
  
  jobId: "job_id_example",
};

const data = await apiInstance.deleteStudyJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**204** | Successful Response |  -  |
**404** | Not Found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getStudy**
> Study getStudy()

New in *version 0.5.0*

### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiGetStudyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiGetStudyRequest = {
  
  studyId: "study_id_example",
};

const data = await apiInstance.getStudy(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined


### Return type

**Study**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Study not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getStudyJobCustomMetadata**
> JobMetadata getStudyJobCustomMetadata()

Get custom metadata from a study\'s job  New in *version 0.7*

### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiGetStudyJobCustomMetadataRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiGetStudyJobCustomMetadataRequest = {
  
  studyId: "study_id_example",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getStudyJobCustomMetadata(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobMetadata**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getStudyJobOutputLogfile**
> JobLogsMap getStudyJobOutputLogfile()


### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiGetStudyJobOutputLogfileRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiGetStudyJobOutputLogfileRequest = {
  
  studyId: "study_id_example",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getStudyJobOutputLogfile(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobLogsMap**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getStudyJobOutputs**
> JobOutputs getStudyJobOutputs()


### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiGetStudyJobOutputsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiGetStudyJobOutputsRequest = {
  
  studyId: "study_id_example",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getStudyJobOutputs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobOutputs**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **inspectStudyJob**
> JobStatus inspectStudyJob()


### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiInspectStudyJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiInspectStudyJobRequest = {
  
  studyId: "study_id_example",
  
  jobId: "job_id_example",
};

const data = await apiInstance.inspectStudyJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobStatus**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listStudies**
> PageStudy listStudies()

New in *version 0.5.0*

### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiListStudiesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiListStudiesRequest = {
    // Page size limit (optional)
  limit: 20,
    // Page offset (optional)
  offset: 0,
};

const data = await apiInstance.listStudies(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] | Page size limit | (optional) defaults to 20
 **offset** | [**number**] | Page offset | (optional) defaults to 0


### Return type

**PageStudy**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listStudyPorts**
> OnePageStudyPort listStudyPorts()

Lists metadata on ports of a given study  New in *version 0.5.0*

### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiListStudyPortsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiListStudyPortsRequest = {
  
  studyId: "study_id_example",
};

const data = await apiInstance.listStudyPorts(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined


### Return type

**OnePageStudyPort**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Study not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **replaceStudyJobCustomMetadata**
> JobMetadata replaceStudyJobCustomMetadata(jobMetadataUpdate)

Changes custom metadata of a study\'s job  New in *version 0.7*

### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiReplaceStudyJobCustomMetadataRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiReplaceStudyJobCustomMetadataRequest = {
  
  studyId: "study_id_example",
  
  jobId: "job_id_example",
  
  jobMetadataUpdate: {
    metadata: {
      "key": null,
    },
  },
};

const data = await apiInstance.replaceStudyJobCustomMetadata(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **jobMetadataUpdate** | **JobMetadataUpdate**|  |
 **studyId** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobMetadata**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **startStudyJob**
> JobStatus startStudyJob()

Changed in *version 0.6.0*: Now responds with a 202 when successfully starting a computation Changed in *version 0.8*: query parameter `cluster_id` deprecated

### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiStartStudyJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiStartStudyJobRequest = {
  
  studyId: "study_id_example",
  
  jobId: "job_id_example",
  
  clusterId: 0,
};

const data = await apiInstance.startStudyJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined
 **clusterId** | [**number**] |  | (optional) defaults to undefined


### Return type

**JobStatus**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**202** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**200** | Job already started |  -  |
**406** | Cluster not found |  -  |
**422** | Configuration error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **stopStudyJob**
> JobStatus stopStudyJob()


### Example


```typescript
import { createConfiguration, StudiesApi } from '';
import type { StudiesApiStopStudyJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new StudiesApi(configuration);

const request: StudiesApiStopStudyJobRequest = {
  
  studyId: "study_id_example",
  
  jobId: "job_id_example",
};

const data = await apiInstance.stopStudyJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **studyId** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobStatus**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


