import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions, PromiseConfigurationOptions } from '../configuration'
import { PromiseMiddleware, Middleware, PromiseMiddlewareWrapper } from '../middleware';

import { Function } from '../models/Function';
import { FunctionJob } from '../models/FunctionJob';
import { FunctionJobCollection } from '../models/FunctionJobCollection';
import { HTTPValidationError } from '../models/HTTPValidationError';
import { JobStatus } from '../models/JobStatus';
import { ValidationError } from '../models/ValidationError';
import { ValidationErrorLocInner } from '../models/ValidationErrorLocInner';
import { ObservableDefaultApi } from './ObservableAPI';

import { DefaultApiRequestFactory, DefaultApiResponseProcessor} from "../apis/DefaultApi";
export class PromiseDefaultApi {
    private api: ObservableDefaultApi

    public constructor(
        configuration: Configuration,
        requestFactory?: DefaultApiRequestFactory,
        responseProcessor?: DefaultApiResponseProcessor
    ) {
        this.api = new ObservableDefaultApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Generate OpenAPI spec and save to file
     * Generate Openapi
     */
    public generateOpenapiGenerateOpenapiGetWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.generateOpenapiGenerateOpenapiGetWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Generate OpenAPI spec and save to file
     * Generate Openapi
     */
    public generateOpenapiGenerateOpenapiGet(_options?: PromiseConfigurationOptions): Promise<any> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.generateOpenapiGenerateOpenapiGet(observableOptions);
        return result.toPromise();
    }


}



import { ObservableFunctionApi } from './ObservableAPI';

