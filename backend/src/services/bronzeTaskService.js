const { prisma } = require('../config/database');

/**
 * Bronze Task Service - Business Support Focus
 * Handles specialized business operations tasks for SMEs
 */

class BronzeTaskService {
  constructor() {
    this.businessCategories = this.getBusinessSupportCategories();
  }

  /**
   * Get business support task categories
   * @returns {Array} List of business task categories
   */
  getBusinessSupportCategories() {
    return [
      {
        id: 'data-entry',
        name: 'Data Entry & Organization',
        description: 'Digital data input, spreadsheet management, and database organization',
        avgRate: 150,
        difficulty: 'beginner',
        skills: ['Typing', 'Excel', 'Attention to Detail', 'Data Accuracy'],
        taskTypes: [
          'Online form filling',
          'CRM data entry', 
          'Spreadsheet creation',
          'Document conversion (PDF to Word/Excel)',
          'Database cleaning and validation',
          'Contact list organization'
        ],
        businessContext: 'Essential for SMEs to maintain organized customer and business data',
        timeRange: '1-3 hours',
        payRange: '₹200-600'
      },
      {
        id: 'content-creation',
        name: 'Content & Communication',
        description: 'Business content writing, social media, and customer communication',
        avgRate: 200,
        difficulty: 'intermediate',
        skills: ['English Writing', 'Communication', 'Creativity', 'Social Media'],
        taskTypes: [
          'Product descriptions for e-commerce',
          'Social media posts and captions',
          'Email templates and newsletters',
          'Blog post writing',
          'WhatsApp Business messages',
          'Customer service responses'
        ],
        businessContext: 'Help SMEs maintain professional communication and online presence',
        timeRange: '1-3 hours',
        payRange: '₹300-800'
      },
      {
        id: 'customer-service',
        name: 'Customer Service & Research',
        description: 'Customer support, lead generation, and market research tasks',
        avgRate: 180,
        difficulty: 'intermediate',
        skills: ['Communication', 'Research', 'Customer Service', 'Phone/Chat'],
        taskTypes: [
          'Lead generation and contact research',
          'Customer inquiry responses',
          'Market research and surveys',
          'Competitor analysis',
          'Review and feedback management',
          'Call center support'
        ],
        businessContext: 'Support SME growth through customer engagement and market insights',
        timeRange: '2-4 hours',
        payRange: '₹300-1000'
      },
      {
        id: 'basic-design',
        name: 'Basic Design & Visual Content',
        description: 'Simple graphic design using tools like Canva for business needs',
        avgRate: 220,
        difficulty: 'beginner-intermediate',
        skills: ['Canva', 'Design Sense', 'Visual Communication', 'Brand Awareness'],
        taskTypes: [
          'Social media graphics using Canva',
          'Simple logo design',
          'Business card design',
          'Flyer and poster creation',
          'Product image editing',
          'Presentation slide design'
        ],
        businessContext: 'Help SMEs create professional visual content affordably',
        timeRange: '1-2 hours',
        payRange: '₹250-700'
      },
      {
        id: 'basic-finance',
        name: 'Basic Finance & Admin',
        description: 'Simple bookkeeping, invoicing, and administrative tasks',
        avgRate: 160,
        difficulty: 'beginner',
        skills: ['Basic Math', 'Excel', 'Attention to Detail', 'Organization'],
        taskTypes: [
          'Invoice creation and formatting',
          'Expense tracking in spreadsheets',
          'Basic bookkeeping data entry',
          'Receipt organization and digitization',
          'Payment follow-up lists',
          'Simple financial report formatting'
        ],
        businessContext: 'Support SME financial organization and compliance',
        timeRange: '1-2 hours',
        payRange: '₹200-500'
      },
      {
        id: 'research-analysis',
        name: 'Research & Analysis',
        description: 'Information gathering, competitor research, and basic analysis',
        avgRate: 190,
        difficulty: 'intermediate',
        skills: ['Internet Research', 'Analysis', 'Report Writing', 'Data Collection'],
        taskTypes: [
          'Competitor pricing research',
          'Market trend analysis',
          'Supplier/vendor research',
          'Industry report compilation',
          'Location-based business research',
          'Product research and comparison'
        ],
        businessContext: 'Provide SMEs with market intelligence for better decisions',
        timeRange: '2-4 hours',
        payRange: '₹400-1200'
      }
    ];
  }

