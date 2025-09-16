// Secure path validation utilities to prevent path traversal attacks
import path from 'path';

// Strict regex pattern for jobId validation
// Only allows alphanumeric characters, underscores, and hyphens (1-64 chars)
const JOB_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

// Base uploads directory for secure path resolution
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Validates jobId format and prevents path traversal attacks
 * @param jobId - The job identifier to validate
 * @returns true if valid, false otherwise
 */
export function isValidJobId(jobId: string): boolean {
  if (!jobId || typeof jobId !== 'string') {
    return false;
  }
  
  return JOB_ID_PATTERN.test(jobId);
}

/**
 * Creates a secure job directory path and verifies it's within uploads directory
 * @param jobId - The job identifier (must be pre-validated)
 * @returns Secure absolute path to job directory
 * @throws Error if path traversal is detected
 */
export function getSecureJobPath(jobId: string): string {
  if (!isValidJobId(jobId)) {
    throw new Error('Invalid job ID format');
  }
  
  // Create the intended job directory path
  const jobDir = path.join(UPLOADS_DIR, jobId);
  
  // Resolve to absolute path and verify it's within uploads directory
  const resolvedJobDir = path.resolve(jobDir);
  const resolvedUploadsDir = path.resolve(UPLOADS_DIR);
  
  // Check if the resolved job directory is within the uploads directory
  if (!resolvedJobDir.startsWith(resolvedUploadsDir + path.sep) && resolvedJobDir !== resolvedUploadsDir) {
    throw new Error('Path traversal attack detected');
  }
  
  return resolvedJobDir;
}

/**
 * Validates and sanitizes filename to prevent directory traversal in filenames
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename');
  }
  
  // Remove any directory separators and relative path components
  const sanitized = path.basename(filename)
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .replace(/^\.+/, '') // Remove leading dots
    .trim();
  
  if (!sanitized || sanitized.length === 0) {
    throw new Error('Invalid filename after sanitization');
  }
  
  if (sanitized.length > 255) {
    throw new Error('Filename too long');
  }
  
  return sanitized;
}

/**
 * Creates a secure file path within a job directory
 * @param jobId - The job identifier
 * @param filename - The filename
 * @returns Secure absolute path to the file
 */
export function getSecureFilePath(jobId: string, filename: string): string {
  const secureJobDir = getSecureJobPath(jobId);
  const sanitizedFilename = sanitizeFilename(filename);
  
  return path.join(secureJobDir, sanitizedFilename);
}

/**
 * Gets the uploads directory path
 * @returns Absolute path to uploads directory
 */
export function getUploadsDir(): string {
  return path.resolve(UPLOADS_DIR);
}