import { FunctionApiRequestFactory, FunctionApiResponseProcessor} from "../apis/FunctionApi";
export class PromiseFunctionApi {
    private api: ObservableFunctionApi

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionApiRequestFactory,
        responseProcessor?: FunctionApiResponseProcessor
    ) {
        this.api = new ObservableFunctionApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Run a function with multiple inputs and create a job collection.  Parameters:     function_id: ID of the function to run     collection_name: Name for the job collection     request_body: List of JSON strings containing input parameters     max_workers: Optional maximum number of parallel workers  Returns:     Created function job collection containing all job IDs
     * Batch Run Function
     * @param functionId
     * @param collectionName
     * @param requestBody
     * @param [maxWorkers]
     */
    public batchRunFunctionWithHttpInfo(functionId: number, collectionName: string, requestBody: Array<string>, maxWorkers?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<FunctionJobCollection>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.batchRunFunctionWithHttpInfo(functionId, collectionName, requestBody, maxWorkers, observableOptions);
        return result.toPromise();
    }

    /**
     * Run a function with multiple inputs and create a job collection.  Parameters:     function_id: ID of the function to run     collection_name: Name for the job collection     request_body: List of JSON strings containing input parameters     max_workers: Optional maximum number of parallel workers  Returns:     Created function job collection containing all job IDs
     * Batch Run Function
     * @param functionId
     * @param collectionName
     * @param requestBody
     * @param [maxWorkers]
     */
    public batchRunFunction(functionId: number, collectionName: string, requestBody: Array<string>, maxWorkers?: number, _options?: PromiseConfigurationOptions): Promise<FunctionJobCollection> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.batchRunFunction(functionId, collectionName, requestBody, maxWorkers, observableOptions);
        return result.toPromise();
    }

    /**
     * Create a new function with optional JSON Schema definitions for input and output. Validates that provided schemas are valid JSON Schema. Supports tags for better organization and searchability.
     * Create Function
     * @param _function
     */
    public createFunctionWithHttpInfo(_function: Function, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Function>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.createFunctionWithHttpInfo(_function, observableOptions);
        return result.toPromise();
    }

    /**
     * Create a new function with optional JSON Schema definitions for input and output. Validates that provided schemas are valid JSON Schema. Supports tags for better organization and searchability.
     * Create Function
     * @param _function
     */
    public createFunction(_function: Function, _options?: PromiseConfigurationOptions): Promise<Function> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.createFunction(_function, observableOptions);
        return result.toPromise();
    }

    /**
     * Delete all functions from the store.  Returns:     Message confirming deletion with count of deleted functions
     * Delete All Functions
     */
    public deleteAllFunctionsWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.deleteAllFunctionsWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Delete all functions from the store.  Returns:     Message confirming deletion with count of deleted functions
     * Delete All Functions
     */
    public deleteAllFunctions(_options?: PromiseConfigurationOptions): Promise<any> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.deleteAllFunctions(observableOptions);
        return result.toPromise();
    }

    /**
     * List all functions in the store.  Returns:     List of all registered functions
     * List Functions
     */
    public listFunctionsWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<Function>>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.listFunctionsWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * List all functions in the store.  Returns:     List of all registered functions
     * List Functions
     */
    public listFunctions(_options?: PromiseConfigurationOptions): Promise<Array<Function>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.listFunctions(observableOptions);
        return result.toPromise();
    }

    /**
     * Start asynchronous processing of multiple inputs with schema validation.
     * Map Function
     * @param functionId
     * @param requestBody
     * @param [maxWorkers]
     */
    public mapFunctionWithHttpInfo(functionId: number, requestBody: Array<string>, maxWorkers?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<FunctionJob>>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.mapFunctionWithHttpInfo(functionId, requestBody, maxWorkers, observableOptions);
        return result.toPromise();
    }

    /**
     * Start asynchronous processing of multiple inputs with schema validation.
     * Map Function
     * @param functionId
     * @param requestBody
     * @param [maxWorkers]
     */
    public mapFunction(functionId: number, requestBody: Array<string>, maxWorkers?: number, _options?: PromiseConfigurationOptions): Promise<Array<FunctionJob>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.mapFunction(functionId, requestBody, maxWorkers, observableOptions);
        return result.toPromise();
    }

    /**
     * Run a function with the given inputs. Validates inputs and outputs against JSON Schema if defined.
     * Run Function
     * @param functionId
     * @param inputs
     */
    public runFunctionWithHttpInfo(functionId: number, inputs: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<FunctionJob>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.runFunctionWithHttpInfo(functionId, inputs, observableOptions);
        return result.toPromise();
    }

    /**
     * Run a function with the given inputs. Validates inputs and outputs against JSON Schema if defined.
     * Run Function
     * @param functionId
     * @param inputs
     */
    public runFunction(functionId: number, inputs: string, _options?: PromiseConfigurationOptions): Promise<FunctionJob> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.runFunction(functionId, inputs, observableOptions);
        return result.toPromise();
    }

    /**
     * Search for functions by name.  Parameters:     name: String to search for in function names (case-sensitive partial match)  Returns:     List of functions whose names contain the search string
     * Search Functions By Name
     * @param name
     */
    public searchFunctionsByNameWithHttpInfo(name: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<Function>>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.searchFunctionsByNameWithHttpInfo(name, observableOptions);
        return result.toPromise();
    }

    /**
     * Search for functions by name.  Parameters:     name: String to search for in function names (case-sensitive partial match)  Returns:     List of functions whose names contain the search string
     * Search Functions By Name
     * @param name
     */
    public searchFunctionsByName(name: string, _options?: PromiseConfigurationOptions): Promise<Array<Function>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.searchFunctionsByName(name, observableOptions);
        return result.toPromise();
    }

    /**
     * Search for functions by tags.  Parameters:     tags: List of tags to search for     match_all: If True, functions must have all specified tags. If False, functions must have any of the specified tags.  Returns:     List of functions that match the tag criteria
     * Search Functions By Tags
     * @param tags Tags to search for
     * @param [matchAll] If True, functions must have all tags. If False, functions must have any of the tags.
     */
    public searchFunctionsByTagsWithHttpInfo(tags: Array<string>, matchAll?: boolean, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<Function>>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.searchFunctionsByTagsWithHttpInfo(tags, matchAll, observableOptions);
        return result.toPromise();
    }

    /**
     * Search for functions by tags.  Parameters:     tags: List of tags to search for     match_all: If True, functions must have all specified tags. If False, functions must have any of the specified tags.  Returns:     List of functions that match the tag criteria
     * Search Functions By Tags
     * @param tags Tags to search for
     * @param [matchAll] If True, functions must have all tags. If False, functions must have any of the tags.
     */
    public searchFunctionsByTags(tags: Array<string>, matchAll?: boolean, _options?: PromiseConfigurationOptions): Promise<Array<Function>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.searchFunctionsByTags(tags, matchAll, observableOptions);
        return result.toPromise();
    }

    /**
     * Update function execution configuration settings.  Parameters:     max_parallel_jobs: Maximum number of parallel jobs allowed (default: 10)  Returns:     Updated configuration settings
     * Update Function Config
     * @param [maxParallelJobs]
     */
    public updateFunctionConfigFunctionConfigPostWithHttpInfo(maxParallelJobs?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.updateFunctionConfigFunctionConfigPostWithHttpInfo(maxParallelJobs, observableOptions);
        return result.toPromise();
    }

    /**
     * Update function execution configuration settings.  Parameters:     max_parallel_jobs: Maximum number of parallel jobs allowed (default: 10)  Returns:     Updated configuration settings
     * Update Function Config
     * @param [maxParallelJobs]
     */
    public updateFunctionConfigFunctionConfigPost(maxParallelJobs?: number, _options?: PromiseConfigurationOptions): Promise<any> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.updateFunctionConfigFunctionConfigPost(maxParallelJobs, observableOptions);
        return result.toPromise();
    }


}