  /**
   * Get filtered bronze tasks by category
   * @param {string} category - Task category
   * @param {Object} filters - Additional filters
   * @returns {Object} Filtered tasks
   */
  async getBronzeTasksByCategory(category, filters = {}) {
    try {
      const categoryInfo = this.businessCategories.find(cat => cat.id === category);
      if (!categoryInfo) {
        throw new Error('Invalid task category');
      }

      // Get tasks from database
      const where = {
        category: category.toUpperCase().replace('-', '_'),
        isActive: true
      };

      if (filters.maxBudget) {
        where.payAmount = { lte: parseFloat(filters.maxBudget) };
      }

      if (filters.difficulty) {
        where.difficulty = filters.difficulty;
      }

      if (filters.industry) {
        where.industry = filters.industry;
      }

      const tasks = await prisma.bronzeTask.findMany({
        where,
        include: {
          task: {
            include: {
              employer: {
                include: { user: { select: { name: true } } }
              },
              applications: { select: { id: true } }
            }
          },
          applications: { select: { id: true, status: true } }
        },
        orderBy: [
          { createdAt: 'desc' },
          { payAmount: 'desc' }
        ],
        take: filters.limit || 20
      });

      // Format for frontend
      const formattedTasks = tasks.map(bronzeTask => ({
        id: bronzeTask.id,
        title: bronzeTask.title,
        description: bronzeTask.description,
        category: categoryInfo.name,
        categoryId: category,
        payAmount: parseFloat(bronzeTask.payAmount),
        duration: bronzeTask.duration,
        difficulty: bronzeTask.difficulty,
        skillTags: bronzeTask.skillTags,
        industry: bronzeTask.industry,
        templates: bronzeTask.templates,
        instructionLanguage: bronzeTask.instructionLanguage,
        hasVoiceInstructions: bronzeTask.hasVoiceInstructions,
        recurring: bronzeTask.recurring,
        employer: {
          name: bronzeTask.task.employer.user.name,
          isVerified: bronzeTask.task.employer.isVerified
        },
        applicationCount: bronzeTask.applications.length,
        canApply: bronzeTask.applications.length < (bronzeTask.task.maxApplications || 10),
        createdAt: bronzeTask.createdAt,
        // Add business context
        businessValue: this.getBusinessValue(bronzeTask.category, bronzeTask.industry)
      }));

      return {
        success: true,
        data: {
          category: categoryInfo,
          tasks: formattedTasks,
          totalTasks: tasks.length,
          filters: {
            applied: filters,
            available: {
              difficulties: ['beginner', 'intermediate', 'advanced'],
              industries: ['ecommerce', 'retail', 'services', 'manufacturing', 'technology'],
              languages: ['english', 'hindi', 'both']
            }
          }
        }
      };

    } catch (error) {
      console.error('Get bronze tasks by category error:', error);
      return {
        success: false,
        error: 'Failed to fetch tasks',
        message: error.message
      };
    }
  }

