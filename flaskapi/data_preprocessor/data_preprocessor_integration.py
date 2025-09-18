"""
Integration utilities for DataPreprocessor with existing ML workflow.

This module provides helper functions to integrate the DataPreprocessor class
with the existing _create_training_file_from_jobs function and other workflow components.
"""

import pandas as pd
from pathlib import Path
from typing import List, Union, Dict, Any, Optional
from data_preprocessor import DataPreprocessor
import logging

_logger = logging.getLogger(__name__)


def create_training_file_with_preprocessor(
    jobs: List[Dict[str, Any]],
    input_vars: List[str],
    output_response: List[str],
    preprocessor: DataPreprocessor,
    folder_name: str = "evaluate"
) -> tuple[Path, DataPreprocessor]:
    """
    Create a training file from jobs using the DataPreprocessor for transformation.
    
    This function extends the existing _create_training_file_from_jobs functionality
    by applying data preprocessing transformations.
    
    Args:
        jobs: List of job dictionaries with 'inputs', 'outputs', and 'status' keys
        input_vars: List of input variable names
        output_response: Output variable name(s)
        preprocessor: Fitted DataPreprocessor instance
        folder_name: Name of the folder to create for output files
        
    Returns:
        Tuple of (training_file_path, fitted_preprocessor)
    """
    from mmux_python.utils.funs_evaluate import create_run_dir
    
    # Filter completed jobs
    completed_jobs = [
        job for job in jobs 
        if job.get("status", "").lower() in ["completed", "success"]
    ]
    
    _logger.debug(f"N Completed jobs: {len(completed_jobs)}")
    
    if len(completed_jobs) == 0:
        raise ValueError("No completed jobs found. Cannot create training file.")
    elif len(completed_jobs) < 5:
        raise ValueError("At least 5 samples are necessary to build a surrogate model in Dakota - a crash would occur otherwise.")
    
    # Convert output_response to list if string
    if isinstance(output_response, str):
        output_response_list = [output_response]
    else:
        output_response_list = output_response
    
    # Extract data from jobs
    def get_job_dict(job):
        d = {}
        # Add input variables
        for key in input_vars:
            if key in job.get("inputs", {}):
                d[key] = job["inputs"][key]
            else:
                _logger.warning(f"Input variable {key} not found in job inputs")
        
        # Add output variables
        if "outputs" not in job:
            raise ValueError(f"Outputs not found in job: {job}")
            
        for res in output_response_list:
            if res in job["outputs"]:
                d[res] = job["outputs"][res]
            else:
                raise ValueError(f"Output {res} not found in job outputs: {list(job['outputs'].keys())}")
        
        return d
    
    # Create DataFrame from jobs
    df_jobs = pd.DataFrame([get_job_dict(job) for job in completed_jobs])
    _logger.info(f"Created DataFrame with shape: {df_jobs.shape}")
    
    # Apply preprocessing
    df_transformed = preprocessor.fit_transform(df_jobs)
    _logger.info(f"Transformed DataFrame with shape: {df_transformed.shape}")
    _logger.info(f"Transformed columns: {list(df_transformed.columns)}")
    
    # Create run directory and save files
    run_dir = create_run_dir(Path("."), folder_name)
    
    # Save original data
    original_file = run_dir / "df_jobs_original.csv"
    df_jobs.to_csv(original_file, index=False)
    
    # Save transformed data
    training_file = run_dir / "df_jobs_transformed.csv"
    df_transformed.to_csv(training_file, index=False)
    
    # Save preprocessor configuration
    config_file = run_dir / "preprocessor_config.json"
    preprocessor.save_config(config_file)
    
    _logger.info(f"Training files created in: {run_dir}")
    _logger.info(f"Original data: {original_file}")
    _logger.info(f"Transformed data: {training_file}")
    _logger.info(f"Preprocessor config: {config_file}")
    
    return training_file, preprocessor


def setup_preprocessor_from_config(
    input_vars: List[str],
    output_response: List[str],
    input_normalizations: Optional[Dict[str, str]] = None,
    output_normalizations: Optional[Dict[str, str]] = None,
    input_sign_switches: Optional[List[str]] = None,
    output_sign_switches: Optional[List[str]] = None
) -> DataPreprocessor:
    """
    Create and configure a DataPreprocessor instance using the new separated workflow.
    
    Args:
        input_vars: List of input variable names
        output_response: Output variable name(s)
        input_normalizations: Dict mapping input var names to normalization methods
        output_normalizations: Dict mapping output var names to normalization methods
        input_sign_switches: List of input vars to switch signs
        output_sign_switches: List of output vars to switch signs
        
    Returns:
        Configured DataPreprocessor instance
    """
    preprocessor = DataPreprocessor()
    
    # Step 1: Set up basic variable mappings
    preprocessor.setup_variables(
        input_vars=input_vars,
        output_vars=output_response
    )
    
    # Step 2: Configure normalization (optional)
    if input_normalizations or output_normalizations:
        preprocessor.setup_normalization(
            input_normalizations=input_normalizations,
            output_normalizations=output_normalizations
        )
    
    # Step 3: Configure sign switching (optional)
    if input_sign_switches or output_sign_switches:
        preprocessor.setup_sign_switching(
            input_sign_switches=input_sign_switches,
            output_sign_switches=output_sign_switches
        )
    
    return preprocessor


def load_and_inverse_transform_results(
    results: Union[Dict[str, float], pd.DataFrame, List[Dict[str, float]]],
    config_file_path: Union[str, Path]
) -> Union[Dict[str, float], List[Dict[str, float]]]:
    """
    Load a preprocessor configuration and inverse transform algorithm results.
    
    Args:
        results: Results from ML algorithms (with mapped variable names)
        config_file_path: Path to the preprocessor configuration file
        
    Returns:
        Results with original variable names and scales
    """
    # Load preprocessor
    preprocessor = DataPreprocessor()
    preprocessor.load_config(config_file_path)
    
    # Handle different input formats
    if isinstance(results, dict):
        return preprocessor.inverse_transform(results)
    elif isinstance(results, pd.DataFrame):
        inverse_results = []
        for _, row in results.iterrows():
            inverse_results.append(preprocessor.inverse_transform(row.to_dict()))
        return inverse_results
    elif isinstance(results, list):
        return [preprocessor.inverse_transform(result) for result in results]
    else:
        raise ValueError(f"Unsupported results format: {type(results)}")


def get_preprocessing_summary(config_file_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Get a summary of preprocessing configuration from a saved config file.
    
    Args:
        config_file_path: Path to the preprocessor configuration file
        
    Returns:
        Summary dictionary
    """
    preprocessor = DataPreprocessor()
    preprocessor.load_config(config_file_path)
    return preprocessor.get_summary()
