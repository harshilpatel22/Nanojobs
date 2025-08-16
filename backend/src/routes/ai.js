const express = require('express');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * AI Routes
 * Handles AI-powered features like resume analysis and skill assessment
 */

/**
 * Validation middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Analyze resume text and assign badge
 * POST /api/ai/analyze-resume
 */
router.post('/analyze-resume',
  [
    body('resumeText')
      .notEmpty()
      .withMessage('Resume text is required')
      .isLength({ min: 50 })
      .withMessage('Resume text must be at least 50 characters'),
    body('workerName')
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Worker name must be between 2 and 50 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { resumeText, workerName = 'Candidate' } = req.body;

      console.log(`Analyzing resume for: ${workerName}`);
      
      // Call AI service to analyze resume
      const analysis = await aiService.analyzeResumeAndAssignBadge(
        resumeText,
        workerName
      );

      // Get badge display information
      const badgeDisplayInfo = aiService.getBadgeDisplayInfo(analysis.badge);

      res.json({
        success: true,
        message: 'Resume analyzed successfully',
        data: {
          analysis,
          badgeInfo: badgeDisplayInfo,
          recommendations: {
            nextSteps: [
              'Complete your profile setup',
              'Browse available tasks',
              'Start with simple tasks to build your reputation'
            ],
            skillImprovement: analysis.strengths || [],
            taskCategories: analysis.recommendedTasks || []
          }
        }
      });

    } catch (error) {
      console.error('Resume analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Analysis failed',
        message: 'Unable to analyze resume. Please try again.',
        fallback: {
          badge: 'BRONZE',
          badgeReason: 'Default assignment due to analysis error',
          skills: ['General Skills'],
          estimatedHourlyRate: 120
        }
      });
    }
  }
);

/**
 * Get skill assessment questions (for workers without resume)
 * GET /api/ai/skill-assessment-questions
 */