  /**
   * Create bronze task template
   * @param {Object} taskData - Task data
   * @param {string} category - Category
   * @returns {Object} Created task
   */
  async createBronzeTask(taskData, category) {
    try {
      const categoryInfo = this.businessCategories.find(cat => cat.id === category);
      if (!categoryInfo) {
        throw new Error('Invalid business category');
      }

      // Create the main task first
      const mainTask = await prisma.task.create({
        data: {
          employerId: taskData.employerId,
          title: taskData.title,
          description: taskData.description,
          category: category,
          requiredBadge: 'BRONZE',
          estimatedHours: parseFloat(taskData.duration) / 60, // Convert minutes to hours
          hourlyRate: categoryInfo.avgRate,
          totalBudget: parseFloat(taskData.payAmount),
          requiredSkills: categoryInfo.skills,
          status: 'AVAILABLE'
        }
      });

      // Create the bronze task extension
      const bronzeTask = await prisma.bronzeTask.create({
        data: {
          taskId: mainTask.id,
          title: taskData.title,
          description: taskData.description,
          category: category.toUpperCase().replace('-', '_'),
          duration: parseInt(taskData.duration),
          payAmount: parseFloat(taskData.payAmount),
          difficulty: taskData.difficulty || categoryInfo.difficulty,
          skillTags: categoryInfo.skills,
          industry: taskData.industry || 'general',
          recurring: taskData.recurring || false,
          templates: taskData.templates || null,
          instructionLanguage: taskData.language || 'english',
          hasVoiceInstructions: taskData.hasVoiceInstructions || false
        }
      });

      return {
        success: true,
        data: {
          bronzeTask,
          mainTask,
          category: categoryInfo
        }
      };

    } catch (error) {
      console.error('Create bronze task error:', error);
      return {
        success: false,
        error: 'Failed to create bronze task',
        message: error.message
      };
    }
  }

  /**
   * Get business value explanation for task
   */
  getBusinessValue(category, industry) {
    const valueMap = {
      'DATA_ENTRY': {
        general: 'Organized data improves business efficiency and customer service',
        ecommerce: 'Clean product data increases sales and reduces customer complaints',
        retail: 'Accurate inventory data prevents stockouts and overstocking',
        services: 'Organized client data enables better service delivery'
      },
      'CONTENT_CREATION': {
        general: 'Professional content builds brand credibility and customer trust',
        ecommerce: 'Compelling product descriptions increase conversion rates',
        retail: 'Engaging content drives foot traffic and online engagement',
        services: 'Clear communication helps clients understand your value'
      },
      'CUSTOMER_SERVICE': {
        general: 'Great customer service builds loyalty and positive reviews',
        ecommerce: 'Quick responses reduce cart abandonment and increase sales',
        retail: 'Helpful service creates repeat customers and referrals',
        services: 'Professional support differentiates from competitors'
      }
    };

    return valueMap[category]?.[industry] || valueMap[category]?.general || 'Supports business growth and efficiency';
  }

  /**
   * Get task templates for category
   */
  getTaskTemplates(category) {
    const templates = {
      'data-entry': {
        'customer-database': {
          name: 'Customer Database Entry',
          description: 'Standard template for entering customer information',
          fields: ['Name', 'Phone', 'Email', 'Address', 'Purchase History'],
          sampleData: 'John Smith, 9876543210, john@email.com, Mumbai, ₹5,000',
          estimatedTime: '2-3 minutes per entry',
          qualityChecks: ['Verify phone number format', 'Validate email addresses', 'Check for duplicates']
        },
        'product-catalog': {
          name: 'Product Catalog Entry',
          description: 'Template for e-commerce product data entry',
          fields: ['Product Name', 'SKU', 'Price', 'Category', 'Description', 'Stock'],
          sampleData: 'iPhone 13, IP13-128, ₹65,000, Electronics, Latest smartphone, 25',
          estimatedTime: '3-4 minutes per product',
          qualityChecks: ['Verify pricing', 'Check category accuracy', 'Ensure complete descriptions']
        }
      },
      'content-creation': {
        'product-descriptions': {
          name: 'E-commerce Product Descriptions',
          description: 'Template for writing compelling product descriptions',
          structure: ['Key Features', 'Benefits', 'Specifications', 'Call-to-Action'],
          sampleContent: 'Premium quality [product] with [key feature]. Perfect for [target audience]. Specifications: [specs]. Order now for fast delivery!',
          estimatedTime: '10-15 minutes per description',
          qualityChecks: ['Include all product features', 'Use persuasive language', 'Check grammar and spelling']
        },
        'social-media-posts': {
          name: 'Social Media Content',
          description: 'Template for business social media posts',
          structure: ['Hook', 'Value/Information', 'Call-to-Action', 'Hashtags'],
          sampleContent: '🌟 [Attention-grabbing statement] - [Valuable information] - [Action prompt] #business #growth',
          estimatedTime: '5-10 minutes per post',
          qualityChecks: ['Engaging opening', 'Clear value proposition', 'Appropriate hashtags']
        }
      }
    };

    return templates[category] || {};
  }

