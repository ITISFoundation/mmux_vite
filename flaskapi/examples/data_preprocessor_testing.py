"""
Example usage of the DataPreprocessor class.

This script demonstrates how to use the DataPreprocessor class for:
1. Variable mapping to standardized names (x1, x2, ... and y1, y2, ...)
2. Data normalization and denormalization
3. Sign switching and restoration
4. Configuration persistence
5. Integration with existing ML workflow
"""

import numpy as np
import pandas as pd
from pathlib import Path
from mmux_flaskapi.data_preprocessor import DataPreprocessor
from mmux_flaskapi.data_preprocessor.data_preprocessor_integration import (
    create_training_file_with_preprocessor,
    setup_preprocessor_from_config,
    load_and_inverse_transform_results
)
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)


def create_sample_jobs():
    """Create sample job data for demonstration."""
    np.random.seed(42)  # For reproducible results
    
    jobs = []
    for i in range(20):
        # Sample input variables
        temperature = np.random.uniform(20, 100)
        pressure = np.random.uniform(1, 10)
        flow_rate = np.random.uniform(0.1, 2.0)
        
        # Sample output variables (with some relationships to inputs)
        efficiency = 0.8 + 0.15 * (temperature - 60) / 40 + 0.1 * np.random.normal()
        power_consumption = 100 + 2 * temperature + 5 * pressure + np.random.normal() * 10
        
        job = {
            "status": "completed",
            "inputs": {
                "Temperature_C": temperature,
                "Pressure_Bar": pressure,
                "FlowRate_LperMin": flow_rate,
                "FlowRate+Pressure": flow_rate + pressure,
                "FlowRate-Pressure": flow_rate - pressure,
                "FlowRate*Pressure": flow_rate * pressure,
                "FlowRate/Pressure": flow_rate / pressure
            },
            "outputs": {
                "Efficiency_Percent": efficiency,
                "PowerConsumption_W": power_consumption
            }
        }
        jobs.append(job)
    
    return jobs


def example_basic_usage():
    """Demonstrate basic usage of DataPreprocessor."""
    print("\n" + "="*60)
    print("EXAMPLE 1: Basic DataPreprocessor Usage")
    print("="*60)
    
    # Create sample data
    jobs = create_sample_jobs()
    
    # Define variables
    input_vars = ["Temperature_C", "Pressure_Bar", "FlowRate_LperMin"]
    output_vars = ["Efficiency_Percent", "PowerConsumption_W"]
    
    # Set up preprocessor using new separated workflow
    preprocessor = DataPreprocessor()
    
    # Step 1: Set up basic variable mappings
    preprocessor.setup_variables(
        input_vars=input_vars,
        output_vars=output_vars
    )
    
    # Step 2: Configure normalization
    preprocessor.setup_normalization(
        input_normalizations={"Temperature_C": "z_score", "Pressure_Bar": "min_max"},
        output_normalizations={"PowerConsumption_W": "z_score"}
    )
    
    # Step 3: Configure sign switching
    preprocessor.setup_sign_switching(
        input_sign_switches=["FlowRate_LperMin"],  # Example: minimize flow rate
        output_sign_switches=["Efficiency_Percent"]  # Example: maximize efficiency (minimize negative)
    )
    
    print("Variable mapping:")
    mapping = preprocessor.get_variable_mapping()
    for orig, mapped in mapping.items():
        print(f"  {orig} -> {mapped}")
    
    # Convert jobs to DataFrame
    data_list = []
    for job in jobs:
        row = {}
        row.update(job["inputs"])
        row.update(job["outputs"])
        data_list.append(row)
    
    df = pd.DataFrame(data_list)
    print(f"\nOriginal data shape: {df.shape}")
    print("Original data sample:")
    print(df.head(3))
    
    # Fit and transform
    df_transformed = preprocessor.fit_transform(df)
    print(f"\nTransformed data shape: {df_transformed.shape}")
    print("Transformed data sample:")
    print(df_transformed.head(3))
    
    # Demonstrate inverse transformation
    sample_transformed = df_transformed.iloc[0].to_dict()
    sample_original = preprocessor.inverse_transform(sample_transformed)
    
    print("\nInverse transformation example:")
    print("Transformed values:", sample_transformed)
    print("Original values:", sample_original)
    
    # Compare with original
    original_sample = df.iloc[0].to_dict()
    print("Actual original:", original_sample)
    
    # Check if inverse transformation is accurate
    print("\nInverse transformation accuracy:")
    for var in input_vars + output_vars:
        if var in sample_original and var in original_sample:
            diff = abs(sample_original[var] - original_sample[var])
            print(f"  {var}: difference = {diff:.6f}")


