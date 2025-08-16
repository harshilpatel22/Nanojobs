const aiService = require('./aiService');
const { prisma } = require('../config/database');

/**
 * Task Matching Service
 * Handles AI-powered task analysis, badge assignment, and worker-task matching
 * 
 * Core responsibilities:
 * - Analyze task descriptions and assign required badge levels
 * - Match workers with suitable tasks based on their badges
 * - Provide task recommendations and filtering logic
 * - Calculate match scores between workers and tasks
 */

class TaskMatchingService {
  
  /**
   * Analyze a task and assign appropriate badge level using AI
   * @param {Object} taskData - Task information from employer
   * @returns {Object} Enhanced task data with AI analysis
   */
  async analyzeAndEnhanceTask(taskData) {
    try {
      console.log('🔍 Starting task analysis for:', taskData.title);
      
      // Basic validation
      if (!taskData.title || !taskData.description) {
        throw new Error('Task title and description are required for analysis');
      }

      // Prepare data for AI analysis
      const analysisInput = {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        category: taskData.category || 'general',
        hourlyRate: parseFloat(taskData.hourlyRate) || 150,
        estimatedHours: parseFloat(taskData.estimatedHours) || 2,
        requiredSkills: Array.isArray(taskData.requiredSkills) ? taskData.requiredSkills : []
      };

      // Get AI analysis
      const aiAnalysis = await aiService.analyzeTaskDescription(analysisInput);
      
      // Enhanced task data with AI insights
      const enhancedTask = {
        ...taskData,
        
        // AI-determined badge requirement
        requiredBadge: aiAnalysis.requiredBadge,
        
        // AI analysis metadata
        aiAnalyzed: true,
        aiConfidence: aiAnalysis.confidence,
        aiSkillsExtracted: aiAnalysis.extractedSkills || [],
        aiComplexityScore: aiAnalysis.complexityScore,
        aiTimeEstimate: aiAnalysis.timeEstimate,
        aiSuggestedRate: aiAnalysis.suggestedRate,
        
        // Enhanced fields based on AI analysis
        requiredSkills: this.mergeSkills(taskData.requiredSkills, aiAnalysis.extractedSkills),
        estimatedHours: aiAnalysis.timeEstimate || parseFloat(taskData.estimatedHours),
        
        // Badge-based recommendations
        badgeJustification: aiAnalysis.badgeReason,
        rateJustification: aiAnalysis.rateJustification,
        qualityRequirements: aiAnalysis.qualityRequirements || [],
        
        // Processing metadata
        analyzedAt: new Date().toISOString(),
        analysisVersion: aiAnalysis.version || '1.0',
        analysisSource: aiAnalysis.source
      };

      console.log(`✅ Task analysis completed: ${aiAnalysis.requiredBadge} badge required`);
      
      return enhancedTask;

    } catch (error) {
      console.error('❌ Task analysis failed:', error.message);
      
      // Return task with fallback analysis
      return this.getFallbackTaskAnalysis(taskData);
    }
  }

  /**
   * Get eligible workers for a task based on badge requirements
   * @param {Object} task - Task with required badge level
   * @param {Object} options - Filtering options
   * @returns {Array} List of eligible workers with match scores
   */
  async getEligibleWorkers(task, options = {}) {
    try {
      const { limit = 50, includeMatchScore = true } = options;
      
      // Determine eligible badge levels
      const eligibleBadges = this.getEligibleBadges(task.requiredBadge);
      
      console.log(`🔍 Finding workers with badges: ${eligibleBadges.join(', ')}`);
      
      // Query eligible workers
      const workers = await prisma.worker.findMany({
        where: {
          badge: { in: eligibleBadges },
          availability: 'available',
          user: { isActive: true }
        },
        include: {
          user: {
            select: { name: true, phone: true, email: true }
          }
        },
        take: limit,
        orderBy: [
          { badge: 'desc' }, // Higher badges first
          { averageRating: 'desc' }, // Better rated workers first
          { tasksCompleted: 'desc' } // More experienced workers first
        ]
      });

      // Calculate match scores if requested
      if (includeMatchScore) {
        const workersWithScores = workers.map(worker => ({
          ...worker,
          matchScore: this.calculateMatchScore(worker, task),
          matchReasons: this.getMatchReasons(worker, task)
        }));

        // Sort by match score
        workersWithScores.sort((a, b) => b.matchScore - a.matchScore);
        
        console.log(`✅ Found ${workersWithScores.length} eligible workers`);
        return workersWithScores;
      }

      console.log(`✅ Found ${workers.length} eligible workers`);
      return workers;

    } catch (error) {
      console.error('❌ Error finding eligible workers:', error);
      return [];
    }
  }

