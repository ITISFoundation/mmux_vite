"""
Test script for variable filtering functionality in DataPreprocessor.

This script demonstrates all the filtering capabilities:
1. Basic filtering by exact names (include/exclude)
2. Pattern-based filtering using regex
3. Custom predicate filtering
4. Statistical filtering
5. Convenience methods
6. Integration with the workflow
"""

import numpy as np
import pandas as pd
from pathlib import Path
import logging
from .data_preprocessor import DataPreprocessor
from .data_preprocessor_integration import (
    setup_preprocessor_from_config,
    create_filtered_preprocessor,
    get_variable_statistics,
    filter_variables_by_statistics
)

# Set up logging
logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)


def create_sample_data():
    """Create sample data for testing filtering functionality."""
    np.random.seed(42)
    
    jobs = []
    for i in range(50):
        # Input variables with different characteristics
        temperature_c = np.random.uniform(20, 100)
        pressure_bar = np.random.uniform(1, 10)
        flow_rate_lpm = np.random.uniform(0.1, 2.0)
        humidity_percent = np.random.uniform(30, 80)
        rpm_motor = np.random.uniform(1000, 3000)
        voltage_v = np.random.uniform(220, 240)
        current_a = np.random.uniform(5, 15)
        
        # Derived/calculated inputs
        power_w = voltage_v * current_a + np.random.normal(0, 10)
        flow_pressure_ratio = flow_rate_lpm / pressure_bar
        temp_humidity_index = temperature_c * humidity_percent / 100
        
        # Output variables
        efficiency_percent = (0.7 + 0.2 * (temperature_c - 60) / 40 + 
                             0.1 * (pressure_bar - 5) / 5 + np.random.normal(0, 0.05)) * 100
        power_consumption_w = (100 + 2 * temperature_c + 5 * pressure_bar + 
                              0.5 * rpm_motor / 100 + np.random.normal(0, 20))
        output_flow_lpm = flow_rate_lpm * (0.8 + 0.1 * np.random.normal())
        heat_generated_w = power_consumption_w * 0.3 + np.random.normal(0, 10)
        
        job = {
            "status": "completed",
            "inputs": {
                "Temperature_C": temperature_c,
                "Pressure_Bar": pressure_bar,
                "FlowRate_LperMin": flow_rate_lpm,
                "Humidity_Percent": humidity_percent,
                "RPM_Motor": rpm_motor,
                "Voltage_V": voltage_v,
                "Current_A": current_a,
                "Power_W": power_w,
                "FlowPressureRatio": flow_pressure_ratio,
                "TempHumidityIndex": temp_humidity_index,
            },
            "outputs": {
                "Efficiency_Percent": efficiency_percent,
                "PowerConsumption_W": power_consumption_w,
                "OutputFlow_LperMin": output_flow_lpm,
                "HeatGenerated_W": heat_generated_w,
            }
        }
        jobs.append(job)
    
    return jobs


