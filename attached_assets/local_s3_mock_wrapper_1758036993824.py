"""
Local S3 Mock Wrapper Script

This script:
1. Runs a Python script (like CVIZ_GPT_CSV.py) to process images
2. Creates a local directory structure that mimics an S3 bucket
3. Copies the output images to this structure
4. Logs the entire process for Claude to see


This is useful for testing or for users who don't have AWS access.

Usage: python local_s3_mock_wrapper.py your_script.py mock_bucket_name s3_prefix [script_args]
"""
import sys
import subprocess
import datetime
import os
import time
import shutil

def run_script(script_path, script_args, log_file):
    """Run a Python script and capture its output to a log file."""
    with open(log_file, 'a') as f:
        f.write(f"=== Running {script_path} at {datetime.datetime.now()} ===\n\n")
        
        try:
            # Create the command: python script.py args
            cmd = [sys.executable, script_path] + script_args
            
            # Run the process and capture output
            process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            # Stream output to both console and file
            for line in process.stdout:
                print(line, end='')  # Print to console
                f.write(line)        # Write to file
                
            # Wait for process to complete
            return_code = process.wait()
            
            # Write completion status
            f.write(f"\n\n=== Script completed with return code {return_code} ===\n")
            f.write(f"=== Finished at {datetime.datetime.now()} ===\n\n")
            
            print(f"\nScript completed with return code {return_code}")
            
            return return_code == 0  # Return True if script succeeded
            
        except Exception as e:
            error_msg = f"Error running script: {e}"
            print(error_msg)
            f.write(f"\n\n{error_msg}\n")
            f.write(f"=== Failed at {datetime.datetime.now()} ===\n\n")
            return False

def copy_to_mock_s3(local_directory, mock_bucket_dir, s3_prefix, log_file):
    """Copy all files to a local directory structure that mimics an S3 bucket."""
    with open(log_file, 'a') as f:
        f.write(f"=== Starting copy to mock S3 from {local_directory} to {mock_bucket_dir}/{s3_prefix} at {datetime.datetime.now()} ===\n\n")
        
        try:
            # Create the mock S3 bucket directory if it doesn't exist
            os.makedirs(mock_bucket_dir, exist_ok=True)
            
            # Create the prefix directory
            prefix_dir = os.path.join(mock_bucket_dir, s3_prefix)
            os.makedirs(prefix_dir, exist_ok=True)
            
            # Check if source directory exists
            if not os.path.exists(local_directory):
                error_msg = f"Local directory {local_directory} does not exist"
                print(error_msg)
                f.write(f"{error_msg}\n")
                f.write(f"=== Copy failed at {datetime.datetime.now()} ===\n\n")
                return False
            
            # Count files to copy
            file_count = sum(len(files) for _, _, files in os.walk(local_directory))
            f.write(f"Found {file_count} files to copy\n")
            print(f"Found {file_count} files to copy")
            
            # Copy files
            copied_count = 0
            start_time = time.time()
            
            for root, dirs, files in os.walk(local_directory):
                for filename in files:
                    local_path = os.path.join(root, filename)
                    
                    # Calculate relative path for destination
                    relative_path = os.path.relpath(local_path, local_directory)
                    dest_path = os.path.join(prefix_dir, relative_path)
                    
                    # Create destination directory if it doesn't exist
                    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                    
                    # Copy file
                    try:
                        shutil.copy2(local_path, dest_path)
                        copied_count += 1
                        
                        # Log progress every 10 files
                        if copied_count % 10 == 0 or copied_count == file_count:
                            progress = (copied_count / file_count) * 100
                            elapsed = time.time() - start_time
                            msg = f"Copied {copied_count}/{file_count} files ({progress:.1f}%) in {elapsed:.1f} seconds"
                            print(msg)
                            f.write(f"{msg}\n")
                            
                    except Exception as e:
                        error_msg = f"Error copying {local_path} to {dest_path}: {e}"
                        print(error_msg)
                        f.write(f"{error_msg}\n")
            
            # Log completion
            total_time = time.time() - start_time
            success_msg = f"Successfully copied {copied_count}/{file_count} files to mock S3 in {total_time:.1f} seconds"
            print(success_msg)
            f.write(f"{success_msg}\n")
            f.write(f"Files are accessible at: {os.path.abspath(prefix_dir)}\n")
            print(f"Files are accessible at: {os.path.abspath(prefix_dir)}")
            
            # Create a simple HTML index file to browse the images
            index_path = os.path.join(prefix_dir, "index.html")
            with open(index_path, 'w') as index_file:
                index_file.write("<html><head><title>Mock S3 Bucket</title></head><body>\n")
                index_file.write(f"<h1>Mock S3 Bucket: {os.path.basename(mock_bucket_dir)}/{s3_prefix}</h1>\n")
                index_file.write("<ul>\n")
                
                # Add links to all image files
                for root, _, files in os.walk(prefix_dir):
                    for filename in files:
                        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                            file_path = os.path.join(root, filename)
                            relative_path = os.path.relpath(file_path, prefix_dir)
                            index_file.write(f'  <li><a href="{relative_path}">{relative_path}</a></li>\n')
                
                index_file.write("</ul></body></html>")
            
            f.write(f"Created HTML index at: {index_path}\n")
            print(f"Created HTML index at: {index_path}")
            
            f.write(f"=== Copy to mock S3 completed at {datetime.datetime.now()} ===\n\n")
            return True
            
        except Exception as e:
            error_msg = f"Error during copy to mock S3: {e}"
            print(error_msg)
            f.write(f"{error_msg}\n")
            f.write(f"=== Copy failed at {datetime.datetime.now()} ===\n\n")
            return False