import { ObservableFunctionJobApi } from './ObservableAPI';

import { FunctionJobApiRequestFactory, FunctionJobApiResponseProcessor} from "../apis/FunctionJobApi";
export class PromiseFunctionJobApi {
    private api: ObservableFunctionJobApi

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionJobApiRequestFactory,
        responseProcessor?: FunctionJobApiResponseProcessor
    ) {
        this.api = new ObservableFunctionJobApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get the details of a specific function job.  Parameters:     function_job_id: ID of the function job to retrieve  Returns:     Function job details including status, inputs, and outputs  Raises:     HTTPException: If job is not found (404)
     * Get Function Job
     * @param functionJobId
     */
    public getFunctionJobWithHttpInfo(functionJobId: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<FunctionJob>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.getFunctionJobWithHttpInfo(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get the details of a specific function job.  Parameters:     function_job_id: ID of the function job to retrieve  Returns:     Function job details including status, inputs, and outputs  Raises:     HTTPException: If job is not found (404)
     * Get Function Job
     * @param functionJobId
     */
    public getFunctionJob(functionJobId: number, _options?: PromiseConfigurationOptions): Promise<FunctionJob> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.getFunctionJob(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get all jobs for a specific function with optional filtering and pagination.
     * Get Function Jobs
     * @param functionId ID of the function to get jobs for
     * @param [limit] Maximum number of jobs to return
     * @param [offset] Number of jobs to skip
     * @param [status] Filter by job status
     * @param [startDate] Filter jobs after this date
     * @param [endDate] Filter jobs before this date
     */
    public getFunctionJobsWithHttpInfo(functionId: number, limit?: number, offset?: number, status?: JobStatus, startDate?: Date, endDate?: Date, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<FunctionJob>>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.getFunctionJobsWithHttpInfo(functionId, limit, offset, status, startDate, endDate, observableOptions);
        return result.toPromise();
    }

    /**
     * Get all jobs for a specific function with optional filtering and pagination.
     * Get Function Jobs
     * @param functionId ID of the function to get jobs for
     * @param [limit] Maximum number of jobs to return
     * @param [offset] Number of jobs to skip
     * @param [status] Filter by job status
     * @param [startDate] Filter jobs after this date
     * @param [endDate] Filter jobs before this date
     */
    public getFunctionJobs(functionId: number, limit?: number, offset?: number, status?: JobStatus, startDate?: Date, endDate?: Date, _options?: PromiseConfigurationOptions): Promise<Array<FunctionJob>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.getFunctionJobs(functionId, limit, offset, status, startDate, endDate, observableOptions);
        return result.toPromise();
    }

    /**
     * Get status of multiple jobs.  Parameters:     job_ids: List of job IDs to check  Returns:     List of job statuses
     * Get Jobs Status
     * @param jobIds
     */
    public getJobsStatusWithHttpInfo(jobIds: Array<number>, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<FunctionJob>>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.getJobsStatusWithHttpInfo(jobIds, observableOptions);
        return result.toPromise();
    }

    /**
     * Get status of multiple jobs.  Parameters:     job_ids: List of job IDs to check  Returns:     List of job statuses
     * Get Jobs Status
     * @param jobIds
     */
    public getJobsStatus(jobIds: Array<number>, _options?: PromiseConfigurationOptions): Promise<Array<FunctionJob>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.getJobsStatus(jobIds, observableOptions);
        return result.toPromise();
    }

    /**
     * List all function jobs with optional filtering and pagination.  Parameters:     limit: Maximum number of jobs to return (default: all)     offset: Number of jobs to skip for pagination (default: 0)     status: Filter by job status (e.g., PENDING, RUNNING, COMPLETED, FAILED)     function_id: Filter jobs for a specific function     start_date: Include jobs created after this date     end_date: Include jobs created before this date  Returns:     List[FunctionJob]: A filtered list of function jobs
     * List all function jobs with optional filtering
     * @param [limit] Maximum number of jobs to return
     * @param [offset] Number of jobs to skip
     * @param [status] Filter by job status
     * @param [functionId] Filter by function ID
     * @param [startDate] Filter jobs after this date
     * @param [endDate] Filter jobs before this date
     */
    public listFunctionJobsWithHttpInfo(limit?: number, offset?: number, status?: JobStatus, functionId?: number, startDate?: Date, endDate?: Date, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<FunctionJob>>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.listFunctionJobsWithHttpInfo(limit, offset, status, functionId, startDate, endDate, observableOptions);
        return result.toPromise();
    }

    /**
     * List all function jobs with optional filtering and pagination.  Parameters:     limit: Maximum number of jobs to return (default: all)     offset: Number of jobs to skip for pagination (default: 0)     status: Filter by job status (e.g., PENDING, RUNNING, COMPLETED, FAILED)     function_id: Filter jobs for a specific function     start_date: Include jobs created after this date     end_date: Include jobs created before this date  Returns:     List[FunctionJob]: A filtered list of function jobs
     * List all function jobs with optional filtering
     * @param [limit] Maximum number of jobs to return
     * @param [offset] Number of jobs to skip
     * @param [status] Filter by job status
     * @param [functionId] Filter by function ID
     * @param [startDate] Filter jobs after this date
     * @param [endDate] Filter jobs before this date
     */
    public listFunctionJobs(limit?: number, offset?: number, status?: JobStatus, functionId?: number, startDate?: Date, endDate?: Date, _options?: PromiseConfigurationOptions): Promise<Array<FunctionJob>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.listFunctionJobs(limit, offset, status, functionId, startDate, endDate, observableOptions);
        return result.toPromise();
    }


}