def test_basic_filtering():
    """Test basic filtering by exact names."""
    print("\n" + "="*60)
    print("TEST 1: Basic Filtering by Exact Names")
    print("="*60)
    
    jobs = create_sample_data()
    input_vars = list(jobs[0]["inputs"].keys())
    output_vars = list(jobs[0]["outputs"].keys())
    
    print(f"Original variables:")
    print(f"  Inputs ({len(input_vars)}): {input_vars}")
    print(f"  Outputs ({len(output_vars)}): {output_vars}")
    
    # Create preprocessor
    preprocessor = DataPreprocessor()
    preprocessor.setup_variables(input_vars, output_vars)
    
    # Test include filtering
    selected_inputs = ["Temperature_C", "Pressure_Bar", "FlowRate_LperMin"]
    selected_outputs = ["Efficiency_Percent", "PowerConsumption_W"]
    
    filtered_preprocessor = DataPreprocessor()
    filtered_preprocessor.setup_variables(input_vars, output_vars)
    filtered_preprocessor.filter_by_names(
        input_names=selected_inputs,
        output_names=selected_outputs,
        exclude=False
    )
    
    filtered_vars = filtered_preprocessor.get_filtered_variable_names()
    print(f"\nAfter include filtering:")
    print(f"  Inputs ({len(filtered_vars['inputs'])}): {filtered_vars['inputs']}")
    print(f"  Outputs ({len(filtered_vars['outputs'])}): {filtered_vars['outputs']}")
    
    # Test exclude filtering
    exclude_inputs = ["Voltage_V", "Current_A", "Power_W"]
    exclude_outputs = ["HeatGenerated_W"]
    
    filtered_preprocessor2 = DataPreprocessor()
    filtered_preprocessor2.setup_variables(input_vars, output_vars)
    filtered_preprocessor2.filter_by_names(
        input_names=exclude_inputs,
        output_names=exclude_outputs,
        exclude=True
    )
    
    filtered_vars2 = filtered_preprocessor2.get_filtered_variable_names()
    print(f"\nAfter exclude filtering:")
    print(f"  Inputs ({len(filtered_vars2['inputs'])}): {filtered_vars2['inputs']}")
    print(f"  Outputs ({len(filtered_vars2['outputs'])}): {filtered_vars2['outputs']}")


def test_pattern_filtering():
    """Test pattern-based filtering using regex."""
    print("\n" + "="*60)
    print("TEST 2: Pattern-based Filtering")
    print("="*60)
    
    jobs = create_sample_data()
    input_vars = list(jobs[0]["inputs"].keys())
    output_vars = list(jobs[0]["outputs"].keys())
    
    print(f"Original variables:")
    print(f"  Inputs: {input_vars}")
    print(f"  Outputs: {output_vars}")
    
    # Create preprocessor
    preprocessor = DataPreprocessor()
    preprocessor.setup_variables(input_vars, output_vars)
    
    # Filter by patterns
    input_patterns = [r".*_[CV]$", r"Flow.*", r".*Ratio"]  # Variables ending with _C or _V, containing Flow, or ending with Ratio
    output_patterns = [r".*_W$"]  # Variables ending with _W
    
    preprocessor.filter_by_patterns(
        input_patterns=input_patterns,
        output_patterns=output_patterns
    )
    
    filtered_vars = preprocessor.get_filtered_variable_names()
    print(f"\nAfter pattern filtering:")
    print(f"  Input patterns: {input_patterns}")
    print(f"  Output patterns: {output_patterns}")
    print(f"  Filtered inputs ({len(filtered_vars['inputs'])}): {filtered_vars['inputs']}")
    print(f"  Filtered outputs ({len(filtered_vars['outputs'])}): {filtered_vars['outputs']}")


def test_predicate_filtering():
    """Test custom predicate filtering."""
    print("\n" + "="*60)
    print("TEST 3: Custom Predicate Filtering")
    print("="*60)
    
    jobs = create_sample_data()
    input_vars = list(jobs[0]["inputs"].keys())
    output_vars = list(jobs[0]["outputs"].keys())
    
    # Create preprocessor with normalization
    preprocessor = DataPreprocessor()
    preprocessor.setup_variables(input_vars, output_vars)
    
    # Set up some variables for normalization
    input_normalizations = {
        "Temperature_C": "z_score",
        "Pressure_Bar": "min_max",
        "FlowRate_LperMin": "z_score"
    }
    output_normalizations = {
        "Efficiency_Percent": "z_score",
        "PowerConsumption_W": "z_score"
    }
    
    preprocessor.setup_normalization(input_normalizations, output_normalizations)
    
    print(f"Variables with normalization:")
    print(f"  Input normalizations: {input_normalizations}")
    print(f"  Output normalizations: {output_normalizations}")
    
    # Filter to keep only normalized variables
    preprocessor.filter_normalized_only()
    
    filtered_vars = preprocessor.get_filtered_variable_names()
    print(f"\nAfter filtering for normalized variables only:")
    print(f"  Inputs ({len(filtered_vars['inputs'])}): {filtered_vars['inputs']}")
    print(f"  Outputs ({len(filtered_vars['outputs'])}): {filtered_vars['outputs']}")
    
    # Test custom predicate - keep variables with names longer than 10 characters
    preprocessor2 = DataPreprocessor()
    preprocessor2.setup_variables(input_vars, output_vars)
    
    def long_name_predicate(name, config):
        return len(name) > 10
    
    preprocessor2.filter_variables(
        input_predicate=long_name_predicate,
        output_predicate=long_name_predicate
    )
    
    filtered_vars2 = preprocessor2.get_filtered_variable_names()
    print(f"\nAfter filtering for long names (>10 chars):")
    print(f"  Inputs ({len(filtered_vars2['inputs'])}): {filtered_vars2['inputs']}")
    print(f"  Outputs ({len(filtered_vars2['outputs'])}): {filtered_vars2['outputs']}")


