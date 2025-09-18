#!/usr/bin/env python3

import pandas as pd
import json

def analyze_excel_file(file_path):
    """Analyze the Excel file and extract key information"""
    try:
        # Read the Excel file
        df = pd.read_excel(file_path)
        
        print("=== EXCEL FILE ANALYSIS ===")
        print(f"File: {file_path}")
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        print("\n=== FIRST 5 ROWS ===")
        print(df.head())
        
        print("\n=== DATA TYPES ===")
        print(df.dtypes)
        
        print("\n=== SUMMARY STATISTICS ===")
        print(df.describe())
        
        print("\n=== NULL VALUES ===")
        print(df.isnull().sum())
        
        # Save detailed analysis to JSON
        analysis = {
            "shape": df.shape,
            "columns": list(df.columns),
            "dtypes": df.dtypes.to_dict(),
            "null_counts": df.isnull().sum().to_dict(),
            "sample_data": df.head(10).to_dict('records')
        }
        
        with open('/home/ubuntu/excel_analysis.json', 'w') as f:
            json.dump(analysis, f, indent=2, default=str)
        
        # Save full data as CSV for easier processing
        df.to_csv('/home/ubuntu/solar_projects_data.csv', index=False)
        
        print(f"\n=== ANALYSIS COMPLETE ===")
        print("Detailed analysis saved to: excel_analysis.json")
        print("Full data saved to: solar_projects_data.csv")
        
    except Exception as e:
        print(f"Error analyzing Excel file: {e}")

if __name__ == "__main__":
    analyze_excel_file("/home/ubuntu/upload/USSolarProjectsfor2025andbeyond.xlsx")