  /**
   * Get tasks that a worker can apply for based on their badge
   * @param {Object} worker - Worker with badge level
   * @param {Object} filters - Additional filters
   * @returns {Array} Filtered list of tasks
   */
  async getTasksForWorker(worker, filters = {}) {
    try {
      const { category, urgency, maxBudget, limit = 20 } = filters;
      
      // Determine which badges this worker can handle
      const accessibleBadges = this.getAccessibleBadges(worker.badge);
      
      console.log(`🔍 Finding tasks for ${worker.badge} worker: ${accessibleBadges.join(', ')} level tasks`);
      
      // Build query conditions
      const where = {
        status: 'AVAILABLE',
        requiredBadge: { in: accessibleBadges }
      };

      // Apply additional filters
      if (category) {
        where.category = category;
      }
      
      if (urgency) {
        where.urgency = urgency;
      }
      
      if (maxBudget) {
        where.totalBudget = { lte: parseFloat(maxBudget) };
      }

      // Query tasks
      const tasks = await prisma.task.findMany({
        where,
        include: {
          employer: {
            include: { user: { select: { name: true } } }
          },
          applications: {
            where: { workerId: worker.id },
            select: { id: true, status: true, appliedAt: true }
          }
        },
        orderBy: [
          { urgency: 'desc' }, // Urgent tasks first
          { createdAt: 'desc' } // Newer tasks first
        ],
        take: limit
      });

      // Add compatibility scores and filter out already applied tasks
      const compatibleTasks = tasks
        .filter(task => task.applications.length === 0) // Not already applied
        .map(task => ({
          ...task,
          compatibilityScore: this.calculateTaskCompatibility(worker, task),
          workerCanApply: true,
          badgeMatch: task.requiredBadge === worker.badge ? 'perfect' : 'qualified'
        }))
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      console.log(`✅ Found ${compatibleTasks.length} compatible tasks`);
      return compatibleTasks;

    } catch (error) {
      console.error('❌ Error finding tasks for worker:', error);
      return [];
    }
  }

  /**
   * Calculate match score between worker and task (0-100)
   * @param {Object} worker - Worker profile
   * @param {Object} task - Task details
   * @returns {number} Match score
   */
  calculateMatchScore(worker, task) {
    let score = 0;
    
    // Badge compatibility (40 points max)
    if (worker.badge === task.requiredBadge) {
      score += 40; // Perfect match
    } else if (this.canWorkerHandleTask(worker.badge, task.requiredBadge)) {
      score += 30; // Can handle but not perfect
    }

    // Skill matching (25 points max)
    const skillMatch = this.calculateSkillMatch(worker.skills, task.requiredSkills);
    score += skillMatch * 25;

    // Category preference (15 points max)
    if (worker.preferredCategories.includes(task.category)) {
      score += 15;
    }

    // Experience and rating (20 points max)
    if (worker.averageRating) {
      score += (parseFloat(worker.averageRating) / 5) * 10; // Up to 10 points for rating
    }
    
    if (worker.tasksCompleted > 0) {
      score += Math.min(worker.tasksCompleted / 10, 1) * 10; // Up to 10 points for experience
    }

    return Math.round(Math.min(score, 100));
  }

  /**
   * Calculate compatibility score between worker and task
   * @param {Object} worker - Worker profile
   * @param {Object} task - Task details
   * @returns {number} Compatibility score (0-100)
   */
  calculateTaskCompatibility(worker, task) {
    let score = 0;

    // Badge level compatibility (50 points)
    if (worker.badge === task.requiredBadge) {
      score += 50;
    } else if (this.canWorkerHandleTask(worker.badge, task.requiredBadge)) {
      score += 35;
    }

    // Skill matching (30 points)
    const skillMatch = this.calculateSkillMatch(worker.skills, task.requiredSkills);
    score += skillMatch * 30;

    // Category preference (20 points)
    if (worker.preferredCategories.includes(task.category)) {
      score += 20;
    }

    return Math.round(score);
  }

