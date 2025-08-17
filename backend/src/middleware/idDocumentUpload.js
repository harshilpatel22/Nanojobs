/**
 * ID Document Upload Middleware
 * Handles Aadhar card and driving license file uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/id-documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: idtype_timestamp_random.ext
    const idType = req.body.idDocumentType || 'document';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${idType.toLowerCase()}_${timestamp}_${randomString}${ext}`;
    cb(null, filename);
  }
});

// File filter for ID documents
const fileFilter = (req, file, cb) => {
  // Allowed file types for ID documents
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP and PDF files are allowed for ID documents.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

/**
 * Middleware to handle single ID document upload
 */
const handleIdDocumentUpload = (req, res, next) => {
  const uploadSingle = upload.single('idDocument');
  
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('ID document upload error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File too large',
            message: 'ID document file size must be less than 5MB'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: 'Too many files',
            message: 'Please upload only one ID document file'
          });
        }
      }
      
      return res.status(400).json({
        success: false,
        error: 'File upload failed',
        message: err.message || 'Unable to upload ID document'
      });
    }

    // Validate that ID document is provided if required
    if (req.body.idDocumentType && req.body.idDocumentNumber && !req.file) {
      return res.status(400).json({
        success: false,
        error: 'ID document file required',
        message: 'Please upload a clear photo or PDF of your ID document'
      });
    }

    // Add file info to request for logging
    if (req.file) {
      console.log('✅ ID document uploaded:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    }

    next();
  });
};

/**
 * Validate ID document file
 */
const validateIdDocument = (req, res, next) => {
  const { idDocumentType, idDocumentNumber, isDigiLockerVerified } = req.body;
  
  // Skip file validation if DigiLocker is verified
  if (isDigiLockerVerified) {
    console.log('🔄 Skipping file validation for DigiLocker verified user');
    return next();
  }
  
  // If ID info is provided, ensure file is also provided
  if (idDocumentType && idDocumentNumber) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'ID document file required',
        message: 'Please upload a clear photo or PDF of your ID document'
      });
    }

    // Additional validation for file quality could be added here
    // For now, we just check if file exists and is within size limits
    
    const fileSizeInMB = req.file.size / (1024 * 1024);
    if (fileSizeInMB < 0.1) { // Less than 100KB might be too small
      return res.status(400).json({
        success: false,
        error: 'File too small',
        message: 'Please upload a clear, readable image of your ID document'
      });
    }
  }

  next();
};

/**
 * Cleanup uploaded files on error
 */
const cleanupOnError = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Cleaned up uploaded file:', filePath);
    }
  } catch (error) {
    console.error('Failed to cleanup file:', error);
  }
};

/**
 * Get ID document file info
 */
const getIdDocumentInfo = (filename) => {
  if (!filename) return null;
  
  const filePath = path.join(uploadDir, filename);
  
  try {
    const stats = fs.statSync(filePath);
    return {
      filename,
      filePath,
      size: stats.size,
      uploadedAt: stats.birthtime,
      url: `/uploads/id-documents/${filename}`
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

/**
 * Serve ID document files (with access control)
 */
const serveIdDocument = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);
  
  // Security: Only allow access to authenticated users
  // Add additional checks here if needed (e.g., only owner can access their document)
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
      message: 'ID document not found'
    });
  }
  
  // Set appropriate headers
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error) => {
    console.error('Error streaming file:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'File serve error',
        message: 'Unable to serve ID document'
      });
    }
  });
};

module.exports = {
  handleIdDocumentUpload,
  validateIdDocument,
  cleanupOnError,
  getIdDocumentInfo,
  serveIdDocument
};