def example_with_config_persistence():
    """Demonstrate configuration saving and loading."""
    print("\n" + "="*60)
    print("EXAMPLE 2: Configuration Persistence")
    print("="*60)
    
    # Create and configure preprocessor
    jobs = create_sample_jobs()
    input_vars = ["Temperature_C", "Pressure_Bar", "FlowRate_LperMin"]
    output_vars = ["Efficiency_Percent", "PowerConsumption_W"]
    
    preprocessor = setup_preprocessor_from_config(
        input_vars=input_vars,
        output_response=output_vars,
        input_normalizations={"Temperature_C": "z_score", "Pressure_Bar": "min_max"},
        output_normalizations={"PowerConsumption_W": "z_score"},
        input_sign_switches=["FlowRate_LperMin"],
        output_sign_switches=["Efficiency_Percent"]
    )
    
    # Fit to data
    data_list = []
    for job in jobs:
        row = {}
        row.update(job["inputs"])
        row.update(job["outputs"])
        data_list.append(row)
    
    df = pd.DataFrame(data_list)
    preprocessor.fit(df)
    
    # Save configuration
    config_file = Path("preprocessor_config_example.json")
    preprocessor.save_config(config_file)
    print(f"Configuration saved to: {config_file}")
    
    # Load configuration in a new preprocessor
    new_preprocessor = DataPreprocessor()
    new_preprocessor.load_config(config_file)
    
    # Test that both preprocessors give same results
    df_transformed_1 = preprocessor.transform(df)
    df_transformed_2 = new_preprocessor.transform(df)
    
    print("Configuration persistence test:")
    if df_transformed_1.equals(df_transformed_2):
        print("  ✓ Loaded preprocessor produces identical results")
    else:
        print("  ✗ Loaded preprocessor produces different results")
    
    # Show summary
    summary = new_preprocessor.get_summary()
    print("\nPreprocessor summary:")
    print(f"  Fitted: {summary['fitted']}")
    print(f"  Input variables: {summary['n_input_variables']}")
    print(f"  Output variables: {summary['n_output_variables']}")
    
    # Clean up
    if config_file.exists():
        config_file.unlink()


def example_integration_with_training_workflow():
    """Demonstrate integration with existing training workflow."""
    print("\n" + "="*60)
    print("EXAMPLE 3: Integration with Training Workflow")
    print("="*60)
    
    # Create sample jobs
    jobs = create_sample_jobs()
    input_vars = ["Temperature_C", "Pressure_Bar", "FlowRate_LperMin"]
    output_vars = ["Efficiency_Percent", "PowerConsumption_W"]
    
    # Set up preprocessor
    preprocessor = setup_preprocessor_from_config(
        input_vars=input_vars,
        output_response=output_vars,
        input_normalizations={"Temperature_C": "z_score", "Pressure_Bar": "min_max"},
        output_normalizations={"PowerConsumption_W": "z_score"},
        input_sign_switches=["FlowRate_LperMin"],
        output_sign_switches=["Efficiency_Percent"]
    )
    
    # Create training file with preprocessing
    try:
        training_file, fitted_preprocessor = create_training_file_with_preprocessor(
            jobs=jobs,
            input_vars=input_vars,
            output_response=output_vars,
            preprocessor=preprocessor,
            folder_name="example_run"
        )
        
        print(f"Training file created: {training_file}")
        
        # Load and display the training data
        df_training = pd.read_csv(training_file)
        print(f"Training data shape: {df_training.shape}")
        print("Training data columns:", list(df_training.columns))
        print("Training data sample:")
        print(df_training.head(3))
        
        # Simulate algorithm results (in transformed space)
        simulated_results = {
            "x1": 0.5,  # Normalized Temperature_C
            "x2": 0.3,  # Normalized Pressure_Bar  
            "x3": -0.2, # Sign-switched FlowRate_LperMin
            "y1": -0.1, # Sign-switched Efficiency_Percent
            "y2": 1.2   # Normalized PowerConsumption_W
        }
        
        print("\nSimulated algorithm results (transformed):")
        print(simulated_results)
        
        # Inverse transform results
        config_file = training_file.parent / "preprocessor_config.json"
        original_results = load_and_inverse_transform_results(
            results=simulated_results,
            config_file_path=config_file
        )
        
        print("Results in original scale:")
        print(original_results)
        
        # Clean up example files
        import shutil
        run_dir = training_file.parent
        if run_dir.exists() and "example_run" in str(run_dir):
            shutil.rmtree(run_dir)
            print(f"Cleaned up example directory: {run_dir}")
            
    except ImportError as e:
        print(f"Skipping integration example due to missing dependency: {e}")
        print("This would work in the full environment with mmux_python.utils.funs_evaluate")