  /**
   * Calculate skill matching percentage
   * @param {Array} workerSkills - Worker's skills
   * @param {Array} taskSkills - Required task skills
   * @returns {number} Match percentage (0-1)
   */
  calculateSkillMatch(workerSkills, taskSkills) {
    if (!taskSkills || taskSkills.length === 0) return 0.5; // Neutral if no specific skills required
    if (!workerSkills || workerSkills.length === 0) return 0;

    const workerSkillsLower = workerSkills.map(s => s.toLowerCase());
    const taskSkillsLower = taskSkills.map(s => s.toLowerCase());
    
    let matches = 0;
    taskSkillsLower.forEach(taskSkill => {
      if (workerSkillsLower.some(workerSkill => 
        workerSkill.includes(taskSkill) || taskSkill.includes(workerSkill)
      )) {
        matches++;
      }
    });

    return matches / taskSkillsLower.length;
  }

  /**
   * Get reasons why a worker matches a task
   * @param {Object} worker - Worker profile
   * @param {Object} task - Task details
   * @returns {Array} List of match reasons
   */
  getMatchReasons(worker, task) {
    const reasons = [];

    // Badge compatibility
    if (worker.badge === task.requiredBadge) {
      reasons.push(`Perfect badge match: ${worker.badge} level`);
    } else if (this.canWorkerHandleTask(worker.badge, task.requiredBadge)) {
      reasons.push(`Qualified for ${task.requiredBadge} level tasks`);
    }

    // Skill matching
    const commonSkills = this.getCommonSkills(worker.skills, task.requiredSkills);
    if (commonSkills.length > 0) {
      reasons.push(`Matching skills: ${commonSkills.join(', ')}`);
    }

    // Category preference
    if (worker.preferredCategories.includes(task.category)) {
      reasons.push(`Preferred category: ${task.category}`);
    }

    // Experience
    if (worker.tasksCompleted > 0) {
      reasons.push(`${worker.tasksCompleted} tasks completed`);
    }

    // Rating
    if (worker.averageRating && worker.averageRating >= 4) {
      reasons.push(`High rating: ${worker.averageRating}/5`);
    }

    return reasons;
  }

  /**
   * Get badges that can access tasks of a specific badge level
   * @param {string} requiredBadge - Required badge level
   * @returns {Array} List of eligible badges
   */
  getEligibleBadges(requiredBadge) {
    const badgeHierarchy = {
      'BRONZE': ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      'SILVER': ['SILVER', 'GOLD', 'PLATINUM'],
      'GOLD': ['GOLD', 'PLATINUM'],
      'PLATINUM': ['PLATINUM']
    };

    return badgeHierarchy[requiredBadge] || ['BRONZE'];
  }

  /**
   * Get task badge levels that a worker can access
   * @param {string} workerBadge - Worker's badge level
   * @returns {Array} Accessible badge levels
   */
  getAccessibleBadges(workerBadge) {
    const accessMatrix = {
      'BRONZE': ['BRONZE'],
      'SILVER': ['BRONZE', 'SILVER'],
      'GOLD': ['BRONZE', 'SILVER', 'GOLD'],
      'PLATINUM': ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
    };

    return accessMatrix[workerBadge] || ['BRONZE'];
  }

  /**
   * Check if a worker can handle a task based on badge levels
   * @param {string} workerBadge - Worker's current badge
   * @param {string} taskBadge - Task's required badge
   * @returns {boolean} Whether worker can handle the task
   */
  canWorkerHandleTask(workerBadge, taskBadge) {
    const badgeValues = { 'BRONZE': 1, 'SILVER': 2, 'GOLD': 3, 'PLATINUM': 4 };
    return badgeValues[workerBadge] >= badgeValues[taskBadge];
  }

