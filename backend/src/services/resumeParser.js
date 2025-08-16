const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Resume Parser Service
 * Handles extraction of text content from different file formats
 */
class ResumeParser {
  constructor() {
    this.supportedFormats = ['.pdf', '.doc', '.docx', '.txt'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
  }

  /**
   * Parse resume file and extract text content
   * @param {string} filePath - Path to the uploaded resume file
   * @param {string} originalName - Original filename
   * @returns {Object} Parsed resume data
   */
  async parseResume(filePath, originalName) {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('Resume file not found');
      }

      // Check file size
      const stats = fs.statSync(filePath);
      if (stats.size > this.maxFileSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Get file extension
      const fileExtension = path.extname(originalName).toLowerCase();
      
      // Validate file format
      if (!this.supportedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`);
      }

      // Parse based on file type
      let extractedText = '';
      let metadata = {};

      switch (fileExtension) {
        case '.pdf':
          const pdfResult = await this.parsePDF(filePath);
          extractedText = pdfResult.text;
          metadata = pdfResult.metadata;
          break;
          
        case '.doc':
        case '.docx':
          const docResult = await this.parseDocument(filePath);
          extractedText = docResult.text;
          metadata = docResult.metadata;
          break;
          
        case '.txt':
          extractedText = await this.parseTextFile(filePath);
          metadata = { format: 'text' };
          break;
          
        default:
          throw new Error('Unsupported file format');
      }

      // Clean and validate extracted text
      const cleanedText = this.cleanExtractedText(extractedText);
      
      if (!cleanedText || cleanedText.length < 50) {
        throw new Error('Resume content is too short or could not be extracted');
      }

      // Extract basic information
      const basicInfo = this.extractBasicInfo(cleanedText);

      return {
        success: true,
        text: cleanedText,
        metadata: {
          ...metadata,
          originalName,
          fileSize: stats.size,
          fileExtension,
          parsedAt: new Date().toISOString(),
          wordCount: cleanedText.split(/\s+/).length,
          characterCount: cleanedText.length
        },
        basicInfo,
        preview: cleanedText.substring(0, 200) + '...'
      };

    } catch (error) {
      console.error('Resume parsing error:', error.message);
      return {
        success: false,
        error: error.message,
        text: null,
        metadata: null
      };
    }
  }

  /**
   * Parse PDF files using pdf-parse
   * @param {string} filePath - Path to PDF file
   * @returns {Object} Extracted text and metadata
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      return {
        text: pdfData.text,
        metadata: {
          format: 'pdf',
          pages: pdfData.numpages,
          info: pdfData.info
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Parse DOC/DOCX files using mammoth
   * @param {string} filePath - Path to document file
   * @returns {Object} Extracted text and metadata
   */
  async parseDocument(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      return {
        text: result.value,
        metadata: {
          format: 'document',
          messages: result.messages
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  /**
   * Parse plain text files
   * @param {string} filePath - Path to text file
   * @returns {string} File content
   */
  async parseTextFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanExtractedText(text) {
    if (!text) return '';

    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep basic punctuation
      .replace(/[^\w\s\.\,\;\:\!\?\-\(\)\[\]]/g, ' ')
      // Remove multiple spaces
      .replace(/\s{2,}/g, ' ')
      // Trim whitespace
      .trim();
  }

  /**
   * Extract basic information from resume text
   * @param {string} text - Cleaned resume text
   * @returns {Object} Basic extracted information
   */
  extractBasicInfo(text) {
    const info = {
      name: null,
      email: null,
      phone: null,
      skills: [],
      experience: null,
      education: null
    };

    // Extract email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      info.email = emailMatch[0].toLowerCase();
    }

    // Extract phone number (Indian format)
    const phoneMatch = text.match(/(?:\+91|91)?[\s-]?[6-9]\d{9}/);
    if (phoneMatch) {
      info.phone = phoneMatch[0].replace(/\D/g, '');
    }

    // Extract potential name (first few words, usually at the beginning)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 50 && /^[A-Za-z\s]+$/.test(firstLine)) {
        info.name = firstLine;
      }
    }

    // Extract common skills keywords
    const skillKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
      'html', 'css', 'php', 'mysql', 'mongodb', 'git', 'docker',
      'aws', 'azure', 'photoshop', 'illustrator', 'figma', 'sketch',
      'marketing', 'seo', 'content writing', 'social media', 'excel',
      'powerpoint', 'word', 'data analysis', 'project management'
    ];

    const lowerText = text.toLowerCase();
    info.skills = skillKeywords.filter(skill => 
      lowerText.includes(skill.toLowerCase())
    );

    // Extract experience indicators
    const experiencePattern = /(\d+)[\s]*(?:year|yr)s?[\s]*(?:of\s*)?(?:experience|exp)/gi;
    const experienceMatch = text.match(experiencePattern);
    if (experienceMatch) {
      const yearMatch = experienceMatch[0].match(/\d+/);
      if (yearMatch) {
        info.experience = `${yearMatch[0]} years`;
      }
    }

    // Extract education keywords
    const educationKeywords = ['bachelor', 'master', 'phd', 'diploma', 'degree', 'engineering', 'mba', 'btech', 'bca', 'mca'];
    const foundEducation = educationKeywords.find(keyword => 
      lowerText.includes(keyword)
    );
    if (foundEducation) {
      info.education = foundEducation.charAt(0).toUpperCase() + foundEducation.slice(1);
    }

    return info;
  }

  /**
   * Validate file before processing
   * @param {Object} file - Multer file object
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push('File size exceeds 5MB limit');
    }

    // Check file format
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!this.supportedFormats.includes(fileExtension)) {
      errors.push(`Unsupported file format. Supported: ${this.supportedFormats.join(', ')}`);
    }

    // Check MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push('Invalid file type');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ResumeParser();