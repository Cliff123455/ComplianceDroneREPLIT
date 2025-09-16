import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { hasValidSession } from '../../lib/nextAuth';
import { isValidJobId, getSecureJobPath, getUploadsDir } from '../../lib/pathValidation';

const uploadsDir = getUploadsDir();
const jobsIndexPath = path.join(uploadsDir, 'jobs-index.json');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

interface JobMetadata {
  id: string;
  status: 'created' | 'uploading' | 'processing' | 'completed' | 'error';
  fileCount: number;
  processedCount: number;
  uploadedFiles: any[];
  createdAt: string;
  updatedAt: string;
}

interface JobsIndex {
  [jobId: string]: {
    id: string;
    status: string;
    fileCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

const generateJobId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `job_${timestamp}_${random}`;
};

const loadJobsIndex = (): JobsIndex => {
  if (fs.existsSync(jobsIndexPath)) {
    try {
      return JSON.parse(fs.readFileSync(jobsIndexPath, 'utf8'));
    } catch (error) {
      console.error('Error loading jobs index:', error);
    }
  }
  return {};
};

const saveJobsIndex = (index: JobsIndex): void => {
  try {
    fs.writeFileSync(jobsIndexPath, JSON.stringify(index, null, 2));
  } catch (error) {
    console.error('Error saving jobs index:', error);
  }
};

const createJob = (fileCount: number): JobMetadata => {
  const jobId = generateJobId();
  const timestamp = new Date().toISOString();
  
  const job: JobMetadata = {
    id: jobId,
    status: 'created',
    fileCount,
    processedCount: 0,
    uploadedFiles: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  // Create secure job directory
  const jobDir = getSecureJobPath(jobId);
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }

  // Save job metadata
  const jobMetadataPath = path.join(jobDir, 'metadata.json');
  fs.writeFileSync(jobMetadataPath, JSON.stringify(job, null, 2));

  // Update jobs index
  const jobsIndex = loadJobsIndex();
  jobsIndex[jobId] = {
    id: jobId,
    status: job.status,
    fileCount: job.fileCount,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
  saveJobsIndex(jobsIndex);

  return job;
};

const getJob = (jobId: string): JobMetadata | null => {
  // Validate jobId format to prevent path traversal
  if (!isValidJobId(jobId)) {
    console.error('Invalid job ID format:', jobId);
    return null;
  }
  
  const jobDir = getSecureJobPath(jobId);
  const jobMetadataPath = path.join(jobDir, 'metadata.json');
  
  if (!fs.existsSync(jobMetadataPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(jobMetadataPath, 'utf8'));
  } catch (error) {
    console.error('Error loading job metadata:', error);
    return null;
  }
};

const updateJobStatus = (jobId: string, status: JobMetadata['status']): JobMetadata | null => {
  const job = getJob(jobId);
  if (!job) return null;

  job.status = status;
  job.updatedAt = new Date().toISOString();

  // Save updated job metadata with secure path
  const jobDir = getSecureJobPath(jobId);
  const jobMetadataPath = path.join(jobDir, 'metadata.json');
  fs.writeFileSync(jobMetadataPath, JSON.stringify(job, null, 2));

  // Update jobs index
  const jobsIndex = loadJobsIndex();
  if (jobsIndex[jobId]) {
    jobsIndex[jobId].status = status;
    jobsIndex[jobId].updatedAt = job.updatedAt;
    saveJobsIndex(jobsIndex);
  }

  return job;
};

const listJobs = (limit: number = 50): JobsIndex => {
  const jobsIndex = loadJobsIndex();
  const sortedJobs = Object.values(jobsIndex)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  const result: JobsIndex = {};
  sortedJobs.forEach(job => {
    result[job.id] = job;
  });

  return result;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication first
  if (!(await hasValidSession(req))) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required. Please log in to continue.' 
    });
  }
  try {
    switch (req.method) {
      case 'POST':
        // Create new job
        const { fileCount } = req.body;
        
        if (!fileCount || typeof fileCount !== 'number' || fileCount <= 0) {
          return res.status(400).json({ error: 'Valid file count is required' });
        }

        if (fileCount > 500) {
          return res.status(400).json({ error: 'Maximum 500 files allowed per job' });
        }

        const newJob = createJob(fileCount);
        res.status(201).json(newJob);
        break;

      case 'GET':
        const { jobId } = req.query;
        
        if (jobId && typeof jobId === 'string') {
          // Validate jobId format before processing
          if (!isValidJobId(jobId)) {
            return res.status(400).json({ 
              error: 'Invalid job ID format. Only alphanumeric characters, underscores, and hyphens are allowed.' 
            });
          }
          
          // Get specific job
          const job = getJob(jobId);
          if (!job) {
            return res.status(404).json({ error: 'Job not found' });
          }
          res.status(200).json(job);
        } else {
          // List all jobs
          const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
          const jobs = listJobs(limit);
          res.status(200).json(jobs);
        }
        break;

      case 'PUT':
        // Update job status
        const { jobId: updateJobId } = req.query;
        const { status } = req.body;
        
        if (!updateJobId || typeof updateJobId !== 'string') {
          return res.status(400).json({ error: 'Job ID is required' });
        }
        
        // Validate jobId format before processing
        if (!isValidJobId(updateJobId)) {
          return res.status(400).json({ 
            error: 'Invalid job ID format. Only alphanumeric characters, underscores, and hyphens are allowed.' 
          });
        }

        if (!status || !['created', 'uploading', 'processing', 'completed', 'error'].includes(status)) {
          return res.status(400).json({ error: 'Valid status is required' });
        }

        const updatedJob = updateJobStatus(updateJobId, status);
        if (!updatedJob) {
          return res.status(404).json({ error: 'Job not found' });
        }

        res.status(200).json(updatedJob);
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Jobs API error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}