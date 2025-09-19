"""
Data Preprocessor Class for ML Workflows

This module provides a comprehensive data preprocessing class that handles:
- Variable mapping to standardized names (x1, x2, ... for inputs; y1, y2, ... for outputs)
- Data normalization and denormalization
- Sign switching and restoration
- Configuration persistence for reproducibility

The class is designed to work with the existing _create_training_file_from_jobs function
and maintain compatibility with the ML workflow pipeline.
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Union, Optional, Any, Callable
from dataclasses import dataclass, asdict
import logging
import re

_logger = logging.getLogger(__name__)


@dataclass
class VariableConfig:
    """Configuration for a single variable transformation."""
    original_name: str
    mapped_name: str
    normalize: bool = False
    switch_sign: bool = False
    mean: Optional[float] = None
    std: Optional[float] = None
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    normalization_method: str = "z_score"  # "z_score", "min_max", or "none"


@dataclass
class PreprocessorConfig:
    """Complete configuration for the data preprocessor."""
    input_variables: Dict[str, VariableConfig]
    output_variables: Dict[str, VariableConfig]
    created_timestamp: str
    version: str = "1.0"


class DataPreprocessor:
    """
    A comprehensive data preprocessing class for ML workflows.
    
    This class handles variable mapping, normalization, and sign switching
    while maintaining the ability to reverse all transformations.
    """
    
    def __init__(self):
        self.input_variables: Dict[str, VariableConfig] = {}
        self.output_variables: Dict[str, VariableConfig] = {}
        self._is_fitted = False
        
    def setup_variables(
        self,
        input_vars: List[str],
        output_vars: List[str]
    ) -> None:
        """
        Set up the basic variable mappings to avoid issues with variable names.
        
        Args:
            input_vars: List of input variable names
            output_vars: List of output variable names
        """
            
        self.input_variables = self._setup_variable_group(input_vars, "x")
        self.output_variables = self._setup_variable_group(output_vars, "y")
            
        _logger.info(f"Set up {len(self.input_variables)} input variables and {len(self.output_variables)} output variables")
        return 
        
    def setup_normalization(
        self,
        input_normalizations: Optional[Dict[str, str]] = None,
        output_normalizations: Optional[Dict[str, str]] = None
    ) -> None:
        """
        Configure normalization for variables.
        
        Args:
            input_normalizations: Dict mapping input var names to normalization methods (e.g. {"Temperature_C": "z_score", "Pressure_Bar": "min_max"})
            output_normalizations: Dict mapping output var names to normalization methods (e.g. {"PowerConsumption_W": "z_score"})
        """
        if input_normalizations:
            self._configure_normalizations(self.input_variables, input_normalizations, "input")
            _logger.info(f"Configured normalization for {len(input_normalizations)} input variables")

        if output_normalizations:
            self._configure_normalizations(self.output_variables, output_normalizations, "output")
            _logger.info(f"Configured normalization for {len(output_normalizations)} output variables")

        return
        
    def setup_sign_switching(
        self,
        input_sign_switches: Optional[List[str]] = None,
        output_sign_switches: Optional[List[str]] = None
    ) -> None:
        """
        Configure sign switching for variables.
        
        Args:
            input_sign_switches: List of input vars to switch signs
            output_sign_switches: List of output vars to switch signs
        """
        input_sign_switches = input_sign_switches or []
        output_sign_switches = output_sign_switches or []
        
        # Configure input sign switches
        self._configure_sign_switches(self.input_variables, input_sign_switches, "input")
                
        # Configure output sign switches
        self._configure_sign_switches(self.output_variables, output_sign_switches, "output")
                
        _logger.info(f"Configured sign switching for {len(input_sign_switches)} input and {len(output_sign_switches)} output variables")
        
    def _setup_variable_group(self, var_names: List[str], prefix: str) -> Dict[str, VariableConfig]:
        """
        Helper function to set up a group of variables (inputs or outputs).
        
        Args:
            var_names: List of variable names
            prefix: Prefix for mapped names ("x" for inputs, "y" for outputs)
            
        Returns:
            Dictionary mapping variable names to VariableConfig objects
        """
        variables = {}
        for i, var_name in enumerate(var_names):
            mapped_name = f"{prefix}{i+1}"
            variables[var_name] = VariableConfig(
                original_name=var_name,
                mapped_name=mapped_name,
                normalize=False,
                switch_sign=False,
                normalization_method="none"
            )
        return variables
        
    def _configure_normalizations(
        self, 
        variables: Dict[str, VariableConfig], 
        normalizations: Dict[str, str], 
        var_type: str
    ) -> None:
        """
        Helper function to configure normalizations for a group of variables.
        
        Args:
            variables: Dictionary of variables to configure
            normalizations: Dict mapping var names to normalization methods
            var_type: Type of variables ("input" or "output") for logging
        """
        for var_name, norm_method in normalizations.items():
            if var_name in variables:
                variables[var_name].normalize = True
                variables[var_name].normalization_method = norm_method
            else:
                _logger.warning(f"{var_type.capitalize()} variable {var_name} not found in setup variables")
                
    def _configure_sign_switches(
        self, 
        variables: Dict[str, VariableConfig], 
        sign_switches: List[str], 
        var_type: str
    ) -> None:
        """
        Helper function to configure sign switching for a group of variables.
        
        Args:
            variables: Dictionary of variables to configure
            sign_switches: List of var names to switch signs
            var_type: Type of variables ("input" or "output") for logging
        """
        for var_name in sign_switches:
            if var_name in variables:
                variables[var_name].switch_sign = True
            else:
                _logger.warning(f"{var_type.capitalize()} variable {var_name} not found in setup variables")
                
    def _fit_variable_group(
        self, 
        data: pd.DataFrame, 
        variables: Dict[str, VariableConfig], 
        var_type: str
    ) -> None:
        """
        Helper function to fit normalization parameters for a group of variables.
        
        Args:
            data: DataFrame containing the data
            variables: Dictionary of variables to fit
            var_type: Type of variables ("input" or "output") for logging
        """
        for var_name, config in variables.items():
            if var_name not in data.columns:
                _logger.warning(f"{var_type.capitalize()} variable {var_name} not found in data")
                continue
                
            values = np.array(data[var_name].values, dtype=float)
            if config.switch_sign:
                values = -values
                
            if config.normalize and config.normalization_method != "none":
                if config.normalization_method == "z_score":
                    config.mean = float(np.mean(values))
                    config.std = float(np.std(values))
                elif config.normalization_method == "min_max":
                    config.min_val = float(np.min(values))
                    config.max_val = float(np.max(values))
                
    def _transform_variable_group(
        self, 
        data: pd.DataFrame, 
        variables: Dict[str, VariableConfig], 
        transformed_data: Dict[str, np.ndarray],
        var_type: str
    ) -> Dict[str, np.ndarray]:
        """
        Helper function to transform a group of variables.
        
        Args:
            data: DataFrame containing the data to transform
            variables: Dictionary of variables to transform
            transformed_data: Dictionary to store transformed values
            var_type: Type of variables ("input" or "output") for logging
        """
        for var_name, config in variables.items():
            if var_name not in data.columns:
                _logger.warning(f"{var_type.capitalize()} variable {var_name} not found in data during transform")
                continue
                
            values = np.array(data[var_name].values, dtype=float).copy()
            
            # Apply sign switch
            if config.switch_sign:
                values = -values
                
            # Apply normalization
            if config.normalize and config.normalization_method != "none":
                values = self._normalize_values(values, config)
                
            transformed_data[config.mapped_name] = values
        
        return transformed_data
                
    def fit(self, data: Union[pd.DataFrame, List[Dict[str, Any]]]) -> 'DataPreprocessor':
        """
        Fit the preprocessor to the data to compute normalization parameters.
        
        Args:
            data: DataFrame or list of dictionaries containing the training data
            
        Returns:
            Self for method chaining
        """
        # Convert to DataFrame if needed
        if isinstance(data, list):
            data = pd.DataFrame(data)
            
        self._fit_variable_group(data, self.input_variables, "input")
        self._fit_variable_group(data, self.output_variables, "output")
                    
        self._is_fitted = True
        _logger.info("Preprocessor fitted to data")
        return self
        
    def transform(self, data: Union[pd.DataFrame, List[Dict[str, Any]]]) -> pd.DataFrame:
        """
        Transform the data using the fitted preprocessor.
        
        Args:
            data: Data to transform
            
        Returns:
            Transformed DataFrame with mapped variable names
        """
        if not self._is_fitted:
            raise ValueError("Preprocessor must be fitted before transforming data")
            
        if isinstance(data, list):
            data = pd.DataFrame(data)
            
        transformed_data = {}
        transformed_data = self._transform_variable_group(data, self.input_variables, transformed_data, "input")
        transformed_data = self._transform_variable_group(data, self.output_variables, transformed_data, "output")
            
        return pd.DataFrame(transformed_data)
        
    def inverse_transform(self, data: Union[pd.DataFrame, Dict[str, List[float]], np.ndarray]) -> Dict[str, List[float]]:
        """
        Inverse transform the data back to original scale and variable names.
        
        Args:
            data: Transformed data to inverse transform. Can be:
                - pd.DataFrame: Each column contains a list of floats
                - Dict[str, List[float]]: Dictionary where each value is a list of floats
                - np.ndarray: Array of values (assumes order matches mapped variables)
            
        Returns:
            Dictionary with original variable names and List[float] values
        """
        if not self._is_fitted:
            raise ValueError("Preprocessor must be fitted before inverse transforming data")
            
        # Handle different input formats
        if isinstance(data, np.ndarray):
            # Assume it's in the order of mapped variables
            all_vars = list(self.input_variables.values()) + list(self.output_variables.values())
            if data.ndim == 1:
                # Single row of data
                data_dict = {var.mapped_name: [float(data[i])] for i, var in enumerate(all_vars) if i < len(data)}
            else:
                # Multiple rows of data
                data_dict = {var.mapped_name: data[:, i].tolist() for i, var in enumerate(all_vars) if i < data.shape[1]}
            data = data_dict
        elif isinstance(data, pd.DataFrame):
            # Convert DataFrame to dictionary, handling both single values and lists
            data_dict = {}
            for col in data.columns:
                col_data = data[col].values
                if len(col_data) == 1 and not isinstance(col_data[0], (list, np.ndarray)):
                    # Single value, convert to list
                    data_dict[col] = [float(col_data[0])]
                elif isinstance(col_data[0], (list, np.ndarray)):
                    # Each cell contains a list/array
                    data_dict[col] = [float(val) for sublist in col_data for val in (sublist if isinstance(sublist, (list, np.ndarray)) else [sublist])]
                else:
                    # Multiple values, convert to list
                    data_dict[col] = col_data.tolist()
            data = data_dict
        elif isinstance(data, dict):
            # Ensure all values are lists
            data_dict = {}
            for key, value in data.items():
                if isinstance(value, (list, np.ndarray)):
                    data_dict[key] = [float(v) for v in value]
                else:
                    data_dict[key] = [float(value)]
            data = data_dict
            
        result = {}
        
        # Inverse transform input variables
        for var_name, config in self.input_variables.items():
            if config.mapped_name in data:
                value = data[config.mapped_name]
                
                # Inverse normalization
                if config.normalize and config.normalization_method != "none":
                    value = self._denormalize_value(value, config)
                    
                # Inverse sign switch - handle both single values and lists
                if config.switch_sign:
                    if isinstance(value, list):
                        value = [-v for v in value]
                    else:
                        value = -value
                
                # Ensure result is always a list
                if not isinstance(value, list):
                    value = [value]
                    
                result[var_name] = value
                
        # Inverse transform output variables
        for var_name, config in self.output_variables.items():
            if config.mapped_name in data:
                value = data[config.mapped_name]
                
                # Inverse normalization
                if config.normalize and config.normalization_method != "none":
                    value = self._denormalize_value(value, config)
                    
                # Inverse sign switch - handle both single values and lists
                if config.switch_sign:
                    if isinstance(value, list):
                        value = [-v for v in value]
                    else:
                        value = -value
                
                # Ensure result is always a list
                if not isinstance(value, list):
                    value = [value]
                    
                result[var_name] = value
                
        return result
        
    def _normalize_values(self, values: np.ndarray, config: VariableConfig) -> np.ndarray:
        """Apply normalization to values based on config."""
        if config.normalization_method == "z_score":
            if config.std is None or config.mean is None or config.std == 0:
                _logger.warning(f"Invalid parameters mean = {config.mean} and std = {config.std} for z_score normalization of {config.original_name}, skipping normalization")
                return values
            else:
                normalized_values = (values - config.mean) / config.std
                return normalized_values
        elif config.normalization_method == "min_max":
            if config.max_val is None or config.min_val is None or config.max_val == config.min_val:
                _logger.warning(f"Invalid parameters min = {config.min_val} and max = {config.max_val} for min_max normalization of {config.original_name}, skipping normalization")
                return values
            else:
                normalized_values = (values - config.min_val) / (config.max_val - config.min_val)
                return normalized_values
        else:
            return values
            
    def _denormalize_value(self, value: Union[float, List[float], np.ndarray], config: VariableConfig) -> Union[float, List[float]]:
        """Apply denormalization to a single value or list of values based on config."""
        # Handle different input types
        if isinstance(value, list):
            values_array = np.array(value, dtype=float)
        elif isinstance(value, np.ndarray):
            values_array = value.astype(float)
        else:
            # Single value case
            if config.normalization_method == "z_score":
                if config.std is None or config.mean is None:
                    _logger.warning(f"Invalid parameters for z_score denormalization of {config.original_name}")
                    return value
                return value * config.std + config.mean
            elif config.normalization_method == "min_max":
                if config.max_val is None or config.min_val is None:
                    _logger.warning(f"Invalid parameters for min_max denormalization of {config.original_name}")
                    return value
                return value * (config.max_val - config.min_val) + config.min_val
            else:
                return value
        
        # Handle array/list case
        if config.normalization_method == "z_score":
            if config.std is None or config.mean is None:
                _logger.warning(f"Invalid parameters for z_score denormalization of {config.original_name}")
                return values_array.tolist()
            denormalized = values_array * config.std + config.mean
        elif config.normalization_method == "min_max":
            if config.max_val is None or config.min_val is None:
                _logger.warning(f"Invalid parameters for min_max denormalization of {config.original_name}")
                return values_array.tolist()
            denormalized = values_array * (config.max_val - config.min_val) + config.min_val
        else:
            denormalized = values_array
            
        # Always return as list for consistency
        return denormalized.tolist()
            
    def get_variable_mapping(self) -> Dict[str, str]:
        """
        Get the mapping from original variable names to mapped names.
        
        Returns:
            Dictionary mapping original names to mapped names
        """
        mapping = {}
        for var_name, config in self.input_variables.items():
            mapping[var_name] = config.mapped_name
        for var_name, config in self.output_variables.items():
            mapping[var_name] = config.mapped_name
        return mapping
        
    def get_inverse_mapping(self) -> Dict[str, str]:
        """
        Get the mapping from mapped variable names to original names.
        
        Returns:
            Dictionary mapping mapped names to original names
        """
        mapping = {}
        for var_name, config in self.input_variables.items():
            mapping[config.mapped_name] = var_name
        for var_name, config in self.output_variables.items():
            mapping[config.mapped_name] = var_name
        return mapping
        
    def save_config(self, file_path: Union[str, Path]) -> None:
        """
        Save the preprocessor configuration to a JSON file.
        
        Args:
            file_path: Path to save the configuration file
        """
        if not self._is_fitted:
            raise ValueError("Preprocessor must be fitted before saving config")
            
        from datetime import datetime
        
        config = PreprocessorConfig(
            input_variables={name: config for name, config in self.input_variables.items()},
            output_variables={name: config for name, config in self.output_variables.items()},
            created_timestamp=datetime.now().isoformat()
        )
        
        # Convert to dictionary and handle numpy types
        config_dict = asdict(config)
        
        # Convert numpy types to Python native types
        def convert_numpy_types(obj):
            if isinstance(obj, dict):
                return {k: convert_numpy_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy_types(v) for v in obj]
            elif isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            else:
                return obj
                
        config_dict = convert_numpy_types(config_dict)
        
        with open(file_path, 'w') as f:
            json.dump(config_dict, f, indent=2)
            
        _logger.info(f"Configuration saved to {file_path}")
        
    def load_config(self, file_path: Union[str, Path]) -> 'DataPreprocessor':
        """
        Load the preprocessor configuration from a JSON file.
        
        Args:
            file_path: Path to the configuration file
            
        Returns:
            Self for method chaining
        """
        with open(file_path, 'r') as f:
            config_dict = json.load(f)
            
        # Reconstruct VariableConfig objects
        self.input_variables = {}
        for name, var_config in config_dict['input_variables'].items():
            self.input_variables[name] = VariableConfig(**var_config)
            
        self.output_variables = {}
        for name, var_config in config_dict['output_variables'].items():
            self.output_variables[name] = VariableConfig(**var_config)
            
        self._is_fitted = True
        _logger.info(f"Configuration loaded from {file_path}")
        return self
        
    def fit_transform(self, data: Union[pd.DataFrame, List[Dict[str, Any]]]) -> pd.DataFrame:
        """
        Fit the preprocessor and transform the data in one step.
        
        Args:
            data: Data to fit and transform
            
        Returns:
            Transformed DataFrame
        """
        return self.fit(data).transform(data)
        
    def filter_variables(
        self,
        include_inputs: Optional[List[str]] = None,
        exclude_inputs: Optional[List[str]] = None,
        include_outputs: Optional[List[str]] = None,
        exclude_outputs: Optional[List[str]] = None,
        input_patterns: Optional[List[str]] = None,
        output_patterns: Optional[List[str]] = None,
        input_predicate: Optional[Callable[[str, VariableConfig], bool]] = None,
        output_predicate: Optional[Callable[[str, VariableConfig], bool]] = None
    ) -> 'DataPreprocessor':
        """
        Filter variables based on various criteria. This method can be used to select
        a subset of variables for processing while maintaining all configurations.
        
        Args:
            include_inputs: List of input variable names to include (exact matches)
            exclude_inputs: List of input variable names to exclude (exact matches)
            include_outputs: List of output variable names to include (exact matches)
            exclude_outputs: List of output variable names to exclude (exact matches)
            input_patterns: List of regex patterns for input variable names to include
            output_patterns: List of regex patterns for output variable names to include
            input_predicate: Custom function to filter input variables (name, config) -> bool
            output_predicate: Custom function to filter output variables (name, config) -> bool
            
        Returns:
            Self for method chaining
            
        Note:
            - If both include and exclude lists are provided, include takes precedence
            - Patterns are applied after exact name filtering
            - Predicates are applied last and can override other filters
            - The method preserves all variable configurations (normalization, sign switching)
        """
        # Filter input variables
        filtered_inputs = self._filter_variable_group(
            self.input_variables,
            include_list=include_inputs,
            exclude_list=exclude_inputs,
            patterns=input_patterns,
            predicate=input_predicate,
            var_type="input"
        )
        
        # Filter output variables
        filtered_outputs = self._filter_variable_group(
            self.output_variables,
            include_list=include_outputs,
            exclude_list=exclude_outputs,
            patterns=output_patterns,
            predicate=output_predicate,
            var_type="output"
        )
        
        # Update the variable dictionaries
        self.input_variables = filtered_inputs
        self.output_variables = filtered_outputs
        
        # Remap variable names to maintain sequential numbering
        self._remap_filtered_variables()
        
        _logger.info(f"Filtered variables: {len(self.input_variables)} inputs, {len(self.output_variables)} outputs")
        
        return self
    
    def _filter_variable_group(
        self,
        variables: Dict[str, VariableConfig],
        include_list: Optional[List[str]] = None,
        exclude_list: Optional[List[str]] = None,
        patterns: Optional[List[str]] = None,
        predicate: Optional[Callable[[str, VariableConfig], bool]] = None,
        var_type: str = "variable"
    ) -> Dict[str, VariableConfig]:
        """
        Helper method to filter a group of variables based on various criteria.
        
        Args:
            variables: Dictionary of variables to filter
            include_list: List of variable names to include
            exclude_list: List of variable names to exclude
            patterns: List of regex patterns to match
            predicate: Custom filtering function
            var_type: Type of variables for logging
            
        Returns:
            Filtered dictionary of variables
        """
        filtered_vars = {}
        
        for var_name, config in variables.items():
            should_include = True
            
            # Apply include/exclude lists (include takes precedence)
            if include_list is not None:
                should_include = var_name in include_list
            elif exclude_list is not None:
                should_include = var_name not in exclude_list
            
            # Apply pattern matching (only if not already excluded by lists)
            if should_include and patterns is not None:
                pattern_match = any(re.search(pattern, var_name) for pattern in patterns)
                should_include = pattern_match
            
            # Apply custom predicate (final filter)
            if should_include and predicate is not None:
                should_include = predicate(var_name, config)
            
            if should_include:
                filtered_vars[var_name] = config
            else:
                _logger.debug(f"Filtered out {var_type} variable: {var_name}")
        
        return filtered_vars
    
    def _remap_filtered_variables(self) -> None:
        """
        Remap the filtered variables to maintain sequential numbering (x1, x2, ... and y1, y2, ...).
        This ensures consistency in variable naming after filtering.
        """
        # Remap input variables
        for i, (var_name, config) in enumerate(self.input_variables.items()):
            config.mapped_name = f"x{i+1}"
        
        # Remap output variables
        for i, (var_name, config) in enumerate(self.output_variables.items()):
            config.mapped_name = f"y{i+1}"
    
    def filter_by_names(
        self,
        input_names: Optional[List[str]] = None,
        output_names: Optional[List[str]] = None,
        exclude: bool = False
    ) -> 'DataPreprocessor':
        """
        Convenience method to filter variables by exact name matches.
        
        Args:
            input_names: List of input variable names
            output_names: List of output variable names
            exclude: If True, exclude the specified names; if False, include only these names
            
        Returns:
            Self for method chaining
        """
        if exclude:
            return self.filter_variables(
                exclude_inputs=input_names,
                exclude_outputs=output_names
            )
        else:
            return self.filter_variables(
                include_inputs=input_names,
                include_outputs=output_names
            )
    
    def filter_by_patterns(
        self,
        input_patterns: Optional[List[str]] = None,
        output_patterns: Optional[List[str]] = None
    ) -> 'DataPreprocessor':
        """
        Convenience method to filter variables by regex patterns.
        
        Args:
            input_patterns: List of regex patterns for input variables
            output_patterns: List of regex patterns for output variables
            
        Returns:
            Self for method chaining
        """
        return self.filter_variables(
            input_patterns=input_patterns,
            output_patterns=output_patterns
        )
    
    def filter_normalized_only(self) -> 'DataPreprocessor':
        """
        Convenience method to keep only variables that have normalization enabled.
        
        Returns:
            Self for method chaining
        """
        return self.filter_variables(
            input_predicate=lambda name, config: config.normalize,
            output_predicate=lambda name, config: config.normalize
        )
    
    def filter_non_normalized_only(self) -> 'DataPreprocessor':
        """
        Convenience method to keep only variables that do not have normalization enabled.
        
        Returns:
            Self for method chaining
        """
        return self.filter_variables(
            input_predicate=lambda name, config: not config.normalize,
            output_predicate=lambda name, config: not config.normalize
        )
    
    def get_filtered_variable_names(self) -> Dict[str, List[str]]:
        """
        Get the names of currently configured variables after any filtering.
        
        Returns:
            Dictionary with 'inputs' and 'outputs' keys containing lists of variable names
        """
        return {
            "inputs": list(self.input_variables.keys()),
            "outputs": list(self.output_variables.keys())
        }
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the preprocessor configuration.
        
        Returns:
            Dictionary containing summary information
        """
        summary = {
            "fitted": self._is_fitted,
            "n_input_variables": len(self.input_variables),
            "n_output_variables": len(self.output_variables),
            "input_variables": {},
            "output_variables": {}
        }
        
        for name, config in self.input_variables.items():
            summary["input_variables"][name] = {
                "mapped_name": config.mapped_name,
                "normalize": config.normalize,
                "normalization_method": config.normalization_method,
                "switch_sign": config.switch_sign
            }
            
        for name, config in self.output_variables.items():
            summary["output_variables"][name] = {
                "mapped_name": config.mapped_name,
                "normalize": config.normalize,
                "normalization_method": config.normalization_method,
                "switch_sign": config.switch_sign
            }
            
        return summary
