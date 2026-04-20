# DataPreprocessor Class Documentation

## Overview

The `DataPreprocessor` class is a comprehensive data preprocessing solution for machine learning workflows. It provides variable mapping, normalization, sign switching, and configuration persistence capabilities while maintaining the ability to reverse all transformations.

## Key Features

- **Variable Mapping**: Maps input variables to standardized names (`x1`, `x2`, ...) and output variables to (`y1`, `y2`, ...)
- **Separated Workflow**: Sign switching and normalization are now separate functions for maximum flexibility
- **Normalization**: Supports Z-score and Min-Max normalization with automatic denormalization
- **Sign Switching**: Allows switching signs of variables (useful for optimization problems)
- **Configuration Persistence**: Save and load preprocessing configurations for reproducibility
- **Integration**: Seamlessly integrates with existing `_create_training_file_from_jobs` workflow
- **Hidden Helper Functions**: Internal code deduplication for cleaner, more maintainable code

## Basic Usage

### 1. New Separated Workflow (Recommended)

The new workflow separates sign switching and normalization into different functions for better flexibility:

```python
from data_preprocessor import DataPreprocessor

# Create preprocessor instance
preprocessor = DataPreprocessor()

# Step 1: Set up basic variable mappings
preprocessor.setup_variables(
    input_vars=["Temperature_C", "Pressure_Bar", "FlowRate_LperMin"],
    output_vars=["Efficiency_Percent", "PowerConsumption_W"]
)

# Step 2: Configure normalization (optional)
preprocessor.setup_normalization(
    input_normalizations={"Temperature_C": "z_score", "Pressure_Bar": "min_max"},
    output_normalizations={"PowerConsumption_W": "z_score"}
)

# Step 3: Configure sign switching (optional)
preprocessor.setup_sign_switching(
    input_sign_switches=["FlowRate_LperMin"],  # Minimize flow rate
    output_sign_switches=["Efficiency_Percent"]  # Maximize efficiency (minimize negative)
)

# Fit and transform data
df_transformed = preprocessor.fit_transform(data)

# Inverse transform results
original_results = preprocessor.inverse_transform(algorithm_results)
```

### 2. Flexible Usage Examples

```python
# Example 1: Only variable mapping (no transformations)
preprocessor1 = DataPreprocessor()
preprocessor1.setup_variables(input_vars=["temp", "pressure"], output_vars=["efficiency"])
df_mapped = preprocessor1.fit_transform(data)

# Example 2: Only normalization
preprocessor2 = DataPreprocessor()
preprocessor2.setup_variables(input_vars=["temp", "pressure"], output_vars=["efficiency"])
preprocessor2.setup_normalization(input_normalizations={"temp": "z_score"})
df_normalized = preprocessor2.fit_transform(data)

# Example 3: Only sign switching
preprocessor3 = DataPreprocessor()
preprocessor3.setup_variables(input_vars=["temp", "pressure"], output_vars=["efficiency"])
preprocessor3.setup_sign_switching(output_sign_switches=["efficiency"])  # Maximize efficiency
df_switched = preprocessor3.fit_transform(data)

# Example 4: Both normalization and sign switching
preprocessor4 = DataPreprocessor()
preprocessor4.setup_variables(input_vars=["temp", "pressure"], output_vars=["efficiency"])
preprocessor4.setup_normalization(input_normalizations={"temp": "z_score"})
preprocessor4.setup_sign_switching(output_sign_switches=["efficiency"])
df_both = preprocessor4.fit_transform(data)
```

### 3. Integration with Existing Workflow

```python
from data_preprocessor_integration import (
    create_training_file_with_preprocessor,
    setup_preprocessor_from_config,
    load_and_inverse_transform_results
)

# Set up preprocessor using helper function (uses new separated workflow internally)
preprocessor = setup_preprocessor_from_config(
    input_vars=["Temperature_C", "Pressure_Bar"],
    output_response=["Efficiency_Percent"],
    input_normalizations={"Temperature_C": "z_score"},
    output_normalizations={"Efficiency_Percent": "min_max"}
)

# Create training file with preprocessing
training_file, fitted_preprocessor = create_training_file_with_preprocessor(
    jobs=jobs,
    input_vars=input_vars,
    output_response=output_response,
    preprocessor=preprocessor,
    folder_name="my_experiment"
)

# Later: inverse transform algorithm results
original_results = load_and_inverse_transform_results(
    results=algorithm_output,
    config_file_path="path/to/preprocessor_config.json"
)
```

### 4. Configuration Persistence

```python
# Save configuration for reproducibility
preprocessor.save_config("my_experiment_config.json")

# Load configuration later
new_preprocessor = DataPreprocessor()
new_preprocessor.load_config("my_experiment_config.json")

# Use loaded preprocessor
df_transformed = new_preprocessor.transform(new_data)
```