  /**
   * Merge user-provided skills with AI-extracted skills
   * @param {Array} userSkills - Skills provided by user
   * @param {Array} aiSkills - Skills extracted by AI
   * @returns {Array} Merged unique skills
   */
  mergeSkills(userSkills = [], aiSkills = []) {
    const allSkills = [...(userSkills || []), ...(aiSkills || [])];
    const uniqueSkills = [...new Set(allSkills.map(skill => skill.trim()))];
    return uniqueSkills.filter(skill => skill.length > 0).slice(0, 10); // Limit to 10 skills
  }

  /**
   * Find common skills between worker and task
   * @param {Array} workerSkills - Worker's skills
   * @param {Array} taskSkills - Task's required skills
   * @returns {Array} Common skills
   */
  getCommonSkills(workerSkills = [], taskSkills = []) {
    const workerSkillsLower = workerSkills.map(s => s.toLowerCase());
    const taskSkillsLower = taskSkills.map(s => s.toLowerCase());
    
    return taskSkills.filter(taskSkill => 
      workerSkillsLower.some(workerSkill => 
        workerSkill.toLowerCase().includes(taskSkill.toLowerCase()) ||
        taskSkill.toLowerCase().includes(workerSkill.toLowerCase())
      )
    );
  }

  /**
   * Fallback task analysis when AI fails
   * @param {Object} taskData - Original task data
   * @returns {Object} Task with basic analysis
   */
  getFallbackTaskAnalysis(taskData) {
    console.log('🔄 Using fallback task analysis');
    
    const hourlyRate = parseFloat(taskData.hourlyRate) || 150;
    const estimatedHours = parseFloat(taskData.estimatedHours) || 2;
    
    // Simple rule-based badge assignment
    let requiredBadge = 'BRONZE';
    let complexityScore = 3;
    
    if (hourlyRate >= 400 || estimatedHours >= 8) {
      requiredBadge = 'GOLD';
      complexityScore = 7;
    } else if (hourlyRate >= 250 || estimatedHours >= 4) {
      requiredBadge = 'SILVER';
      complexityScore = 5;
    }

    return {
      ...taskData,
      requiredBadge,
      aiAnalyzed: false,
      aiConfidence: 60,
      aiSkillsExtracted: [],
      aiComplexityScore: complexityScore,
      aiTimeEstimate: estimatedHours,
      aiSuggestedRate: Math.max(hourlyRate, 150),
      badgeJustification: `Fallback analysis based on rate (₹${hourlyRate}/hr) and time (${estimatedHours}h)`,
      rateJustification: 'Based on market standards',
      qualityRequirements: ['Basic quality standards'],
      analyzedAt: new Date().toISOString(),
      analysisVersion: '1.0-fallback',
      analysisSource: 'fallback_rules'
    };
  }

  /**
   * Get task categories with their badge distribution
   * @returns {Object} Categories with statistics
   */
  async getTaskCategoryStats() {
    try {
      const stats = await prisma.task.groupBy({
        by: ['category', 'requiredBadge'],
        where: { status: 'AVAILABLE' },
        _count: { _all: true }
      });

      const categoryStats = {};
      
      stats.forEach(stat => {
        if (!categoryStats[stat.category]) {
          categoryStats[stat.category] = {
            total: 0,
            byBadge: { BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0 }
          };
        }
        
        categoryStats[stat.category].total += stat._count._all;
        categoryStats[stat.category].byBadge[stat.requiredBadge] = stat._count._all;
      });

      return categoryStats;

    } catch (error) {
      console.error('Error getting category stats:', error);
      return {};
    }
  }

  /**
   * Get matching statistics for reporting
   * @returns {Object} Overall matching statistics
   */
  async getMatchingStats() {
    try {
      const [totalTasks, totalWorkers, applications] = await Promise.all([
        prisma.task.count({ where: { status: 'AVAILABLE' } }),
        prisma.worker.count({ where: { availability: 'available' } }),
        prisma.taskApplication.count()
      ]);

      return {
        totalActiveTasks: totalTasks,
        totalAvailableWorkers: totalWorkers,
        totalApplications: applications,
        avgApplicationsPerTask: totalTasks > 0 ? (applications / totalTasks).toFixed(1) : 0,
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting matching stats:', error);
      return { error: 'Unable to fetch statistics' };
    }
  }
}

module.exports = new TaskMatchingService();