router.get('/skill-assessment-questions', (req, res) => {
  try {
    const { category } = req.query;

    // Generate skill assessment questions based on category
    const baseQuestions = [
      {
        id: 1,
        type: 'multiple-choice',
        question: 'How would you rate your overall work experience?',
        options: [
          { value: 'fresher', label: 'I am a fresher with no work experience', points: 1 },
          { value: 'entry', label: 'Less than 1 year of experience', points: 2 },
          { value: 'junior', label: '1-3 years of experience', points: 3 },
          { value: 'experienced', label: '3-7 years of experience', points: 4 },
          { value: 'senior', label: '7+ years of experience', points: 5 }
        ],
        required: true
      },
      {
        id: 2,
        type: 'multiple-choice',
        question: 'What is your highest level of education?',
        options: [
          { value: 'school', label: '10th/12th Standard', points: 1 },
          { value: 'diploma', label: 'Diploma/Certificate Course', points: 2 },
          { value: 'bachelor', label: 'Bachelor\'s Degree', points: 3 },
          { value: 'master', label: 'Master\'s Degree', points: 4 },
          { value: 'phd', label: 'PhD or higher', points: 5 }
        ],
        required: true
      },
      {
        id: 3,
        type: 'multiple-select',
        question: 'Which of these skills do you have? (Select all that apply)',
        options: [
          { value: 'excel', label: 'Microsoft Excel', points: 2 },
          { value: 'word', label: 'Microsoft Word', points: 1 },
          { value: 'powerpoint', label: 'PowerPoint', points: 2 },
          { value: 'email', label: 'Email Communication', points: 1 },
          { value: 'data-entry', label: 'Data Entry', points: 2 },
          { value: 'research', label: 'Internet Research', points: 2 },
          { value: 'customer-service', label: 'Customer Service', points: 3 },
          { value: 'writing', label: 'Content Writing', points: 3 }
        ],
        required: false
      },
      {
        id: 4,
        type: 'multiple-choice',
        question: 'How comfortable are you with learning new technologies/tools?',
        options: [
          { value: 'uncomfortable', label: 'I prefer familiar tools only', points: 1 },
          { value: 'somewhat', label: 'I can learn with guidance', points: 2 },
          { value: 'comfortable', label: 'I enjoy learning new tools', points: 3 },
          { value: 'very-comfortable', label: 'I quickly adapt to new technologies', points: 4 },
          { value: 'expert', label: 'I\'m always exploring cutting-edge tools', points: 5 }
        ],
        required: true
      },
      {
        id: 5,
        type: 'multiple-choice',
        question: 'How many hours per day can you dedicate to tasks?',
        options: [
          { value: '1-2', label: '1-2 hours per day', points: 1 },
          { value: '3-4', label: '3-4 hours per day', points: 2 },
          { value: '5-6', label: '5-6 hours per day', points: 3 },
          { value: '7-8', label: '7-8 hours per day', points: 4 },
          { value: '8+', label: 'More than 8 hours per day', points: 3 }
        ],
        required: true
      }
    ];

    res.json({
      success: true,
      data: {
        questions: baseQuestions,
        totalQuestions: baseQuestions.length,
        estimatedTime: '5-7 minutes',
        instructions: [
          'Answer all questions honestly',
          'Your responses will help us assign the right badge level',
          'There are no wrong answers - we want to match you with suitable tasks'
        ]
      }
    });

  } catch (error) {
    console.error('Get assessment questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

/**
 * Evaluate skill assessment answers
 * POST /api/ai/evaluate-skill-assessment
 */
router.post('/evaluate-skill-assessment',
  [
    body('answers')
      .isArray()
      .withMessage('Answers must be an array'),
    body('workerName')
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Worker name must be between 2 and 50 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { answers, workerName = 'Worker' } = req.body;

      // Calculate total score from answers
      let totalScore = 0;
      const skills = [];
      let experienceLevel = 'FRESHER';

      answers.forEach(answer => {
        if (answer.type === 'multiple-choice') {
          totalScore += answer.points || 0;
        } else if (answer.type === 'multiple-select') {
          // For multi-select, add points for each selected option
          if (Array.isArray(answer.selectedOptions)) {
            answer.selectedOptions.forEach(option => {
              totalScore += option.points || 0;
              if (option.label) skills.push(option.label);
            });
          }
        }

        // Determine experience level from specific question
        if (answer.questionId === 1) {
          const experienceLevels = {
            'fresher': 'FRESHER',
            'entry': 'FRESHER',
            'junior': 'JUNIOR',
            'experienced': 'EXPERIENCED',
            'senior': 'SENIOR'
          };
          experienceLevel = experienceLevels[answer.value] || 'FRESHER';
        }
      });

      // Determine badge based on total score
      let badge = 'BRONZE';
      let estimatedHourlyRate = 120;
      let badgeReason = '';

      if (totalScore <= 8) {
        badge = 'BRONZE';
        estimatedHourlyRate = 120;
        badgeReason = 'Good foundation to start with basic tasks';
      } else if (totalScore <= 15) {
        badge = 'SILVER';
        estimatedHourlyRate = 250;
        badgeReason = 'Solid skills and experience for intermediate tasks';
      } else if (totalScore <= 22) {
        badge = 'GOLD';
        estimatedHourlyRate = 400;
        badgeReason = 'Advanced skills suitable for complex tasks';
      } else {
        badge = 'PLATINUM';
        estimatedHourlyRate = 500;
        badgeReason = 'Expert-level capabilities for premium tasks';
      }

      // Recommend task categories based on skills and badge
      const taskRecommendations = [];
      if (badge === 'BRONZE') {
        taskRecommendations.push('Data Entry', 'Virtual Assistant');
      } else if (badge === 'SILVER') {
        taskRecommendations.push('Content Writing', 'Customer Support', 'Research');
      } else if (badge === 'GOLD') {
        taskRecommendations.push('Digital Marketing', 'Graphic Design', 'Project Management');
      } else {
        taskRecommendations.push('Web Development', 'Consulting', 'Strategy');
      }

      const analysis = {
        badge,
        badgeReason,
        skills: skills.length > 0 ? skills : ['General Skills', 'Communication'],
        experienceLevel,
        strengths: skills.slice(0, 3),
        recommendedTasks: taskRecommendations,
        estimatedHourlyRate,
        confidence: Math.min(90, 60 + (totalScore * 2)),
        analyzedAt: new Date().toISOString(),
        source: 'skill_assessment',
        assessmentScore: totalScore
      };

      // Get badge display information
      const badgeDisplayInfo = aiService.getBadgeDisplayInfo(badge);

      res.json({
        success: true,
        message: 'Skill assessment completed successfully',
        data: {
          analysis,
          badgeInfo: badgeDisplayInfo,
          assessmentSummary: {
            totalScore,
            maxPossibleScore: 30,
            questionsAnswered: answers.length,
            completionTime: '5 minutes' // Could be calculated from timestamps
          },
          nextSteps: [
            'Complete your profile setup',
            'Browse recommended task categories',
            'Start with tasks matching your skill level'
          ]
        }
      });

    } catch (error) {
      console.error('Skill assessment evaluation error:', error);
      res.status(500).json({
        success: false,
        error: 'Assessment evaluation failed',
        message: 'Unable to evaluate assessment. Please try again.'
      });
    }
  }
);

/**
 * Get badge information
 * GET /api/ai/badge-info/:badge
 */
router.get('/badge-info/:badge', (req, res) => {
  try {
    const { badge } = req.params;
    
    const validBadges = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    if (!validBadges.includes(badge.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid badge level'
      });
    }

    const badgeInfo = aiService.getBadgeDisplayInfo(badge.toUpperCase());
    
    res.json({
      success: true,
      data: { badgeInfo }
    });

  } catch (error) {
    console.error('Get badge info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch badge information'
    });
  }
});

/**
 * Test AI service connection
 * GET /api/ai/test-connection
 */
router.get('/test-connection', async (req, res) => {
  try {
    // Test with minimal resume text
    const testText = "John Doe, Software Engineer with 3 years experience in JavaScript and React development.";
    
    const analysis = await aiService.analyzeResumeAndAssignBadge(testText, 'Test User');
    
    res.json({
      success: true,
      message: 'AI service connection successful',
      data: {
        serviceStatus: 'connected',
        testAnalysis: {
          badge: analysis.badge,
          confidence: analysis.confidence,
          source: analysis.source
        }
      }
    });

  } catch (error) {
    console.error('AI connection test error:', error);
    res.status(500).json({
      success: false,
      error: 'AI service connection failed',
      message: error.message,
      troubleshooting: [
        'Check if CLAUDE_API_KEY is set in environment variables',
        'Verify API key is valid and has sufficient credits',
        'Check network connectivity to Claude API'
      ]
    });
  }
});

module.exports = router;