import { ObservableFunctionJobCollectionApi } from './ObservableAPI';

import { FunctionJobCollectionApiRequestFactory, FunctionJobCollectionApiResponseProcessor} from "../apis/FunctionJobCollectionApi";
export class PromiseFunctionJobCollectionApi {
    private api: ObservableFunctionJobCollectionApi

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionJobCollectionApiRequestFactory,
        responseProcessor?: FunctionJobCollectionApiResponseProcessor
    ) {
        this.api = new ObservableFunctionJobCollectionApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a new function job collection.  Parameters:     collection: Collection details including name and optional description  Returns:     Created function job collection
     * Create Function Job Collection
     * @param functionJobCollection
     */
    public createFunctionJobCollectionWithHttpInfo(functionJobCollection: FunctionJobCollection, _options?: PromiseConfigurationOptions): Promise<HttpInfo<FunctionJobCollection>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.createFunctionJobCollectionWithHttpInfo(functionJobCollection, observableOptions);
        return result.toPromise();
    }

    /**
     * Create a new function job collection.  Parameters:     collection: Collection details including name and optional description  Returns:     Created function job collection
     * Create Function Job Collection
     * @param functionJobCollection
     */
    public createFunctionJobCollection(functionJobCollection: FunctionJobCollection, _options?: PromiseConfigurationOptions): Promise<FunctionJobCollection> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.createFunctionJobCollection(functionJobCollection, observableOptions);
        return result.toPromise();
    }

    /**
     * Get status of a function job collection.  Parameters:     collection_id: ID of the collection to check  Returns:     Collection details including current status of all jobs
     * Get Collection Status
     * @param collectionId
     */
    public getCollectionStatusWithHttpInfo(collectionId: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<FunctionJobCollection>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.getCollectionStatusWithHttpInfo(collectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get status of a function job collection.  Parameters:     collection_id: ID of the collection to check  Returns:     Collection details including current status of all jobs
     * Get Collection Status
     * @param collectionId
     */
    public getCollectionStatus(collectionId: number, _options?: PromiseConfigurationOptions): Promise<FunctionJobCollection> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.getCollectionStatus(collectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * List all function job collections.  Returns:     List of all function job collections
     * List Function Job Collections
     */
    public listFunctionJobCollectionsWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<FunctionJobCollection>>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.listFunctionJobCollectionsWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * List all function job collections.  Returns:     List of all function job collections
     * List Function Job Collections
     */
    public listFunctionJobCollections(_options?: PromiseConfigurationOptions): Promise<Array<FunctionJobCollection>> {
        let observableOptions: undefined | ConfigurationOptions
        if (_options){
	    observableOptions = {
                baseServer: _options.baseServer,
                httpApi: _options.httpApi,
                middleware: _options.middleware?.map(
                    m => new PromiseMiddlewareWrapper(m)
		),
		middlewareMergeStrategy: _options.middlewareMergeStrategy,
                authMethods: _options.authMethods
	    }
	}
        const result = this.api.listFunctionJobCollections(observableOptions);
        return result.toPromise();
    }


}



