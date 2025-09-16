import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState, useCallback, useRef } from "react";

interface UploadedFile {
  file: File;
  id: string;
  preview: string;
  status: 'ready' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  error?: string;
}

interface JobStatus {
  id: string;
  status: 'created' | 'uploading' | 'processing' | 'completed' | 'error';
  fileCount: number;
  processedCount: number;
  createdAt: string;
}

const Upload: NextPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
  const maxFileSize = 20 * 1024 * 1024; // 20MB
  const maxFiles = 500;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, JPEG, PNG, and TIFF files are allowed';
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 20MB';
    }
    return null;
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const totalFiles = uploadedFiles.length + fileArray.length;

    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed. You're trying to upload ${totalFiles} files.`);
      return;
    }

    const newFiles: UploadedFile[] = fileArray.map(file => {
      const error = validateFile(file);
      return {
        file,
        id: generateId(),
        preview: URL.createObjectURL(file),
        status: error ? 'error' : 'ready',
        progress: 0,
        error
      };
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, [uploadedFiles.length]);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAllFiles = () => {
    uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setUploadedFiles([]);
    setJobStatus(null);
  };

  // Upload single file with progress tracking
  const uploadFileWithProgress = (file: UploadedFile, jobId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('jobId', jobId);

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadedFiles(prev =>
            prev.map(f => f.id === file.id ? { ...f, progress } : f)
          );
        }
      });

      // Handle successful upload
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploadedFiles(prev =>
              prev.map(f => f.id === file.id ? { 
                ...f, 
                status: 'uploaded', 
                progress: 100 
              } : f)
            );
            resolve();
          } catch (error) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      // Start upload
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };

  // Update job status from backend
  const fetchJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs?jobId=${jobId}`);
      if (response.ok) {
        const job = await response.json();
        setJobStatus(job);
        return job;
      }
    } catch (error) {
      console.error('Failed to fetch job status:', error);
    }
    return null;
  };

  const startUpload = async () => {
    const validFiles = uploadedFiles.filter(f => f.status === 'ready');
    if (validFiles.length === 0) {
      alert('No valid files to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Create job
      const jobResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileCount: validFiles.length })
      });

      if (!jobResponse.ok) {
        throw new Error('Failed to create job');
      }

      const job = await jobResponse.json();
      setJobStatus(job);

      // Set all files to uploading status
      setUploadedFiles(prev => 
        prev.map(f => validFiles.find(vf => vf.id === f.id) ? { ...f, status: 'uploading', progress: 0 } : f)
      );

      // Upload files concurrently (max 5 at a time)
      const concurrencyLimit = 5;
      const uploadPromises: Promise<void>[] = [];
      
      for (let i = 0; i < validFiles.length; i += concurrencyLimit) {
        const batch = validFiles.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(file => 
          uploadFileWithProgress(file, job.id).catch(error => {
            setUploadedFiles(prev =>
              prev.map(f => f.id === file.id ? { 
                ...f, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              } : f)
            );
          })
        );
        
        await Promise.all(batchPromises);
      }

      // Fetch final job status from backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay for backend processing
      await fetchJobStatus(job.id);

    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validFilesCount = uploadedFiles.filter(f => f.status !== 'error').length;
  const uploadedCount = uploadedFiles.filter(f => f.status === 'uploaded').length;

  return (
    <>
      <Head>
        <title>Upload Thermal Images - ComplianceDrone</title>
        <meta name="description" content="Upload thermal inspection images for AI-powered analysis and PDF report generation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="gradient-bg text-white">
        <div className="cd-container">
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <Image 
                src="/logo.png" 
                alt="ComplianceDrone Logo" 
                width={50} 
                height={50}
                priority
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold">ComplianceDrone</h1>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="/" className="hover:text-gray-200 transition-colors">Home</a>
              <a href="#" className="text-gray-300">Upload</a>
              <a href="#contact" className="hover:text-gray-200 transition-colors">Contact</a>
            </div>
          </nav>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50">
        <div className="cd-container py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gradient mb-4">
              Upload Thermal Images
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload your thermal inspection images for AI-powered analysis. 
              Supports JPG, JPEG, PNG, and TIFF files up to 20MB each.
            </p>
          </div>

          {/* Upload Area */}
          <div className="max-w-4xl mx-auto">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                isDragActive 
                  ? 'border-compliance-orange bg-orange-50' 
                  : 'border-gray-300 bg-white hover:border-compliance-orange hover:bg-orange-50'
              }`}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <div className="mb-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Drop thermal images here, or click to browse
              </h3>
              <p className="text-gray-500 mb-6">
                Support for JPG, JPEG, PNG, TIFF files (up to {maxFiles} files, 20MB each)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary inline-flex items-center space-x-2"
                disabled={isUploading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Browse Files</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.tiff"
              onChange={onFileInputChange}
              className="hidden"
            />
          </div>

          {/* File Preview Section */}
          {uploadedFiles.length > 0 && (
            <div className="max-w-4xl mx-auto mt-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Uploaded Files ({validFilesCount})
                </h3>
                <div className="flex space-x-4">
                  <button
                    onClick={clearAllFiles}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                    disabled={isUploading}
                  >
                    Clear All
                  </button>
                  {validFilesCount > 0 && (
                    <button
                      onClick={startUpload}
                      disabled={isUploading || validFilesCount === 0}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Uploading...' : `Process ${validFilesCount} Images`}
                    </button>
                  )}
                </div>
              </div>

              {/* Job Status */}
              {jobStatus && (
                <div className="card mb-6">
                  <h4 className="font-semibold mb-2">Job Status: {jobStatus.id}</h4>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      jobStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                      jobStatus.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      jobStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {jobStatus.status.toUpperCase()}
                    </span>
                    <span className="text-gray-600">
                      {uploadedCount} of {jobStatus.fileCount} files uploaded
                    </span>
                  </div>
                </div>
              )}

              {/* File Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploadedFiles.map((uploadedFile) => (
                  <div key={uploadedFile.id} className="card">
                    <div className="relative">
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <button
                        onClick={() => removeFile(uploadedFile.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        disabled={isUploading}
                      >
                        ×
                      </button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1 truncate" title={uploadedFile.file.name}>
                        {uploadedFile.file.name}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          uploadedFile.status === 'uploaded' ? 'bg-green-100 text-green-800' :
                          uploadedFile.status === 'uploading' ? 'bg-yellow-100 text-yellow-800' :
                          uploadedFile.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {uploadedFile.status.toUpperCase()}
                        </span>
                        
                        {uploadedFile.status === 'uploading' && (
                          <div className="w-16 bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-compliance-orange h-1 rounded-full transition-all duration-300"
                              style={{ width: `${uploadedFile.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {uploadedFile.error && (
                        <p className="text-red-600 text-xs mt-2">{uploadedFile.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Upload;