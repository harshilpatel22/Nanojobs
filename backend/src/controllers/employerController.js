const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { prisma, withTransaction } = require('../config/database');

/**
 * Employer Controller
 * Handles employer registration, profile management, and verification
 */

/**
 * Generate JWT session token for employer
 * @param {Object} userData - User data for token
 */
const generateEmployerSessionToken = (userData) => {
  try {
    const payload = {
      userId: userData.userId,
      phone: userData.phone,
      userType: 'employer',
      employerId: userData.employerId,
      sessionId: uuidv4(),
      iat: Math.floor(Date.now() / 1000)
    };
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    
    return jwt.sign(payload, jwtSecret, { 
      expiresIn: '30d',
      issuer: 'nanojobs',
      audience: 'nanojobs-users'
    });
  } catch (error) {
    console.error('❌ Employer JWT generation failed:', error);
    throw new Error('Failed to generate session token');
  }
};

class EmployerController {
  
  /**
   * Register new employer
   * POST /api/employers/register
   */
  // Fix for employerController.js - Convert enum values to match database schema

// Replace the registerEmployer method in your employerController.js:

async registerEmployer(req, res) {
    try {
      const {
        name,
        phone,
        email,
        employerType,
        companyName,
        website,
        description,
        businessCategory,
        expectedTaskVolume,
        password,
        confirmPassword
      } = req.body;
      
      console.log('🏢 Employer registration attempt:', { name, phone, employerType, businessCategory });
      
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phone },
            ...(email ? [{ email: email }] : [])
          ]
        }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
          message: 'A user with this phone number or email already exists'
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

        // Email is required for password login
        if (!email) {
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
          console.log('✅ Employer password hashed successfully');
        } catch (hashError) {
          console.error('❌ Employer password hashing failed:', hashError);
          return res.status(500).json({
            success: false,
            error: 'Password processing failed',
            message: 'Unable to process password. Please try again.'
          });
        }
      }
      
      const convertUserType = (type) => {
        return 'EMPLOYER'; // Always return EMPLOYER for employer registration
      };
      // Convert frontend enum values to database enum values
      const convertEmployerType = (type) => {
        const mapping = {
          'individual': 'INDIVIDUAL',
          'small_business': 'SMALL_BUSINESS', 
          'company': 'COMPANY'
        };
        return mapping[type] || 'INDIVIDUAL';
      };
  
      const convertVerificationStatus = (status) => {
        const mapping = {
          'pending': 'PENDING',
          'verified': 'VERIFIED',
          'rejected': 'REJECTED'
        };
        return mapping[status] || 'PENDING';
      };
  
      // Create user and employer in database transaction
      const result = await withTransaction(async (prisma) => {
        // Create user
        const user = await prisma.user.create({
          data: {
            name: name.trim(),
            phone: phone.trim(),
            email: email ? email.trim().toLowerCase() : null,
            userType: convertUserType('employer'), // This should be 'EMPLOYER' but check your enum
            password: hashedPassword,
            passwordSet: passwordSet,
            lastPasswordChange: passwordSet ? new Date() : null
          }
        });
  
        // Create employer profile with converted enum values
        const employer = await prisma.employer.create({
          data: {
            userId: user.id,
            employerType: convertEmployerType(employerType), // Convert to uppercase
            companyName: companyName ? companyName.trim() : null,
            website: website ? website.trim() : null,
            description: description ? description.trim() : null,
            businessCategory: businessCategory || 'other',
            expectedTaskVolume: expectedTaskVolume || 'low',
            isVerified: false,
            verificationStatus: convertVerificationStatus('pending'), // Convert to uppercase
            tasksPosted: 0,
            totalSpent: 0.00,
            averageRating: null
          }
        });
  
        // Generate JWT session token
        const sessionToken = generateEmployerSessionToken({
          userId: user.id,
          phone: user.phone,
          employerId: employer.id
        });

        // Create initial session
        const session = await prisma.session.create({
          data: {
            userId: user.id,
            token: sessionToken,
            isActive: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            lastUsed: new Date(),
            metadata: {
              registeredAt: new Date().toISOString(),
              employerType: employerType,
              userAgent: 'employer-registration'
            }
          }
        });
  
        return { user, employer, session };
      });
      
      console.log(`✅ Employer registered successfully: ${name} (${employerType})`);
      
      // Return success response
      res.status(201).json({
        success: true,
        message: 'Employer registered successfully',
        data: {
          employer: {
            id: result.employer.id,
            name: result.user.name,
            phone: result.user.phone,
            email: result.user.email,
            employerType: result.employer.employerType,
            companyName: result.employer.companyName,
            website: result.employer.website,
            description: result.employer.description,
            businessCategory: result.employer.businessCategory,
            expectedTaskVolume: result.employer.expectedTaskVolume,
            isVerified: result.employer.isVerified,
            verificationStatus: result.employer.verificationStatus,
            createdAt: result.user.createdAt
          },
          sessionToken: result.session.token,
          nextSteps: {
            verificationRequired: !result.employer.isVerified,
            canPostTasks: result.employer.isVerified,
            verificationMessage: 'Complete your profile verification to start posting tasks'
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Employer registration error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: 'An error occurred during registration. Please try again.'
      });
    }
  }

  /**
   * Get employer profile by ID
   * GET /api/employers/:id
   */
  async getEmployerProfile(req, res) {
    try {
      const { id } = req.params;
      
      console.log('🔍 Getting employer profile:', id);
      
      const employer = await prisma.employer.findUnique({
        where: { id },
        include: {
          user: true,
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              applications: {
                include: {
                  worker: {
                    include: { user: true }
                  }
                }
              }
            }
          },
          // Include rating information
          ratingsReceived: {
            include: {
              task: { select: { title: true, category: true } },
              workerRater: {
                include: { user: { select: { name: true } } }
              }
            },
            orderBy: { ratedAt: 'desc' },
            take: 10
          }
        }
      });
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          error: 'Employer not found',
          message: 'No employer found with the provided ID'
        });
      }
      
      // Update last access time
      await prisma.session.updateMany({
        where: { 
          userId: employer.userId,
          isActive: true 
        },
        data: { lastUsed: new Date() }
      });
      
      // Calculate statistics
      const stats = {
        tasksPosted: employer.tasksPosted || 0,
        activeTasks: employer.tasks.filter(t => t.status === 'AVAILABLE').length,
        completedTasks: employer.tasks.filter(t => t.status === 'COMPLETED').length,
        totalApplications: employer.tasks.reduce((sum, task) => sum + task.applications.length, 0),
        totalSpent: parseFloat(employer.totalSpent || '0'),
        averageRating: employer.averageRating ? parseFloat(employer.averageRating) : 0
      };

      res.json({
        success: true,
        data: {
          employer: {
            id: employer.id,
            name: employer.user.name,
            phone: employer.user.phone,
            email: employer.user.email,
            employerType: employer.employerType,
            companyName: employer.companyName,
            website: employer.website,
            description: employer.description,
            businessCategory: employer.businessCategory,
            expectedTaskVolume: employer.expectedTaskVolume,
            isVerified: employer.isVerified,
            verificationStatus: employer.verificationStatus,
            stats,
            // Rating information
            rating: {
              averageRating: employer.averageRating ? parseFloat(employer.averageRating) : null,
              totalRatings: employer.ratingsReceived?.length || 0,
              ratingDistribution: employer.ratingsReceived ? 
                employer.ratingsReceived.reduce((acc, rating) => {
                  if (rating.stars >= 1 && rating.stars <= 5) {
                    acc[rating.stars] = (acc[rating.stars] || 0) + 1;
                  }
                  return acc;
                }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }) : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              recentRatings: employer.ratingsReceived?.slice(0, 5).map(rating => ({
                stars: rating.stars,
                taskTitle: rating.task.title,
                taskCategory: rating.task.category,
                workerName: rating.workerRater?.user.name,
                ratedAt: rating.ratedAt
              })) || [],
              isNewUser: !employer.ratingsReceived || employer.ratingsReceived.length === 0
            },
            recentTasks: employer.tasks.slice(0, 5).map(task => ({
              id: task.id,
              title: task.title,
              status: task.status,
              applications: task.applications.length,
              createdAt: task.createdAt
            })),
            createdAt: employer.createdAt
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Get employer profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile',
        message: 'An error occurred while fetching the employer profile'
      });
    }
  }
  
  /**
   * Update employer profile
   * PUT /api/employers/:id
   */
  async updateEmployerProfile(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      console.log('🔄 Updating employer profile:', id, updates);
      
      const employer = await prisma.employer.findUnique({
        where: { id },
        include: { user: true }
      });
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          error: 'Employer not found'
        });
      }
      
      // Prepare update data
      const employerUpdates = {};
      const userUpdates = {};
      
      // User fields
      if (updates.name !== undefined) {
        userUpdates.name = updates.name;
      }
      if (updates.email !== undefined) {
        userUpdates.email = updates.email;
      }
      
      // Employer fields
      if (updates.companyName !== undefined) {
        employerUpdates.companyName = updates.companyName;
      }
      if (updates.website !== undefined) {
        employerUpdates.website = updates.website;
      }
      if (updates.description !== undefined) {
        employerUpdates.description = updates.description;
      }
      if (updates.businessCategory !== undefined) {
        employerUpdates.businessCategory = updates.businessCategory;
      }
      if (updates.expectedTaskVolume !== undefined) {
        employerUpdates.expectedTaskVolume = updates.expectedTaskVolume;
      }
      
      // Update in transaction
      const result = await withTransaction(async (prisma) => {
        const updatedEmployer = await prisma.employer.update({
          where: { id },
          data: employerUpdates,
          include: { user: true }
        });
        
        if (Object.keys(userUpdates).length > 0) {
          await prisma.user.update({
            where: { id: employer.userId },
            data: userUpdates
          });
        }
        
        return updatedEmployer;
      });
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          employer: {
            id: result.id,
            name: result.user.name,
            email: result.user.email,
            companyName: result.companyName,
            website: result.website,
            description: result.description,
            businessCategory: result.businessCategory,
            expectedTaskVolume: result.expectedTaskVolume,
            updatedAt: result.updatedAt
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Update employer profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Update failed',
        message: 'An error occurred while updating the profile'
      });
    }
  }

  /**
   * Verify employer (admin function)
   * POST /api/employers/:id/verify
   */
  async verifyEmployer(req, res) {
    try {
      const { id } = req.params;
      const { verified, verificationNote } = req.body;
      
      console.log('🔍 Verifying employer:', id, { verified, verificationNote });
      
      const employer = await prisma.employer.update({
        where: { id },
        data: {
          isVerified: verified,
          verificationStatus: verified ? 'verified' : 'rejected',
          verificationNote: verificationNote || null,
          verifiedAt: verified ? new Date() : null
        },
        include: { user: true }
      });
      
      res.json({
        success: true,
        message: `Employer ${verified ? 'verified' : 'rejected'} successfully`,
        data: {
          employer: {
            id: employer.id,
            name: employer.user.name,
            isVerified: employer.isVerified,
            verificationStatus: employer.verificationStatus,
            verifiedAt: employer.verifiedAt
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Verify employer error:', error);
      res.status(500).json({
        success: false,
        error: 'Verification failed',
        message: 'An error occurred during verification'
      });
    }
  }

  /**
   * Get all employers (admin endpoint)
   * GET /api/employers
   */
  async getAllEmployers(req, res) {
    try {
      const { page = 1, limit = 10, verified, category } = req.query;
      
      const where = {};
      
      if (verified !== undefined) {
        where.isVerified = verified === 'true';
      }
      
      if (category) {
        where.businessCategory = category;
      }
      
      const [employers, total] = await Promise.all([
        prisma.employer.findMany({
          where,
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
                isActive: true,
                createdAt: true
              }
            },
            _count: {
              select: { tasks: true }
            }
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.employer.count({ where })
      ]);
      
      res.json({
        success: true,
        data: {
          employers: employers.map(employer => ({
            id: employer.id,
            name: employer.user.name,
            companyName: employer.companyName,
            employerType: employer.employerType,
            businessCategory: employer.businessCategory,
            isVerified: employer.isVerified,
            verificationStatus: employer.verificationStatus,
            tasksPosted: employer._count.tasks,
            totalSpent: parseFloat(employer.totalSpent || '0'),
            createdAt: employer.createdAt,
            status: employer.user.isActive ? 'active' : 'inactive'
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalEmployers: total,
            hasNext: parseInt(page) * parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Get all employers error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch employers'
      });
    }
  }

  /**
   * Get employer dashboard stats
   * GET /api/employers/:id/stats
   */
  async getEmployerStats(req, res) {
    try {
      const { id } = req.params;
      
      const employer = await prisma.employer.findUnique({
        where: { id },
        include: {
          tasks: {
            include: {
              applications: true
            }
          }
        }
      });
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          error: 'Employer not found'
        });
      }
      
      // Calculate comprehensive stats
      const stats = {
        overview: {
          tasksPosted: employer.tasks.length,
          activeTasks: employer.tasks.filter(t => t.status === 'AVAILABLE').length,
          inProgressTasks: employer.tasks.filter(t => t.status === 'IN_PROGRESS').length,
          completedTasks: employer.tasks.filter(t => t.status === 'COMPLETED').length,
          totalApplications: employer.tasks.reduce((sum, task) => sum + task.applications.length, 0)
        },
        financial: {
          totalSpent: parseFloat(employer.totalSpent || '0'),
          averageTaskBudget: employer.tasks.length > 0 
            ? employer.tasks.reduce((sum, task) => sum + parseFloat(task.totalBudget), 0) / employer.tasks.length 
            : 0,
          pendingPayments: employer.tasks
            .filter(t => t.status === 'COMPLETED')
            .reduce((sum, task) => sum + parseFloat(task.totalBudget), 0),
        },
        performance: {
          averageRating: employer.averageRating ? parseFloat(employer.averageRating) : 0,
          responseTime: '< 24 hours', // Can be calculated from application response times
          completionRate: employer.tasks.length > 0 
            ? (employer.tasks.filter(t => t.status === 'COMPLETED').length / employer.tasks.length) * 100 
            : 0
        },
        recent: {
          weeklyTasks: employer.tasks.filter(t => 
            new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
          monthlyTasks: employer.tasks.filter(t => 
            new Date(t.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length
        }
      };
      
      res.json({
        success: true,
        data: { stats }
      });
      
    } catch (error) {
      console.error('❌ Get employer stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }
}

module.exports = new EmployerController();