def main():
    if len(sys.argv) < 4:
        print("Usage: python local_s3_mock_wrapper.py your_script.py mock_bucket_name s3_prefix [script_args]")
        print("Example: python local_s3_mock_wrapper.py CVIZ_GPT_CSV.py my-bucket thermal-images")
        sys.exit(1)
    
    script_path = sys.argv[1]
    mock_bucket_name = sys.argv[2]
    s3_prefix = sys.argv[3]
    script_args = sys.argv[4:]
    
    # Create a log file name based on the script name
    script_name = os.path.basename(script_path)
    base_name = os.path.splitext(script_name)[0]
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = f"{base_name}_mock_s3_{timestamp}.log"
    
    # Create the mock bucket directory in the current directory
    mock_bucket_dir = os.path.join(os.getcwd(), "mock_s3", mock_bucket_name)
    
    print(f"Running {script_path} with arguments: {' '.join(script_args)}")
    print(f"Output will be saved to {log_file}")
    print(f"Images will be copied to {mock_bucket_dir}/{s3_prefix}/")
    
    # Determine the output folder from CVIZ_GPT_CSV.py
    # This is a bit of a hack, but it works for this specific script
    output_folder = None
    if "CVIZ_GPT_CSV.py" in script_path:
        with open(script_path, 'r') as f:
            for line in f:
                if "output_folder" in line and "=" in line:
                    # Extract the output folder path
                    output_folder = line.split("=")[1].strip().strip('"\'')
                    break
    
    # If we couldn't determine the output folder, ask the user
    if not output_folder:
        output_folder = input("Enter the path to the output folder containing images to copy: ")
    
    # Run the script
    with open(log_file, 'w') as f:
        f.write(f"=== Mock S3 Wrapper Log ===\n")
        f.write(f"Script: {script_path}\n")
        f.write(f"Arguments: {' '.join(script_args)}\n")
        f.write(f"Mock Bucket: {mock_bucket_name}\n")
        f.write(f"S3 Prefix: {s3_prefix}\n")
        f.write(f"Output Folder: {output_folder}\n")
        f.write(f"Started at: {datetime.datetime.now()}\n\n")
    
    # Run the script
    script_success = run_script(script_path, script_args, log_file)
    
    # Copy to mock S3 if script succeeded
    if script_success:
        print(f"\nCopying output files from {output_folder} to mock S3...")
        copy_success = copy_to_mock_s3(output_folder, mock_bucket_dir, s3_prefix, log_file)
        
        if copy_success:
            print(f"\nEntire process completed successfully!")
            print(f"You can view the images by opening: {os.path.join(mock_bucket_dir, s3_prefix, 'index.html')}")
        else:
            print(f"\nScript ran successfully, but copy to mock S3 failed. Check {log_file} for details.")
    else:
        print(f"\nScript failed. Copy to mock S3 skipped. Check {log_file} for details.")
    
    print(f"Log saved to {os.path.abspath(log_file)}")

if __name__ == "__main__":
    main()