def test_statistical_filtering():
    """Test statistical filtering based on data characteristics."""
    print("\n" + "="*60)
    print("TEST 4: Statistical Filtering")
    print("="*60)
    
    jobs = create_sample_data()
    input_vars = list(jobs[0]["inputs"].keys())
    output_vars = list(jobs[0]["outputs"].keys())
    
    # Get statistics for all variables
    input_stats = get_variable_statistics(jobs, input_vars, "input")
    output_stats = get_variable_statistics(jobs, output_vars, "output")
    
    print("Variable statistics:")
    print("\nInput variables:")
    for name, stats in input_stats.items():
        print(f"  {name:20s}: CV={stats['cv']:.3f}, Range={stats['range']:.2f}")
    
    print("\nOutput variables:")
    for name, stats in output_stats.items():
        print(f"  {name:20s}: CV={stats['cv']:.3f}, Range={stats['range']:.2f}")
    
    # Filter variables with high variability (CV > 0.1) and reasonable range
    filtered_vars = filter_variables_by_statistics(
        jobs=jobs,
        input_vars=input_vars,
        output_vars=output_vars,
        min_cv=0.1,
        min_range=1.0,
        require_complete_data=True
    )
    
    print(f"\nAfter statistical filtering (CV > 0.1, Range > 1.0):")
    print(f"  Inputs ({len(filtered_vars['inputs'])}): {filtered_vars['inputs']}")
    print(f"  Outputs ({len(filtered_vars['outputs'])}): {filtered_vars['outputs']}")


def test_combined_filtering():
    """Test combining multiple filtering criteria."""
    print("\n" + "="*60)
    print("TEST 5: Combined Filtering")
    print("="*60)
    
    jobs = create_sample_data()
    input_vars = list(jobs[0]["inputs"].keys())
    output_vars = list(jobs[0]["outputs"].keys())
    
    print(f"Original variables:")
    print(f"  Inputs ({len(input_vars)}): {input_vars}")
    print(f"  Outputs ({len(output_vars)}): {output_vars}")
    
    # Create preprocessor with comprehensive filtering
    preprocessor = setup_preprocessor_from_config(
        input_vars=input_vars,
        output_vars=output_vars,
        input_normalizations={
            "Temperature_C": "z_score",
            "Pressure_Bar": "min_max",
            "FlowRate_LperMin": "z_score",
            "RPM_Motor": "z_score"
        },
        output_normalizations={
            "Efficiency_Percent": "z_score",
            "PowerConsumption_W": "z_score"
        },
        # Apply filtering during setup
        exclude_inputs=["Voltage_V", "Current_A"],  # Exclude electrical variables
        input_patterns=[r".*_[CPR].*"],  # Include variables with _C, _P, or _R
        output_patterns=[r".*_.*"]  # Include all outputs with underscores
    )
    
    filtered_vars = preprocessor.get_filtered_variable_names()
    print(f"\nAfter combined filtering:")
    print(f"  Inputs ({len(filtered_vars['inputs'])}): {filtered_vars['inputs']}")
    print(f"  Outputs ({len(filtered_vars['outputs'])}): {filtered_vars['outputs']}")
    
    # Test the preprocessor with actual data
    df_jobs = pd.DataFrame([
        {**job["inputs"], **job["outputs"]} for job in jobs[:10]
    ])
    
    print(f"\nTesting with sample data ({df_jobs.shape[0]} samples):")
    print(f"Original columns: {list(df_jobs.columns)}")
    
    df_transformed = preprocessor.fit_transform(df_jobs)
    print(f"Transformed columns: {list(df_transformed.columns)}")
    print(f"Transformed shape: {df_transformed.shape}")
    
    # Show variable mapping
    mapping = preprocessor.get_variable_mapping()
    print(f"\nVariable mapping:")
    for orig, mapped in mapping.items():
        print(f"  {orig} -> {mapped}")