def example_separated_workflow():
    """Demonstrate the new separated workflow for sign switching and normalization."""
    print("\n" + "="*60)
    print("EXAMPLE 4: Separated Workflow Demonstration")
    print("="*60)
    
    # Create sample data
    jobs = create_sample_jobs()
    input_vars = ["Temperature_C", "Pressure_Bar", "FlowRate_LperMin"]
    output_vars = ["Efficiency_Percent", "PowerConsumption_W"]
    
    # Convert jobs to DataFrame
    data_list = []
    for job in jobs:
        row = {}
        row.update(job["inputs"])
        row.update(job["outputs"])
        data_list.append(row)
    
    df = pd.DataFrame(data_list)
    
    # Demonstrate flexible workflow
    print("Demonstrating flexible separated workflow:")
    
    # Scenario 1: Only variable mapping
    print("\n1. Only variable mapping (no transformations):")
    preprocessor1 = DataPreprocessor()
    preprocessor1.setup_variables(input_vars=input_vars, output_vars=output_vars)
    df_mapped = preprocessor1.fit_transform(df)
    print(f"   Mapped columns: {list(df_mapped.columns)}")
    print(f"   Temperature_C range: {df['Temperature_C'].min():.2f} to {df['Temperature_C'].max():.2f}")
    print(f"   x1 range: {df_mapped['x1'].min():.2f} to {df_mapped['x1'].max():.2f} (same values)")
    
    # Scenario 2: Only normalization
    print("\n2. Variable mapping + normalization only:")
    preprocessor2 = DataPreprocessor()
    preprocessor2.setup_variables(input_vars=input_vars, output_vars=output_vars)
    preprocessor2.setup_normalization(
        input_normalizations={"Temperature_C": "z_score"},
        output_normalizations={"PowerConsumption_W": "min_max"}
    )
    df_normalized = preprocessor2.fit_transform(df)
    print(f"   x1 (Temperature_C z_score) range: {df_normalized['x1'].min():.2f} to {df_normalized['x1'].max():.2f}")
    print(f"   y2 (PowerConsumption_W min_max) range: {df_normalized['y2'].min():.2f} to {df_normalized['y2'].max():.2f}")
    
    # Scenario 3: Only sign switching
    print("\n3. Variable mapping + sign switching only:")
    preprocessor3 = DataPreprocessor()
    preprocessor3.setup_variables(input_vars=input_vars, output_vars=output_vars)
    preprocessor3.setup_sign_switching(
        input_sign_switches=["FlowRate_LperMin"],
        output_sign_switches=["Efficiency_Percent"]
    )
    df_switched = preprocessor3.fit_transform(df)
    print(f"   FlowRate_LperMin range: {df['FlowRate_LperMin'].min():.2f} to {df['FlowRate_LperMin'].max():.2f}")
    print(f"   x3 (switched) range: {df_switched['x3'].min():.2f} to {df_switched['x3'].max():.2f}")
    print(f"   Efficiency_Percent range: {df['Efficiency_Percent'].min():.2f} to {df['Efficiency_Percent'].max():.2f}")
    print(f"   y1 (switched) range: {df_switched['y1'].min():.2f} to {df_switched['y1'].max():.2f}")
    
    # Scenario 4: Both normalization and sign switching
    print("\n4. Variable mapping + normalization + sign switching:")
    preprocessor4 = DataPreprocessor()
    preprocessor4.setup_variables(input_vars=input_vars, output_vars=output_vars)
    preprocessor4.setup_normalization(
        input_normalizations={"Temperature_C": "z_score"},
        output_normalizations={"PowerConsumption_W": "min_max"}
    )
    preprocessor4.setup_sign_switching(
        input_sign_switches=["FlowRate_LperMin"],
        output_sign_switches=["Efficiency_Percent"]
    )
    df_both = preprocessor4.fit_transform(df)
    print(f"   x1 (Temperature_C z_score): {df_both['x1'].mean():.3f} ± {df_both['x1'].std():.3f}")
    print(f"   x3 (FlowRate sign-switched): {df_both['x3'].min():.2f} to {df_both['x3'].max():.2f}")
    print(f"   y1 (Efficiency sign-switched): {df_both['y1'].min():.2f} to {df_both['y1'].max():.2f}")
    print(f"   y2 (PowerConsumption min_max): {df_both['y2'].min():.2f} to {df_both['y2'].max():.2f}")
    
    # Demonstrate that order doesn't matter
    print("\n5. Order independence test:")
    preprocessor5a = DataPreprocessor()
    preprocessor5a.setup_variables(input_vars=input_vars, output_vars=output_vars)
    preprocessor5a.setup_normalization(input_normalizations={"Temperature_C": "z_score"})
    preprocessor5a.setup_sign_switching(input_sign_switches=["Temperature_C"])
    
    preprocessor5b = DataPreprocessor()
    preprocessor5b.setup_variables(input_vars=input_vars, output_vars=output_vars)
    preprocessor5b.setup_sign_switching(input_sign_switches=["Temperature_C"])  # Different order
    preprocessor5b.setup_normalization(input_normalizations={"Temperature_C": "z_score"})
    
    df_a = preprocessor5a.fit_transform(df)
    df_b = preprocessor5b.fit_transform(df)
    
    if np.allclose(df_a['x1'].values, df_b['x1'].values): # type: ignore
        print("   ✓ Order of setup_normalization and setup_sign_switching doesn't matter")
    else:
        print("   ✗ Order matters (unexpected)")


