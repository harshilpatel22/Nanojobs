const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced File Upload Middleware for Tasks
 * Handles both task attachments (employer uploads) and submissions (worker uploads)
 */

// Create task-specific upload directories
const uploadsDir = path.join(__dirname, '../../uploads');
const taskAttachmentsDir = path.join(uploadsDir, 'task-attachments');
const taskSubmissionsDir = path.join(uploadsDir, 'task-submissions');

// Ensure directories exist
[uploadsDir, taskAttachmentsDir, taskSubmissionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Determine file type from MIME type
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf')) return 'document';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.startsWith('text/')) return 'text';
  return 'other';
};

// Storage configuration for task attachments (employer uploads)
const taskAttachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, taskAttachmentsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    const fileName = `task_${timestamp}_${uniqueId}_${baseName}${extension}`;
    cb(null, fileName);
  }
});

// Storage configuration for task submissions (worker uploads)
const taskSubmissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, taskSubmissionsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    const fileName = `submission_${timestamp}_${uniqueId}_${baseName}${extension}`;
    cb(null, fileName);
  }
});

// Enhanced file filter with more file types
const fileFilter = (req, file, cb) => {
  // Allowed MIME types for tasks
  const allowedMimeTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    
    // Spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
    // Presentations
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];

  // Allowed file extensions
  const allowedExtensions = [
    '.pdf', '.doc', '.docx', '.txt', '.csv',
    '.xls', '.xlsx', '.ppt', '.pptx',
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.zip', '.rar', '.7z'
  ];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Check MIME type and extension
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Task attachment upload configuration (for employers)
const taskAttachmentUpload = multer({
  storage: taskAttachmentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Up to 5 files
  },
  fileFilter: fileFilter
});

// Task submission upload configuration (for workers)
const taskSubmissionUpload = multer({
  storage: taskSubmissionStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for submissions
    files: 10 // Up to 10 files
  },
  fileFilter: fileFilter
});

/**
 * Middleware for task attachment uploads (employers)
 */
const handleTaskAttachments = (req, res, next) => {
  const uploadMultiple = taskAttachmentUpload.array('attachments', 5);
  
  uploadMultiple(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return handleMulterError(err, res);
    }
    
    if (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file',
        message: err.message
      });
    }
    
    // Process uploaded files
    if (req.files && req.files.length > 0) {
      req.attachmentInfo = req.files.map(file => ({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType: getFileType(file.mimetype),
        uploadedAt: new Date().toISOString()
      }));
      
      console.log(`Task attachments uploaded: ${req.files.length} files`);
    } else {
      req.attachmentInfo = [];
    }
    
    next();
  });
};

/**
 * Middleware for task submission uploads (workers)
 */
const handleTaskSubmissions = (req, res, next) => {
  const uploadMultiple = taskSubmissionUpload.array('submissions', 10);
  
  uploadMultiple(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return handleMulterError(err, res);
    }
    
    if (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file',
        message: err.message
      });
    }
    
    // Process uploaded files
    if (req.files && req.files.length > 0) {
      req.submissionInfo = req.files.map(file => ({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType: getFileType(file.mimetype),
        uploadedAt: new Date().toISOString()
      }));
      
      console.log(`Task submissions uploaded: ${req.files.length} files`);
    } else {
      req.submissionInfo = [];
    }
    
    next();
  });
};

/**
 * Handle multer errors consistently
 */
const handleMulterError = (err, res) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size too large',
      message: 'File size should not exceed the limit'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: 'Too many files',
      message: 'Too many files uploaded'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field',
      message: 'Please use correct file field names'
    });
  }
  
  return res.status(400).json({
    success: false,
    error: 'File upload error',
    message: err.message
  });
};

/**
 * Cleanup uploaded files in case of processing errors
 */
const cleanupFiles = (files) => {
  if (!files || !Array.isArray(files)) return;
  
  files.forEach(file => {
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`Cleaned up file: ${file.path}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${file.path}:`, error.message);
    }
  });
};

/**
 * Cleanup files by file paths
 */
const cleanupFilePaths = (filePaths) => {
  if (!filePaths || !Array.isArray(filePaths)) return;
  
  filePaths.forEach(filePath => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error.message);
    }
  });
};

/**
 * Get file info by filename from task attachments
 */
const getTaskAttachmentInfo = (filename) => {
  const filePath = path.join(taskAttachmentsDir, filename);
  return getFileInfoFromPath(filePath, filename);
};

/**
 * Get file info by filename from task submissions
 */
const getTaskSubmissionInfo = (filename) => {
  const filePath = path.join(taskSubmissionsDir, filename);
  return getFileInfoFromPath(filePath, filename);
};

/**
 * Get file info from file path
 */
const getFileInfoFromPath = (filePath, filename) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const stats = fs.statSync(filePath);
  return {
    filename,
    filePath,
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    isAccessible: true
  };
};

/**
 * Serve file with proper headers
 */
const serveFile = (filePath, originalName, res) => {
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'The requested file could not be found'
      });
    }
    
    const stats = fs.statSync(filePath);
    const mimeType = getMimeTypeFromExtension(path.extname(originalName));
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({
      success: false,
      error: 'File serving error',
      message: 'Could not serve the file'
    });
  }
};

/**
 * Get MIME type from file extension
 */
const getMimeTypeFromExtension = (extension) => {
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.zip': 'application/zip'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * Clean up old files (maintenance function)
 */
const cleanupOldTaskFiles = (daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  let deletedCount = 0;
  
  [taskAttachmentsDir, taskSubmissionsDir].forEach(dir => {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(filename => {
        const filePath = path.join(dir, filename);
        const stats = fs.statSync(filePath);
        
        if (stats.birthtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Deleted old task file: ${filename}`);
        }
      });
    } catch (error) {
      console.error(`Error cleaning up directory ${dir}:`, error.message);
    }
  });
  
  console.log(`Task file cleanup completed. Deleted ${deletedCount} old files.`);
  return deletedCount;
};

module.exports = {
  handleTaskAttachments,
  handleTaskSubmissions,
  cleanupFiles,
  cleanupFilePaths,
  getTaskAttachmentInfo,
  getTaskSubmissionInfo,
  serveFile,
  cleanupOldTaskFiles,
  taskAttachmentsDir,
  taskSubmissionsDir,
  uploadsDir
};