def test_copy_and_filter():
    """Test creating filtered copies of preprocessors."""
    print("\n" + "="*60)
    print("TEST 6: Copy and Filter")
    print("="*60)
    
    jobs = create_sample_data()
    input_vars = list(jobs[0]["inputs"].keys())
    output_vars = list(jobs[0]["outputs"].keys())
    
    # Create base preprocessor
    base_preprocessor = setup_preprocessor_from_config(
        input_vars=input_vars,
        output_vars=output_vars,
        input_normalizations={
            "Temperature_C": "z_score",
            "Pressure_Bar": "min_max",
            "FlowRate_LperMin": "z_score",
            "Humidity_Percent": "z_score",
            "RPM_Motor": "z_score"
        },
        output_normalizations={
            "Efficiency_Percent": "z_score",
            "PowerConsumption_W": "z_score",
            "OutputFlow_LperMin": "min_max"
        }
    )
    
    base_vars = base_preprocessor.get_filtered_variable_names()
    print(f"Base preprocessor variables:")
    print(f"  Inputs ({len(base_vars['inputs'])}): {base_vars['inputs']}")
    print(f"  Outputs ({len(base_vars['outputs'])}): {base_vars['outputs']}")
    
    # Create filtered copy 1: Only temperature and flow related
    temp_flow_preprocessor = create_filtered_preprocessor(
        base_preprocessor,
        input_patterns=[r".*Temp.*", r".*Flow.*"],
        output_patterns=[r".*Flow.*"]
    )
    
    temp_flow_vars = temp_flow_preprocessor.get_filtered_variable_names()
    print(f"\nTemperature/Flow filtered copy:")
    print(f"  Inputs ({len(temp_flow_vars['inputs'])}): {temp_flow_vars['inputs']}")
    print(f"  Outputs ({len(temp_flow_vars['outputs'])}): {temp_flow_vars['outputs']}")
    
    # Create filtered copy 2: Only efficiency and power related
    efficiency_power_preprocessor = create_filtered_preprocessor(
        base_preprocessor,
        include_inputs=["Temperature_C", "Pressure_Bar", "RPM_Motor"],
        include_outputs=["Efficiency_Percent", "PowerConsumption_W"]
    )
    
    efficiency_power_vars = efficiency_power_preprocessor.get_filtered_variable_names()
    print(f"\nEfficiency/Power filtered copy:")
    print(f"  Inputs ({len(efficiency_power_vars['inputs'])}): {efficiency_power_vars['inputs']}")
    print(f"  Outputs ({len(efficiency_power_vars['outputs'])}): {efficiency_power_vars['outputs']}")
    
    # Verify base preprocessor is unchanged
    base_vars_after = base_preprocessor.get_filtered_variable_names()
    print(f"\nBase preprocessor after filtering (should be unchanged):")
    print(f"  Inputs ({len(base_vars_after['inputs'])}): {base_vars_after['inputs']}")
    print(f"  Outputs ({len(base_vars_after['outputs'])}): {base_vars_after['outputs']}")


def main():
    """Run all filtering tests."""
    print("DataPreprocessor Variable Filtering Tests")
    print("=" * 60)
    
    test_basic_filtering()
    test_pattern_filtering()
    test_predicate_filtering()
    test_statistical_filtering()
    test_combined_filtering()
    test_copy_and_filter()
    
    print("\n" + "="*60)
    print("All filtering tests completed successfully!")
    print("="*60)


if __name__ == "__main__":
    main()
