/**
 * Basic Worker Registration Controller
 * Simplified registration with basic info + Aadhar verification
 */

const { prisma } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

/**
 * Register Worker with Basic Information + DigiLocker Verification
 * POST /api/basic-workers/register-basic
 */
const registerBasicWorker = async (req, res) => {
  try {
    console.log('📝 Basic worker registration started');
    console.log('Request body:', req.body);
    console.log('Request files:', req.file);

    const {
      name,
      phone,
      email,
      city,
      state,
      pincode,
      dateOfBirth,
      tempUserId,
      isDigiLockerVerified,
      verificationSkipped,
      password,
      confirmPassword,
      skills = [],
      experienceLevel = 'FRESHER',
      preferredCategories = []
    } = req.body;

    // Handle aadhaarNumber which might come as array or string
    let aadhaarNumber = req.body.aadhaarNumber;
    if (Array.isArray(aadhaarNumber)) {
      aadhaarNumber = aadhaarNumber.find(num => num && num.trim()) || '';
    }
    aadhaarNumber = aadhaarNumber ? aadhaarNumber.toString().trim() : '';

    // Validation
    if (!name || !phone || !city || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, phone, city, and state are required'
      });
    }

    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number',
        message: 'Please enter a valid 10-digit Indian mobile number'
      });
    }

    // Handle different verification scenarios
    let verifiedAadhaarNumber = null;
    let isIdVerified = false;
    let idDocumentUrl = null;
    let verificationMethod = 'pending';

    if (isDigiLockerVerified === 'true' && tempUserId) {
      // DigiLocker verification path
      const digilockerVerification = await prisma.digilockerVerification.findUnique({
        where: { userId: tempUserId },
        select: {
          aadhaarNumber: true,
          isVerified: true,
          verifiedName: true
        }
      });

      if (!digilockerVerification || !digilockerVerification.isVerified) {
        return res.status(400).json({
          success: false,
          error: 'DigiLocker verification failed',
          message: 'DigiLocker verification not found or incomplete'
        });
      }

      verifiedAadhaarNumber = digilockerVerification.aadhaarNumber;
      isIdVerified = true;
      verificationMethod = 'digilocker';
      
    } else if (req.file) {
      // Manual document upload path
      verifiedAadhaarNumber = aadhaarNumber || null;
      isIdVerified = false; // Requires manual verification
      idDocumentUrl = `/uploads/id-documents/${req.file.filename}`;
      verificationMethod = 'manual_upload';
      
    } else if (aadhaarNumber && verificationSkipped !== 'true') {
      // Manual Aadhaar number entry (requires verification later)
      verifiedAadhaarNumber = aadhaarNumber;
      isIdVerified = false;
      verificationMethod = 'manual_entry';
      
    } else if (verificationSkipped === 'true') {
      // Verification skipped - can complete registration but with limited features
      verifiedAadhaarNumber = aadhaarNumber || null;
      isIdVerified = false;
      verificationMethod = 'skipped';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Verification required',
        message: 'Please complete Aadhaar verification, provide manual details, or skip for now'
      });
    }

    // Check if phone number already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already registered',
        message: 'A user with this phone number already exists'
      });
    }

    // Validate and hash password if provided
    let hashedPassword = null;
    let passwordSet = false;
    
    if (password) {
      // Password validation
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Invalid password',
          message: 'Password must be at least 8 characters long'
        });
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid password',
          message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Password mismatch',
          message: 'Password and confirm password do not match'
        });
      }

      // Check if email already exists (required for password login)
      if (email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() }
        });

        if (existingEmail) {
          return res.status(400).json({
            success: false,
            error: 'Email already exists',
            message: 'This email is already registered with another account'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Email required',
          message: 'Email is required when setting up a password'
        });
      }

      // Hash password
      try {
        const saltRounds = 12;
        hashedPassword = await bcrypt.hash(password, saltRounds);
        passwordSet = true;
        console.log('✅ Password hashed successfully');
      } catch (hashError) {
        console.error('❌ Password hashing failed:', hashError);
        return res.status(500).json({
          success: false,
          error: 'Password processing failed',
          message: 'Unable to process password. Please try again.'
        });
      }
    }

    // Check if Aadhaar number already exists (only if we have a verified number and it's not empty)
    if (verifiedAadhaarNumber && verifiedAadhaarNumber.length >= 10) {
      const existingAadhaar = await prisma.$queryRaw`
        SELECT w.id FROM workers w 
        WHERE w."idDocumentNumber" = ${verifiedAadhaarNumber}
        LIMIT 1
      `;

      if (existingAadhaar && existingAadhaar.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Aadhaar already registered',
          message: 'This Aadhaar number is already registered with another account'
        });
      }
    }

    // Create user and worker in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create base user
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          email: email ? email.trim().toLowerCase() : null,
          userType: 'WORKER',
          password: hashedPassword,
          passwordSet: passwordSet,
          lastPasswordChange: passwordSet ? new Date() : null
        }
      });

      // Create worker profile with appropriate verification status
      const worker = await tx.worker.create({
        data: {
          userId: user.id,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode ? pincode.trim() : null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          idDocumentType: 'AADHAR',
          idDocumentNumber: (verifiedAadhaarNumber && verifiedAadhaarNumber.length >= 10) ? verifiedAadhaarNumber.trim() : null,
          idDocumentUrl: idDocumentUrl,
          isIdVerified: isIdVerified,
          idVerifiedAt: isIdVerified ? new Date() : null,
          skills: Array.isArray(skills) ? skills : [],
          experienceLevel,
          registrationMethod: 'BASIC_INFO',
          preferredCategories: Array.isArray(preferredCategories) ? preferredCategories : [],
          isPhoneVerified: true,
          isKYCCompleted: isIdVerified,
          verificationMethod: verificationMethod
        }
      });

      return { user, worker };
    });

    console.log('✅ Basic worker registration completed:', {
      userId: result.user.id,
      workerId: result.worker.id,
      name: result.user.name,
      aadhaarVerified: result.worker.isIdVerified,
      verificationMethod: verificationMethod
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Worker registration completed successfully',
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
          email: result.user.email,
          userType: result.user.userType
        },
        worker: {
          id: result.worker.id,
          city: result.worker.city,
          state: result.worker.state,
          pincode: result.worker.pincode,
          idDocumentType: result.worker.idDocumentType,
          aadhaarNumber: result.worker.idDocumentNumber ? 
            `${result.worker.idDocumentNumber.slice(0, 4)}****${result.worker.idDocumentNumber.slice(-4)}` : null,
          isIdVerified: result.worker.isIdVerified,
          verificationMethod: verificationMethod,
          skills: result.worker.skills,
          experienceLevel: result.worker.experienceLevel,
          preferredCategories: result.worker.preferredCategories,
          categoryBadges: [], // Empty initially
          canApplyToFreeTasks: true
        },
        nextSteps: verificationMethod === 'digilocker' ? [
          'Your Aadhaar has been verified successfully through DigiLocker',
          'You can start applying to free tasks to earn your first badges',
          'Complete your profile by adding more skills and preferences',
          'Start building your reputation by completing tasks'
        ] : verificationMethod === 'skipped' ? [
          'Registration completed! You can browse and apply to tasks',
          'Complete Aadhaar verification later to unlock badge earning',
          'Add more skills and preferences to improve your profile',
          'Note: Some premium features require identity verification'
        ] : [
          'Registration completed! Your identity verification is pending',
          'You can browse tasks while we verify your documents',
          'Complete verification to unlock all features and badge earning',
          'Add more skills and preferences to improve your profile'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Basic worker registration error:', error);
    
    // Clean up uploaded file if registration failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'Unable to complete registration. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message,
        stack: error.stack 
      })
    });
  }
};