## Normalization Methods

### Z-Score Normalization
- Formula: `(x - mean) / std`
- Use for: Normal distributions, when you want zero mean and unit variance
- Parameter: `"z_score"`

### Min-Max Normalization
- Formula: `(x - min) / (max - min)`
- Use for: When you want values scaled to [0, 1] range
- Parameter: `"min_max"`

## Variable Mapping

The class automatically maps variables to standardized names:

- Input variables: `x1`, `x2`, `x3`, ...
- Output variables: `y1`, `y2`, `y3`, ...

This mapping is maintained internally and can be retrieved using:
```python
mapping = preprocessor.get_variable_mapping()
inverse_mapping = preprocessor.get_inverse_mapping()
```

## Sign Switching

Sign switching is useful for optimization problems:

- **Maximization problems**: Switch sign to convert to minimization
- **Direction consistency**: Ensure all objectives point in the same optimization direction

Example:
```python
# Original: maximize efficiency, minimize cost
# After sign switching: minimize (-efficiency), minimize cost
input_sign_switches=["cost_variable"]  # If cost should be minimized
output_sign_switches=["efficiency"]    # Convert maximization to minimization
```

## File Outputs

When using `create_training_file_with_preprocessor`, three files are created:

1. **`df_jobs_original.csv`**: Original data before transformation
2. **`df_jobs_transformed.csv`**: Transformed data for ML algorithms
3. **`preprocessor_config.json`**: Configuration for reproducibility

## Error Handling

The class handles various edge cases gracefully:

- **Missing variables**: Logs warnings and continues
- **Constant variables**: Skips normalization with warning
- **Invalid parameters**: Returns original values with warning
- **Type conversion**: Automatically converts pandas data to numpy arrays

## Integration Points

### With `_create_training_file_from_jobs`

The `create_training_file_with_preprocessor` function extends the existing workflow:

```python
# Instead of:
training_file = _create_training_file_from_jobs(jobs, input_vars, output_response)

# Use:
training_file, preprocessor = create_training_file_with_preprocessor(
    jobs, input_vars, output_response, preprocessor
)
```

### With Algorithm Results

After running algorithms on transformed data:

```python
# Algorithm produces results in transformed space (x1, x2, y1, y2)
algorithm_results = {"x1": 0.5, "x2": -0.2, "y1": 1.1}

# Convert back to original variable names and scales
original_results = preprocessor.inverse_transform(algorithm_results)
# Result: {"Temperature_C": 65.3, "Pressure_Bar": 2.1, "Efficiency_Percent": 0.89}
```

## Architecture Improvements

### Separated Workflow Benefits

The new separated workflow provides several advantages:

1. **Flexibility**: You can apply only the transformations you need
2. **Order Independence**: The order of `setup_normalization()` and `setup_sign_switching()` calls doesn't matter
3. **Clarity**: Each transformation is configured explicitly
4. **Debugging**: Easier to isolate issues with specific transformations

### Hidden Helper Functions

The class now uses internal helper functions to reduce code duplication:

- `_setup_variable_group()`: Sets up input or output variables with common logic
- `_configure_normalizations()`: Configures normalization for a group of variables
- `_configure_sign_switches()`: Configures sign switching for a group of variables
- `_fit_variable_group()`: Fits normalization parameters for a group of variables
- `_transform_variable_group()`: Transforms a group of variables

These helper functions ensure consistent behavior between input and output variable processing while keeping the code maintainable.

## Best Practices

1. **Always save configurations** for reproducibility
2. **Use the separated workflow** for maximum flexibility
3. **Use consistent variable names** across your workflow
4. **Validate inverse transformations** during development
5. **Choose appropriate normalization methods** based on data distribution
6. **Document sign switching decisions** for clarity
7. **Test with edge cases** (constant variables, missing data)

## Example Files

- **`data_preprocessor.py`**: Main class implementation
- **`data_preprocessor_integration.py`**: Integration helper functions
- **`data_preprocessor_example.py`**: Comprehensive usage examples

Run the example to see all features in action:
```bash
python data_preprocessor_example.py
```

## Summary

The DataPreprocessor class provides a complete solution for data preprocessing in ML workflows with the following benefits:

- ✅ Standardized variable naming (`x1`, `x2`, `y1`, `y2`)
- ✅ Flexible normalization (Z-score, Min-Max)
- ✅ Sign switching for optimization consistency
- ✅ Full reversibility of all transformations
- ✅ Configuration persistence for reproducibility
- ✅ Seamless integration with existing workflow
- ✅ Robust error handling
- ✅ Comprehensive logging