def example_advanced_features():
    """Demonstrate advanced features."""
    print("\n" + "="*60)
    print("EXAMPLE 5: Advanced Features")
    print("="*60)
    
    # Create sample data with different characteristics
    np.random.seed(42)
    
    # Data with different scales and distributions
    data = {
        "small_var": np.random.uniform(0.01, 0.1, 15),      # Small scale
        "large_var": np.random.uniform(1000, 10000, 15),    # Large scale  
        "normal_var": np.random.normal(50, 10, 15),         # Normal distribution
        "skewed_var": np.random.exponential(2, 15),         # Skewed distribution
        "output_to_maximize": np.random.uniform(0.7, 0.95, 15),  # Efficiency to maximize
        "output_to_minimize": np.random.uniform(10, 50, 15)      # Cost to minimize
    }
    
    df = pd.DataFrame(data)
    
    input_vars = ["small_var", "large_var", "normal_var", "skewed_var"]
    output_vars = ["output_to_maximize", "output_to_minimize"]
    
    # Set up preprocessor with different normalization methods using new workflow
    preprocessor = DataPreprocessor()
    preprocessor.setup_variables(
        input_vars=input_vars,
        output_vars=output_vars
    )
    preprocessor.setup_normalization(
        input_normalizations={
            "small_var": "min_max",
            "large_var": "z_score", 
            "normal_var": "z_score",
            "skewed_var": "min_max"
        },
        output_normalizations={
            "output_to_maximize": "min_max",
            "output_to_minimize": "z_score"
        }
    )
    preprocessor.setup_sign_switching(
        output_sign_switches=["output_to_maximize"]  # Switch sign to minimize negative efficiency
    )
    
    print("Original data statistics:")
    print(df.describe())
    
    # Fit and transform
    df_transformed = preprocessor.fit_transform(df)
    
    print("\nTransformed data statistics:")
    print(df_transformed.describe())
    
    # Show the effect of different normalizations
    print("\nNormalization effects:")
    for var in input_vars:
        config = preprocessor.input_variables[var]
        original_range = df[var].max() - df[var].min()
        transformed_range = df_transformed[config.mapped_name].max() - df_transformed[config.mapped_name].min()
        print(f"  {var} ({config.normalization_method}): {original_range:.3f} -> {transformed_range:.3f}")
    
    # Test edge cases
    print("\nTesting edge cases:")
    
    # Test with constant variable (should handle gracefully)
    df_edge = df.copy()
    df_edge["constant_var"] = 5.0  # Constant value
    
    preprocessor_edge = DataPreprocessor()
    preprocessor_edge.setup_variables(
        input_vars=["constant_var"],
        output_vars=["output_to_maximize"]
    )
    preprocessor_edge.setup_normalization(
        input_normalizations={"constant_var": "z_score"}
    )
    
    try:
        input_data : pd.DataFrame = df_edge[["constant_var", "output_to_maximize"]] # type: ignore
        df_edge_transformed = preprocessor_edge.fit_transform(input_data)
        print("  ✓ Handled constant variable gracefully")
    except Exception as e:
        print(f"  ✗ Error with constant variable: {e}")


if __name__ == "__main__":
    print("DataPreprocessor Class Examples")
    print("="*60)
    
    # Run examples
    example_basic_usage()
    example_with_config_persistence()
    example_integration_with_training_workflow()
    example_separated_workflow()
    example_advanced_features()
    
    print("\n" + "="*60)
    print("All examples completed!")
    print("="*60)
