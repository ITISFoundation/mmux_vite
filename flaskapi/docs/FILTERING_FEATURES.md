# Variable Filtering Features for DataPreprocessor

This document describes the comprehensive variable filtering capabilities that have been added to the `DataPreprocessor` class. These features allow you to select subsets of input and output variables based on various criteria while preserving all preprocessing configurations.

## Overview

The filtering functionality enables you to:
- **Select variables by exact names** (include/exclude lists)
- **Filter using regex patterns** for flexible name matching
- **Apply custom predicates** for complex filtering logic
- **Filter based on statistical properties** of the data
- **Combine multiple filtering criteria** in a single operation
- **Create filtered copies** of preprocessors without modifying the original

## Core Methods

### 1. `filter_variables()` - Main Filtering Method

The primary filtering method with comprehensive options:

```python
preprocessor.filter_variables(
    include_inputs=["Temperature_C", "Pressure_Bar"],     # Exact names to include
    exclude_inputs=["Voltage_V", "Current_A"],           # Exact names to exclude
    include_outputs=["Efficiency_Percent"],              # Output names to include
    exclude_outputs=["HeatGenerated_W"],                 # Output names to exclude
    input_patterns=[r".*_C$", r".*Flow.*"],             # Regex patterns for inputs
    output_patterns=[r".*_W$"],                          # Regex patterns for outputs
    input_predicate=lambda name, config: len(name) < 15, # Custom input filter
    output_predicate=lambda name, config: config.normalize # Custom output filter
)
```

**Filter Priority:**
1. Include/exclude lists (include takes precedence)
2. Regex patterns (applied to remaining variables)
3. Custom predicates (final filter)

### 2. Convenience Methods

#### `filter_by_names()` - Exact Name Matching
```python
# Include only specific variables
preprocessor.filter_by_names(
    input_names=["Temperature_C", "Pressure_Bar"],
    output_names=["Efficiency_Percent"],
    exclude=False
)

# Exclude specific variables
preprocessor.filter_by_names(
    input_names=["Voltage_V", "Current_A"],
    output_names=["HeatGenerated_W"],
    exclude=True
)
```

#### `filter_by_patterns()` - Regex Pattern Matching
```python
preprocessor.filter_by_patterns(
    input_patterns=[r".*_[CT]$", r".*Flow.*"],  # Variables ending with _C or _T, or containing "Flow"
    output_patterns=[r".*_W$", r".*Efficiency.*"] # Variables ending with _W or containing "Efficiency"
)
```

#### `filter_normalized_only()` - Variables with Normalization
```python
# Keep only variables that have normalization enabled
preprocessor.filter_normalized_only()
```

#### `filter_non_normalized_only()` - Variables without Normalization
```python
# Keep only variables that don't have normalization enabled
preprocessor.filter_non_normalized_only()
```

## Integration Features

### Enhanced Setup Function

The `setup_preprocessor_from_config()` function now supports filtering during setup:

```python
from data_preprocessor_integration import setup_preprocessor_from_config

preprocessor = setup_preprocessor_from_config(
    input_vars=all_input_vars,
    output_vars=all_output_vars,
    input_normalizations={"Temperature_C": "z_score"},
    output_normalizations={"Efficiency_Percent": "z_score"},
    # Filtering parameters
    exclude_inputs=["Voltage_V", "Current_A"],
    input_patterns=[r".*_[CPT].*"],
    include_outputs=["Efficiency_Percent", "PowerConsumption_W"]
)
```

### Creating Filtered Copies

Create filtered copies without modifying the original preprocessor:

```python
from data_preprocessor_integration import create_filtered_preprocessor

# Create a copy with only temperature and flow related variables
temp_flow_preprocessor = create_filtered_preprocessor(
    base_preprocessor,
    input_patterns=[r".*Temp.*", r".*Flow.*"],
    output_patterns=[r".*Flow.*"]
)
```

## Statistical Filtering

### Variable Statistics Analysis

Get statistical properties of variables from job data:

```python
from data_preprocessor_integration import get_variable_statistics

stats = get_variable_statistics(jobs, input_vars, "input")
# Returns: {"var_name": {"mean": ..., "std": ..., "cv": ..., "range": ...}}
```

### Filter by Statistical Properties

Filter variables based on their data characteristics:

```python
from data_preprocessor_integration import filter_variables_by_statistics

filtered_vars = filter_variables_by_statistics(
    jobs=jobs,
    input_vars=input_vars,
    output_vars=output_vars,
    min_cv=0.1,        # Minimum coefficient of variation
    max_cv=2.0,        # Maximum coefficient of variation
    min_range=1.0,     # Minimum range (max - min)
    require_complete_data=True  # Only variables with data in all jobs
)
```

## Usage Examples

### Example 1: Basic Filtering
```python
# Set up preprocessor with all variables
preprocessor = DataPreprocessor()
preprocessor.setup_variables(input_vars, output_vars)

# Filter to keep only core process variables
preprocessor.filter_by_names(
    input_names=["Temperature_C", "Pressure_Bar", "FlowRate_LperMin"],
    output_names=["Efficiency_Percent", "PowerConsumption_W"]
)

print(f"Filtered variables: {preprocessor.get_filtered_variable_names()}")
```

### Example 2: Pattern-Based Filtering
```python
# Keep electrical variables and power-related outputs
preprocessor.filter_by_patterns(
    input_patterns=[r".*_[VA]$", r".*Power.*"],  # Voltage, Amperage, Power
    output_patterns=[r".*_W$", r".*Power.*"]     # Watt measurements, Power outputs
)
```

### Example 3: Combined Filtering
```python
# Complex filtering with multiple criteria
preprocessor.filter_variables(
    exclude_inputs=["Voltage_V", "Current_A"],           # Remove electrical
    input_patterns=[r".*_[CPT].*"],                      # Keep C, P, T variables
    input_predicate=lambda name, config: len(name) <= 15, # Short names only
    include_outputs=["Efficiency_Percent", "PowerConsumption_W"]
)
```

### Example 4: Workflow Integration
```python
# Create preprocessor with filtering built into the setup
preprocessor = setup_preprocessor_from_config(
    input_vars=all_inputs,
    output_vars=all_outputs,
    input_normalizations={"Temperature_C": "z_score", "Pressure_Bar": "min_max"},
    # Apply filtering during setup
    input_patterns=[r".*_[CPF].*"],  # Temperature, Pressure, Flow variables
    exclude_outputs=["HeatGenerated_W"]  # Exclude heat generation
)

# Use in the workflow
training_file, fitted_preprocessor = create_training_file_with_preprocessor(
    jobs, filtered_inputs, filtered_outputs, preprocessor
)
```

## Key Features

### ✅ **Flexible Filtering Options**
- Exact name matching (include/exclude)
- Regex pattern matching
- Custom predicate functions
- Statistical property filtering

### ✅ **Preserves Configurations**
- All normalization settings are maintained
- Sign switching configurations preserved
- Variable mappings automatically updated

### ✅ **Method Chaining**
- All filtering methods return `self` for chaining
- Can apply multiple filters in sequence

### ✅ **Non-Destructive Operations**
- Original preprocessor can be preserved using `create_filtered_preprocessor()`
- Multiple filtered versions can be created from the same base

### ✅ **Automatic Remapping**
- Variable mappings (x1, x2, ..., y1, y2, ...) are automatically updated
- Sequential numbering is maintained after filtering

### ✅ **Integration Ready**
- Works seamlessly with existing workflow functions
- Enhanced setup function supports filtering parameters
- Compatible with all existing preprocessing features

## Utility Methods

### `get_filtered_variable_names()`
Returns the current variable names after filtering:
```python
names = preprocessor.get_filtered_variable_names()
# Returns: {"inputs": ["Temperature_C", ...], "outputs": ["Efficiency_Percent", ...]}
```

### `get_variable_mapping()`
Returns the mapping from original names to standardized names:
```python
mapping = preprocessor.get_variable_mapping()
# Returns: {"Temperature_C": "x1", "Pressure_Bar": "x2", "Efficiency_Percent": "y1"}
```

## Notes

- **Filter Order**: Include/exclude lists are processed first, then patterns, then predicates
- **Include Priority**: If both include and exclude lists are provided, include takes precedence
- **Pattern Syntax**: Uses Python's `re` module syntax for regex patterns
- **Predicate Function**: Receives `(variable_name, variable_config)` and returns boolean
- **Variable Remapping**: Filtered variables are automatically remapped to maintain x1, x2, ... y1, y2, ... sequence
- **Configuration Preservation**: All normalization and sign-switching settings are preserved during filtering

The filtering functionality provides a powerful and flexible way to work with subsets of variables while maintaining all the preprocessing capabilities of the `DataPreprocessor` class.