/**
 * Get Worker Profile with Category Badges
 * GET /api/workers/:id/profile
 */
const getWorkerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            createdAt: true
          }
        },
        categoryBadges: {
          orderBy: { earnedAt: 'desc' }
        },
        bronzeTaskApplications: {
          where: { status: 'COMPLETED' },
          include: {
            bronzeTask: {
              select: {
                id: true,
                title: true,
                category: true,
                payAmount: true,
                createdAt: true
              }
            }
          },
          orderBy: { appliedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: 'Worker not found',
        message: 'No worker found with this ID'
      });
    }

    // Calculate stats
    const stats = {
      totalTasksCompleted: worker.bronzeTaskApplications.length,
      totalEarnings: worker.totalEarnings,
      categoryBadgeCount: worker.categoryBadges.length,
      averageRating: worker.averageRating || 0,
      joinedDate: worker.user.createdAt
    };

    // Format category badges
    const categoryBadges = worker.categoryBadges.map(badge => ({
      id: badge.id,
      category: badge.category,
      badgeLevel: badge.badgeLevel,
      earnedAt: badge.earnedAt,
      earnedBy: badge.earnedBy,
      tasksCompleted: badge.tasksCompleted,
      averageRating: badge.averageRating,
      totalEarnings: badge.totalEarnings
    }));

    return res.json({
      success: true,
      data: {
        worker: {
          id: worker.id,
          userId: worker.userId,
          name: worker.user.name,
          phone: worker.user.phone,
          email: worker.user.email,
          city: worker.city,
          state: worker.state,
          pincode: worker.pincode,
          idDocumentType: worker.idDocumentType,
          isIdVerified: worker.isIdVerified,
          skills: worker.skills,
          experienceLevel: worker.experienceLevel,
          preferredCategories: worker.preferredCategories,
          registrationMethod: worker.registrationMethod,
          createdAt: worker.createdAt
        },
        categoryBadges,
        recentCompletedTasks: worker.bronzeTaskApplications,
        stats
      }
    });

  } catch (error) {
    console.error('❌ Get worker profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: 'Unable to retrieve worker profile'
    });
  }
};

