import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { createReadStream } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};


const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
const maxFileSize = 20 * 1024 * 1024; // 20MB
const uploadsDir = path.join(process.cwd(), 'uploads');
const jobsIndexPath = path.join(uploadsDir, 'jobs-index.json');

// File signatures for validation (magic numbers)
const fileSignatures = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/jpg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/tiff': [0x49, 0x49, 0x2A, 0x00], // Little endian TIFF
};

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 50; // Max requests per window

// Ensure uploads directory exists
if (!fsSync.existsSync(uploadsDir)) {
  fsSync.mkdirSync(uploadsDir, { recursive: true });
}

// Rate limiting function
const checkRateLimit = (clientIp: string): boolean => {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIp);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
};

// Enhanced file validation with signature verification
const validateFileSignature = async (filePath: string, mimeType: string): Promise<boolean> => {
  try {
    const expectedSignature = fileSignatures[mimeType as keyof typeof fileSignatures];
    if (!expectedSignature) return false;
    
    const buffer = Buffer.alloc(expectedSignature.length);
    const fd = await fs.open(filePath, 'r');
    await fd.read(buffer, 0, expectedSignature.length, 0);
    await fd.close();
    
    return expectedSignature.every((byte, index) => buffer[index] === byte);
  } catch (error) {
    console.error('File signature validation error:', error);
    return false;
  }
};

// Load and save jobs index functions
const loadJobsIndex = async () => {
  try {
    if (fsSync.existsSync(jobsIndexPath)) {
      const data = await fs.readFile(jobsIndexPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading jobs index:', error);
  }
  return {};
};

const saveJobsIndex = async (index: any) => {
  try {
    await fs.writeFile(jobsIndexPath, JSON.stringify(index, null, 2));
  } catch (error) {
    console.error('Error saving jobs index:', error);
  }
};

// Update job status in both metadata and jobs index
const updateJobStatus = async (jobId: string, status: string, metadata?: any) => {
  const jobDir = path.join(uploadsDir, jobId);
  const jobMetadataPath = path.join(jobDir, 'metadata.json');
  
  try {
    // Update job metadata
    let jobMetadata = metadata;
    if (!jobMetadata && fsSync.existsSync(jobMetadataPath)) {
      const data = await fs.readFile(jobMetadataPath, 'utf8');
      jobMetadata = JSON.parse(data);
    }
    
    if (jobMetadata) {
      jobMetadata.status = status;
      jobMetadata.updatedAt = new Date().toISOString();
      await fs.writeFile(jobMetadataPath, JSON.stringify(jobMetadata, null, 2));
      
      // Update jobs index
      const jobsIndex = await loadJobsIndex();
      if (jobsIndex[jobId]) {
        jobsIndex[jobId].status = status;
        jobsIndex[jobId].updatedAt = jobMetadata.updatedAt;
        await saveJobsIndex(jobsIndex);
      }
    }
  } catch (error) {
    console.error('Error updating job status:', error);
  }
};

const validateFile = async (file: File): Promise<string | null> => {
  if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
    return 'Only JPG, JPEG, PNG, and TIFF files are allowed';
  }
  if (file.size > maxFileSize) {
    return 'File size must be less than 20MB';
  }
  if (!file.originalFilename) {
    return 'Invalid file name';
  }
  
  // Validate file signature to prevent spoofed MIME types
  const isValidSignature = await validateFileSignature(file.filepath, file.mimetype);
  if (!isValidSignature) {
    return 'Invalid file format or corrupted file';
  }
  
  return null;
};

const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  return `${baseName}_${timestamp}_${random}${extension}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Rate limiting
  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  const form = new IncomingForm({
    uploadDir: uploadsDir,
    keepExtensions: true,
    maxFileSize: maxFileSize,
    maxFiles: 1, // Handle one file at a time
  });

  try {
    const [fields, files] = await form.parse(req);
    
    const jobId = Array.isArray(fields.jobId) ? fields.jobId[0] : fields.jobId;
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file with enhanced security
    const validationError = await validateFile(uploadedFile);
    if (validationError) {
      // Clean up the uploaded file
      if (fsSync.existsSync(uploadedFile.filepath)) {
        await fs.unlink(uploadedFile.filepath);
      }
      return res.status(400).json({ error: validationError });
    }

    // Create job directory if it doesn't exist
    const jobDir = path.join(uploadsDir, jobId);
    if (!fsSync.existsSync(jobDir)) {
      await fs.mkdir(jobDir, { recursive: true });
    }

    // Generate unique filename and move file to job directory
    const uniqueFilename = generateUniqueFilename(uploadedFile.originalFilename || 'unknown');
    const finalPath = path.join(jobDir, uniqueFilename);
    
    // Move file to final location
    await fs.rename(uploadedFile.filepath, finalPath);

    // Update job metadata
    const jobMetadataPath = path.join(jobDir, 'metadata.json');
    let jobMetadata = {
      id: jobId,
      status: 'uploading',
      fileCount: 0,
      processedCount: 0,
      uploadedFiles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (fsSync.existsSync(jobMetadataPath)) {
      const existingData = await fs.readFile(jobMetadataPath, 'utf8');
      jobMetadata = { ...JSON.parse(existingData), updatedAt: new Date().toISOString() };
    }

    // Add uploaded file to metadata
    jobMetadata.uploadedFiles.push({
      filename: uniqueFilename,
      originalName: uploadedFile.originalFilename,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
      uploadedAt: new Date().toISOString()
    });

    // Update status to 'uploading' if this is the first file
    if (jobMetadata.uploadedFiles.length === 1) {
      await updateJobStatus(jobId, 'uploading', jobMetadata);
    }
    
    // Check if all files have been uploaded
    const allFilesUploaded = jobMetadata.uploadedFiles.length >= jobMetadata.fileCount;
    
    if (allFilesUploaded) {
      // Transition to processing status
      await updateJobStatus(jobId, 'processing', jobMetadata);
    } else {
      // Just update the metadata file
      await fs.writeFile(jobMetadataPath, JSON.stringify(jobMetadata, null, 2));
    }

    res.status(200).json({
      success: true,
      jobId,
      filename: uniqueFilename,
      originalName: uploadedFile.originalFilename,
      size: uploadedFile.size,
      uploadedFiles: jobMetadata.uploadedFiles.length,
      totalFiles: jobMetadata.fileCount,
      status: jobMetadata.status,
      allFilesUploaded: jobMetadata.uploadedFiles.length >= jobMetadata.fileCount
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 20MB.' });
    }
    
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}