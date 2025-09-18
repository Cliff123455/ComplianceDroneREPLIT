#!/usr/bin/env python3

import pandas as pd
import json

def parse_solar_data():
    """Parse the Excel file with proper headers and filter for solar projects"""
    try:
        # Read the Excel file with proper header row
        df = pd.read_excel("/home/ubuntu/upload/USSolarProjectsfor2025andbeyond.xlsx", header=1)
        
        print("=== SOLAR PROJECT DATA ANALYSIS ===")
        print(f"Total records: {len(df)}")
        print(f"Columns: {list(df.columns)}")
        
        # Filter for solar projects
        solar_keywords = ['Solar', 'Photovoltaic', 'PV']
        solar_df = df[df['Technology'].str.contains('|'.join(solar_keywords), case=False, na=False)]
        
        print(f"\n=== SOLAR PROJECTS FOUND ===")
        print(f"Solar projects: {len(solar_df)}")
        
        if len(solar_df) > 0:
            print("\n=== SOLAR PROJECT SAMPLE ===")
            print(solar_df[['Entity Name', 'Plant Name', 'Plant State', 'Technology', 
                           'Nameplate Capacity (MW)', 'Operating Year', 'Status', 
                           'Latitude', 'Longitude']].head(10))
            
            # Group by state
            print("\n=== SOLAR PROJECTS BY STATE ===")
            state_counts = solar_df['Plant State'].value_counts()
            print(state_counts.head(10))
            
            # Group by technology
            print("\n=== SOLAR TECHNOLOGIES ===")
            tech_counts = solar_df['Technology'].value_counts()
            print(tech_counts)
            
            # Save solar data
            solar_df.to_csv('/home/ubuntu/solar_projects_filtered.csv', index=False)
            
            # Create summary
            summary = {
                "total_projects": len(solar_df),
                "states": state_counts.to_dict(),
                "technologies": tech_counts.to_dict(),
                "capacity_stats": {
                    "total_mw": solar_df['Nameplate Capacity (MW)'].sum(),
                    "average_mw": solar_df['Nameplate Capacity (MW)'].mean(),
                    "max_mw": solar_df['Nameplate Capacity (MW)'].max(),
                    "min_mw": solar_df['Nameplate Capacity (MW)'].min()
                }
            }
            
            with open('/home/ubuntu/solar_summary.json', 'w') as f:
                json.dump(summary, f, indent=2, default=str)
                
            print(f"\n=== CAPACITY STATISTICS ===")
            print(f"Total capacity: {summary['capacity_stats']['total_mw']:.2f} MW")
            print(f"Average capacity: {summary['capacity_stats']['average_mw']:.2f} MW")
            print(f"Max capacity: {summary['capacity_stats']['max_mw']:.2f} MW")
            print(f"Min capacity: {summary['capacity_stats']['min_mw']:.2f} MW")
        
        # Also check for future projects (2025 and beyond)
        future_df = df[df['Operating Year'] >= 2025]
        print(f"\n=== FUTURE PROJECTS (2025+) ===")
        print(f"Total future projects: {len(future_df)}")
        
        future_solar = future_df[future_df['Technology'].str.contains('|'.join(solar_keywords), case=False, na=False)]
        print(f"Future solar projects: {len(future_solar)}")
        
        if len(future_solar) > 0:
            future_solar.to_csv('/home/ubuntu/future_solar_projects.csv', index=False)
            print("Future solar projects saved to: future_solar_projects.csv")
        
        print("\n=== FILES CREATED ===")
        print("- solar_projects_filtered.csv: All solar projects")
        print("- future_solar_projects.csv: Solar projects 2025+")
        print("- solar_summary.json: Summary statistics")
        
    except Exception as e:
        print(f"Error parsing solar data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    parse_solar_data()