/**
 * Get Available Categories for Badge Earning
 * GET /api/workers/badge-categories
 */
const getBadgeCategories = async (req, res) => {
  try {
    const categories = [
      {
        id: 'DATA_ENTRY',
        name: 'Data Entry & Organization',
        description: 'Excel data entry, form filling, database management',
        skills: ['Excel', 'Google Sheets', 'Data Entry', 'Typing'],
        averageEarning: '₹150/hour',
        difficulty: 'Beginner',
        examples: ['Product catalog entry', 'Invoice data entry', 'Contact list management']
      },
      {
        id: 'CONTENT_CREATION',
        name: 'Content & Communication',
        description: 'Writing, social media content, basic graphic design',
        skills: ['Writing', 'Social Media', 'Canva', 'Content Planning'],
        averageEarning: '₹200/hour',
        difficulty: 'Beginner to Intermediate',
        examples: ['Social media posts', 'Product descriptions', 'Blog articles']
      },
      {
        id: 'CUSTOMER_SERVICE',
        name: 'Customer Service & Support',
        description: 'Chat support, email management, customer queries',
        skills: ['Communication', 'Email Management', 'Customer Support'],
        averageEarning: '₹180/hour',
        difficulty: 'Beginner',
        examples: ['Live chat support', 'Email responses', 'Order assistance']
      },
      {
        id: 'RESEARCH',
        name: 'Research & Analysis',
        description: 'Market research, lead generation, data collection',
        skills: ['Internet Research', 'Data Collection', 'Analysis'],
        averageEarning: '₹160/hour',
        difficulty: 'Beginner to Intermediate',
        examples: ['Company research', 'Lead generation', 'Price comparison']
      },
      {
        id: 'BASIC_DESIGN',
        name: 'Basic Design & Visual Content',
        description: 'Simple graphics, presentations, basic design work',
        skills: ['Canva', 'PowerPoint', 'Basic Design', 'Visual Content'],
        averageEarning: '₹220/hour',
        difficulty: 'Intermediate',
        examples: ['Social media graphics', 'Presentations', 'Simple logos']
      },
      {
        id: 'BASIC_FINANCE',
        name: 'Basic Finance & Admin',
        description: 'Invoice creation, basic bookkeeping, administrative tasks',
        skills: ['Excel', 'Invoicing', 'Basic Accounting', 'Administration'],
        averageEarning: '₹170/hour',
        difficulty: 'Beginner to Intermediate',
        examples: ['Invoice creation', 'Expense tracking', 'Payment follow-up']
      }
    ];

    return res.json({
      success: true,
      data: {
        categories,
        badgeSystem: {
          levels: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
          earning: {
            bronze: 'Complete free tasks or 1-2 regular tasks with good ratings',
            silver: 'Complete 5+ tasks with 4.5+ average rating',
            gold: 'Complete 15+ tasks with 4.7+ average rating',
            platinum: 'Complete 30+ tasks with 4.8+ average rating + mentor status'
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Get badge categories error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: 'Unable to retrieve badge categories'
    });
  }
};

/**
 * Update Worker Profile
 * PUT /api/workers/:id/profile
 */
const updateWorkerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Only allow certain fields to be updated
    const allowedUpdates = [
      'skills',
      'experienceLevel',
      'preferredCategories',
      'city',
      'state',
      'pincode',
      'estimatedHourlyRate',
      'workingHoursStart',
      'workingHoursEnd',
      'upiId',
      'bankName'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: filteredUpdates,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        categoryBadges: true
      }
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        worker: updatedWorker
      }
    });

  } catch (error) {
    console.error('❌ Update worker profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Update failed',
      message: 'Unable to update worker profile'
    });
  }
};

module.exports = {
  registerBasicWorker,
  getWorkerProfile,
  getBadgeCategories,
  updateWorkerProfile
};