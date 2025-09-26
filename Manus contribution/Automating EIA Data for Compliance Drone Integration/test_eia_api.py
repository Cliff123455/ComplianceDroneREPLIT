#!/usr/bin/env python3

import requests
import json

def test_eia_api():
    """Test the EIA API key with a simple request"""
    api_key = "GyugVRs959vfohm52ctv60qhTNKEzTAjWLhLGxlq"
    
    # Test basic API connectivity
    base_url = "https://api.eia.gov/v2"
    
    # Test 1: Get electricity data
    print("=== Testing EIA API Connectivity ===")
    test_url = f"{base_url}/electricity/retail-sales/data?api_key={api_key}&frequency=annual&data[0]=sales&facets[stateid][]=CA&start=2022&end=2023"
    
    try:
        response = requests.get(test_url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API Key is working!")
            print(f"Response keys: {list(data.keys())}")
            
            if 'response' in data and 'data' in data['response']:
                print(f"Data points returned: {len(data['response']['data'])}")
                print("Sample data:")
                for item in data['response']['data'][:3]:
                    print(f"  {item}")
            
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    # Test 2: Get plant level data
    print("\n=== Testing Plant Level Data ===")
    plant_url = f"{base_url}/electricity/facility-fuel/data?api_key={api_key}&frequency=annual&data[0]=generation&facets[fueltypeid][]=SUN&start=2022&end=2023"
    
    try:
        response = requests.get(plant_url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Plant data API is working!")
            
            if 'response' in data and 'data' in data['response']:
                print(f"Solar plant data points: {len(data['response']['data'])}")
                print("Sample solar plant data:")
                for item in data['response']['data'][:3]:
                    print(f"  {item}")
        else:
            print(f"❌ Plant API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Plant request failed: {e}")

if __name__ == "__main__":
    test_eia_api()

