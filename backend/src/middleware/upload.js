const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * File Upload Middleware using Multer
 * Handles resume file uploads with validation and security
 */

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const resumesDir = path.join(uploadsDir, 'resumes');

[uploadsDir, resumesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumesDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp_uuid_original
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0]; // Short UUID
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    const fileName = `${timestamp}_${uniqueId}_${baseName}${extension}`;
    cb(null, fileName);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  // Allowed file extensions
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Check MIME type and extension
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: PDF, DOC, DOCX, TXT`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file allowed
  },
  fileFilter: fileFilter
});

/**
 * Resume upload middleware with error handling
 */
const resumeUpload = (req, res, next) => {
  const uploadSingle = upload.single('resume');
  
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size too large',
          message: 'Resume file size should not exceed 5MB'
        });
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field',
          message: 'Please upload file with field name "resume"'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'File upload error',
        message: err.message
      });
    }
    
    if (err) {
      // Handle custom filter errors
      return res.status(400).json({
        success: false,
        error: 'Invalid file',
        message: err.message
      });
    }
    
    // Validate file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select a resume file to upload'
      });
    }
    
    // Add file metadata to request
    req.fileInfo = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };
    
    console.log(`Resume uploaded: ${req.file.originalname} -> ${req.file.filename}`);
    next();
  });
};

/**
 * Cleanup uploaded file in case of processing errors
 */
const cleanupFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error.message);
  }
};

/**
 * Get file info by filename
 */
const getFileInfo = (filename) => {
  const filePath = path.join(resumesDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const stats = fs.statSync(filePath);
  return {
    filename,
    filePath,
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime
  };
};

/**
 * List all uploaded resume files
 */
const listResumeFiles = () => {
  try {
    const files = fs.readdirSync(resumesDir);
    return files.map(filename => getFileInfo(filename)).filter(Boolean);
  } catch (error) {
    console.error('Error listing resume files:', error.message);
    return [];
  }
};

/**
 * Delete old resume files (cleanup job)
 * @param {number} daysOld - Delete files older than this many days
 */
const cleanupOldFiles = (daysOld = 30) => {
  try {
    const files = fs.readdirSync(resumesDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    
    files.forEach(filename => {
      const filePath = path.join(resumesDir, filename);
      const stats = fs.statSync(filePath);
      
      if (stats.birthtime < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted old resume file: ${filename}`);
      }
    });
    
    console.log(`Cleanup completed. Deleted ${deletedCount} old resume files.`);
    return deletedCount;
  } catch (error) {
    console.error('Error during file cleanup:', error.message);
    return 0;
  }
};

// Export middleware and utilities
module.exports = {
  resumeUpload,
  cleanupFile,
  getFileInfo,
  listResumeFiles,
  cleanupOldFiles,
  uploadsDir,
  resumesDir
};