  /**
   * Get skill development path for bronze workers
   */
  getSkillDevelopmentPath(category, currentLevel = 'beginner') {
    const skillPaths = {
      'data-entry': {
        beginner: {
          currentSkills: ['Basic Typing', 'Form Filling'],
          nextSkills: ['Excel Basics', 'Data Validation', 'Keyboard Shortcuts'],
          recommendedTasks: ['Simple form entry', 'Contact list creation'],
          learningResources: [
            'Excel basics tutorial',
            'Typing speed improvement',
            'Data accuracy best practices'
          ],
          progressionTime: '2-3 weeks'
        },
        intermediate: {
          currentSkills: ['Excel Proficiency', 'Data Validation', 'Quality Control'],
          nextSkills: ['Advanced Excel', 'Database Management', 'Process Automation'],
          recommendedTasks: ['CRM data entry', 'Database cleaning', 'Report generation'],
          learningResources: [
            'Advanced Excel functions',
            'Database concepts',
            'Quality assurance methods'
          ],
          progressionTime: '1-2 months'
        }
      },
      'content-creation': {
        beginner: {
          currentSkills: ['Basic Writing', 'Grammar'],
          nextSkills: ['SEO Writing', 'Brand Voice', 'Social Media'],
          recommendedTasks: ['Product descriptions', 'Social media captions'],
          learningResources: [
            'Content writing basics',
            'SEO fundamentals',
            'Brand voice guidelines'
          ],
          progressionTime: '3-4 weeks'
        }
      }
    };

    return skillPaths[category]?.[currentLevel] || null;
  }

  /**
   * Get success metrics for bronze tasks
   */
  async getSuccessMetrics(workerId, category = null) {
    try {
      const where = { workerId };
      if (category) {
        where.bronzeTask = { category: category.toUpperCase().replace('-', '_') };
      }

      const applications = await prisma.bronzeTaskApplication.findMany({
        where,
        include: {
          bronzeTask: { select: { category: true, payAmount: true, duration: true } }
        }
      });

      const metrics = {
        totalApplications: applications.length,
        completedTasks: applications.filter(app => app.status === 'COMPLETED').length,
        totalEarnings: applications
          .filter(app => app.status === 'COMPLETED')
          .reduce((sum, app) => sum + parseFloat(app.bronzeTask.payAmount || 0), 0),
        averageTaskTime: 0,
        categoryBreakdown: {},
        completionRate: 0,
        recommendedImprovement: []
      };

      if (metrics.totalApplications > 0) {
        metrics.completionRate = (metrics.completedTasks / metrics.totalApplications) * 100;
      }

      // Category breakdown
      applications.forEach(app => {
        const category = app.bronzeTask.category.toLowerCase().replace('_', '-');
        if (!metrics.categoryBreakdown[category]) {
          metrics.categoryBreakdown[category] = { applied: 0, completed: 0, earnings: 0 };
        }
        metrics.categoryBreakdown[category].applied++;
        if (app.status === 'COMPLETED') {
          metrics.categoryBreakdown[category].completed++;
          metrics.categoryBreakdown[category].earnings += parseFloat(app.bronzeTask.payAmount || 0);
        }
      });

      // Recommendations
      if (metrics.completionRate < 70) {
        metrics.recommendedImprovement.push('Focus on task quality to improve completion rate');
      }
      if (metrics.totalEarnings < 1000) {
        metrics.recommendedImprovement.push('Take on more tasks to increase monthly earnings');
      }

      return {
        success: true,
        data: metrics
      };

    } catch (error) {
      console.error('Get success metrics error:', error);
      return {
        success: false,
        error: 'Failed to fetch metrics',
        message: error.message
      };
    }
  }
}

module.exports = new BronzeTaskService(); 