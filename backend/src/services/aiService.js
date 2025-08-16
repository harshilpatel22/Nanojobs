const axios = require('axios');

/**
 * Enhanced AI Service for Claude API Integration
 * Handles resume analysis, quiz evaluation, skill badge assignment, AND TASK ANALYSIS
 * 
 * NEW FOR PHASE 3: Task description analysis and badge assignment
 */
class AIService {
  constructor() {
    this.claudeApiKey = process.env.CLAUDE_API_KEY;
    this.claudeApiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
    
    if (!this.claudeApiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is required');
    }
  }

  // ========== EXISTING METHODS (Resume & Quiz Analysis) ==========
  
  /**
   * Analyze resume content and assign appropriate skill badge
   */
  async analyzeResumeAndAssignBadge(resumeText, workerName = 'Candidate') {
    try {
      const prompt = this.buildResumeAnalysisPrompt(resumeText, workerName);
      
      const response = await axios.post(
        this.claudeApiUrl,
        {
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const analysis = this.parseClaudeResponse(response.data.content[0].text);
      return analysis;

    } catch (error) {
      console.error('Claude API Error:', error.response?.data || error.message);
      return this.getFallbackAnalysis(resumeText);
    }
  }

  /**
   * Evaluate skill assessment quiz using Claude AI
   */
  async evaluateSkillAssessment(answers, workerName = 'Candidate') {
    try {
      const prompt = this.buildQuizEvaluationPrompt(answers, workerName);
      
      const response = await axios.post(
        this.claudeApiUrl,
        {
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const evaluation = this.parseQuizEvaluationResponse(response.data.content[0].text);
      return evaluation;

    } catch (error) {
      console.error('Claude Quiz Evaluation Error:', error.response?.data || error.message);
      return this.getFallbackQuizEvaluation(answers, workerName);
    }
  }

  // ========== NEW FOR PHASE 3: TASK ANALYSIS METHODS ==========

  /**
   * Analyze task description and assign required badge level
   * @param {Object} taskData - Task information
   * @returns {Object} Task analysis with badge assignment
   */
  async analyzeTaskDescription(taskData) {
    try {
      const { title, description, category, hourlyRate, estimatedHours, requiredSkills = [] } = taskData;
      
      console.log('🤖 Analyzing task with AI:', title);
      
      const prompt = this.buildTaskAnalysisPrompt({
        title,
        description,
        category,
        hourlyRate,
        estimatedHours,
        requiredSkills
      });
      
      const response = await axios.post(
        this.claudeApiUrl,
        {
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const analysis = this.parseTaskAnalysisResponse(response.data.content[0].text);
      console.log('✅ Task analysis completed:', analysis.requiredBadge);
      
      return analysis;

    } catch (error) {
      console.error('❌ Task analysis error:', error.response?.data || error.message);
      return this.getFallbackTaskAnalysis(taskData);
    }
  }

  /**
   * Extract required skills from task description
   * @param {string} description - Task description
   * @returns {Array} List of required skills
   */
  async extractRequiredSkills(description) {
    try {
      const prompt = `
Analyze this task description and extract the specific skills required:

TASK DESCRIPTION:
${description}

Extract only the specific technical and professional skills needed. Return as a JSON array of strings.

SKILL CATEGORIES TO CONSIDER:
- Technical skills (programming languages, software, tools)
- Design skills (graphic design, UI/UX, video editing)
- Writing skills (content writing, copywriting, translation)
- Marketing skills (SEO, social media, advertising)
- Administrative skills (data entry, virtual assistance)
- Communication skills (customer service, communication)
- Analysis skills (research, data analysis)

Return ONLY a JSON array like: ["skill1", "skill2", "skill3"]
Maximum 8 skills. Be specific and relevant.
`;

      const response = await axios.post(
        this.claudeApiUrl,
        {
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const skillsText = response.data.content[0].text;
      const skillsMatch = skillsText.match(/\[[\s\S]*\]/);
      
      if (skillsMatch) {
        const skills = JSON.parse(skillsMatch[0]);
        return Array.isArray(skills) ? skills.slice(0, 8) : [];
      }
      
      return [];

    } catch (error) {
      console.error('Skill extraction error:', error);
      return this.extractSkillsFromKeywords(description);
    }
  }

  /**
   * Suggest improvements for task description
   * @param {Object} taskData - Current task data
   * @returns {Object} Suggestions for improvement
   */
  async suggestTaskImprovements(taskData) {
    try {
      const { title, description, hourlyRate, estimatedHours } = taskData;
      
      const prompt = `
Analyze this task posting and suggest improvements to attract better workers:

CURRENT TASK:
Title: ${title}
Description: ${description}
Hourly Rate: ₹${hourlyRate}
Estimated Hours: ${estimatedHours}

Provide suggestions in JSON format:
{
  "titleSuggestions": ["improved title 1", "improved title 2"],
  "descriptionImprovements": [
    "Add more specific requirements",
    "Clarify deliverables expected"
  ],
  "rateRecommendation": {
    "suggested": 250,
    "reason": "Rate seems low for required skills"
  },
  "clarity": {
    "score": 7,
    "improvements": ["Be more specific about timeline", "Add examples"]
  }
}

Focus on clarity, completeness, and attractiveness to skilled workers.
`;

      const response = await axios.post(
        this.claudeApiUrl,
        {
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const suggestionsText = response.data.content[0].text;
      const jsonMatch = suggestionsText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { message: 'No specific improvements suggested' };

    } catch (error) {
      console.error('Task improvement suggestion error:', error);
      return { message: 'Unable to analyze task for improvements' };
    }
  }

  // ========== PROMPT BUILDERS FOR TASK ANALYSIS ==========

  /**
   * Build structured prompt for task analysis
   */
  buildTaskAnalysisPrompt(taskData) {
    const { title, description, category, hourlyRate, estimatedHours, requiredSkills } = taskData;
    
    return `
Analyze this task posting for the NanoJobs platform and determine the required worker badge level.

TASK DETAILS:
Title: ${title}
Description: ${description}
Category: ${category}
Hourly Rate: ₹${hourlyRate}
Estimated Hours: ${estimatedHours}
Mentioned Skills: ${requiredSkills.join(', ') || 'None specified'}

TASK: Analyze the task complexity and provide a JSON response:

{
  "requiredBadge": "BRONZE|SILVER|GOLD|PLATINUM",
  "badgeReason": "Detailed explanation for badge requirement",
  "complexityScore": 5,
  "extractedSkills": ["skill1", "skill2", "skill3"],
  "timeEstimate": 3.5,
  "suggestedRate": 250,
  "rateJustification": "Explanation for rate suggestion",
  "taskCategory": "refined_category",
  "urgencyLevel": "normal",
  "qualityRequirements": ["attention to detail", "quick turnaround"],
  "confidence": 85
}

BADGE ASSIGNMENT CRITERIA:
- BRONZE (₹100-150/hr): Basic tasks requiring minimal experience
  * Simple data entry, basic research, simple admin tasks
  * 1-2 hours work, clear instructions, minimal decision-making
  * Fresh graduates or beginners can handle

- SILVER (₹200-300/hr): Skilled tasks requiring specific knowledge
  * Content writing, social media management, basic design
  * 2-4 hours work, some problem-solving required
  * 1-3 years experience or specific training needed

- GOLD (₹350-450/hr): Expert tasks requiring advanced skills
  * Web development, advanced design, complex analysis
  * 4-8 hours work, significant problem-solving
  * 3+ years experience and proven expertise required

- PLATINUM (₹500+/hr): Master-level tasks requiring specialization
  * Strategic consulting, system architecture, complex projects
  * 8+ hours work, high-level thinking and leadership
  * Senior expert with 7+ years and specialized expertise

ANALYSIS FACTORS:
1. Technical complexity and skill requirements
2. Decision-making and problem-solving needs
3. Experience level required for quality completion
4. Time pressure and deadline sensitivity
5. Impact on employer's business/project
6. Quality and precision requirements
7. Independence and leadership needed

TASK CATEGORIES:
- data-entry: Basic data input and management
- content-writing: Writing, editing, copywriting
- virtual-assistant: Administrative and support tasks
- graphic-design: Visual design and creative work
- web-development: Programming and development
- digital-marketing: Marketing and promotion activities
- research: Information gathering and analysis
- customer-support: Communication and support
- translation: Language translation services
- video-editing: Video production and editing

Return ONLY the JSON response, no additional text.
`;
  }

  // ========== RESPONSE PARSERS FOR TASK ANALYSIS ==========

  /**
   * Parse task analysis response from Claude
   */
  parseTaskAnalysisResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in task analysis response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and clean up response
      const validBadges = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
      if (!validBadges.includes(analysis.requiredBadge)) {
        analysis.requiredBadge = 'BRONZE';
      }

      // Ensure required fields exist
      analysis.complexityScore = Math.max(1, Math.min(10, analysis.complexityScore || 3));
      analysis.extractedSkills = Array.isArray(analysis.extractedSkills) ? analysis.extractedSkills : [];
      analysis.timeEstimate = Math.max(0.5, analysis.timeEstimate || 2);
      analysis.suggestedRate = Math.max(100, Math.min(1000, analysis.suggestedRate || 150));
      analysis.confidence = Math.max(50, Math.min(100, analysis.confidence || 75));
      
      // Add metadata
      analysis.analyzedAt = new Date().toISOString();
      analysis.source = 'claude_ai';
      analysis.version = '1.0';

      return analysis;

    } catch (error) {
      console.error('Error parsing task analysis response:', error.message);
      throw new Error('Failed to parse AI task analysis result');
    }
  }

  /**
   * Fallback task analysis when AI fails
   */
  getFallbackTaskAnalysis(taskData) {
    const { title, description, hourlyRate, estimatedHours } = taskData;
    
    let requiredBadge = 'BRONZE';
    let complexityScore = 3;
    
    // Simple rule-based fallback
    const descLower = description.toLowerCase();
    const titleLower = title.toLowerCase();
    
    if (hourlyRate >= 400 || estimatedHours >= 8) {
      requiredBadge = 'GOLD';
      complexityScore = 7;
    } else if (hourlyRate >= 250 || estimatedHours >= 4) {
      requiredBadge = 'SILVER';
      complexityScore = 5;
    } else if (/advanced|complex|expert|senior|lead|architect/.test(descLower + titleLower)) {
      requiredBadge = 'GOLD';
      complexityScore = 8;
    } else if (/experience|skill|professional|quality/.test(descLower + titleLower)) {
      requiredBadge = 'SILVER';
      complexityScore = 4;
    }

    return {
      requiredBadge,
      badgeReason: `Rule-based assignment based on rate (₹${hourlyRate}/hr) and estimated time (${estimatedHours}h)`,
      complexityScore,
      extractedSkills: this.extractSkillsFromKeywords(description),
      timeEstimate: estimatedHours,
      suggestedRate: Math.max(hourlyRate, this.getMinRateForBadge(requiredBadge)),
      rateJustification: 'Based on complexity assessment',
      taskCategory: taskData.category || 'general',
      urgencyLevel: 'normal',
      qualityRequirements: ['basic quality standards'],
      confidence: 60,
      analyzedAt: new Date().toISOString(),
      source: 'fallback_rules',
      version: '1.0'
    };
  }

  /**
   * Extract skills using keyword matching (fallback method)
   */
  extractSkillsFromKeywords(description) {
    const skillKeywords = {
      'JavaScript': /javascript|js|node\.?js|react|vue|angular/i,
      'Python': /python|django|flask|pandas/i,
      'Content Writing': /content|writing|blog|article|copywriting/i,
      'Graphic Design': /design|photoshop|illustrator|canva|graphics/i,
      'Data Entry': /data entry|typing|excel|spreadsheet/i,
      'Social Media': /social media|facebook|instagram|twitter|linkedin|marketing/i,
      'Customer Service': /customer|support|service|communication/i,
      'Research': /research|analysis|data collection|investigation/i,
      'Translation': /translat|language|hindi|english|multilingual/i,
      'Video Editing': /video|editing|premiere|after effects|multimedia/i
    };

    const extractedSkills = [];
    
    for (const [skill, pattern] of Object.entries(skillKeywords)) {
      if (pattern.test(description)) {
        extractedSkills.push(skill);
      }
    }

    return extractedSkills.slice(0, 6); // Limit to 6 skills max
  }

  /**
   * Get minimum rate for badge level
   */
  getMinRateForBadge(badge) {
    const minRates = {
      BRONZE: 100,
      SILVER: 200,
      GOLD: 350,
      PLATINUM: 500
    };
    return minRates[badge] || 100;
  }

  // ========== EXISTING METHODS (keeping all original functionality) ==========
  
  buildResumeAnalysisPrompt(resumeText, workerName) {
    return `
Analyze this resume for the NanoJobs platform and assign an appropriate skill badge level. 

RESUME CONTENT:
${resumeText}

WORKER NAME: ${workerName}

TASK: Analyze the resume and provide a JSON response with the following structure:

{
  "badge": "BRONZE|SILVER|GOLD|PLATINUM",
  "badgeReason": "Brief explanation for badge assignment",
  "skills": ["skill1", "skill2", "skill3"],
  "experienceLevel": "FRESHER|JUNIOR|EXPERIENCED|SENIOR",
  "strengths": ["strength1", "strength2"],
  "recommendedTasks": ["task_category1", "task_category2"],
  "estimatedHourlyRate": 150,
  "confidence": 85
}

BADGE CRITERIA:
- BRONZE (₹100-150/hr): Fresh graduates, basic skills, limited experience, data entry tasks
- SILVER (₹200-300/hr): 1-3 years experience, specific technical skills, moderate complexity tasks
- GOLD (₹350-450/hr): 3-7 years experience, advanced skills, leadership experience, complex tasks
- PLATINUM (₹500+/hr): 7+ years experience, expert-level skills, management experience, strategic tasks

AVAILABLE TASK CATEGORIES:
- Data Entry
- Content Writing
- Virtual Assistant
- Graphic Design
- Web Development
- Digital Marketing
- Translation
- Customer Support
- Research & Analysis
- Video Editing

Provide ONLY the JSON response, no additional text.
`;
  }

  buildQuizEvaluationPrompt(answers, workerName) {
    const formattedAnswers = answers.map(answer => {
      let answerText = `Q: ${answer.question}\n`;
      
      if (answer.type === 'single-choice') {
        answerText += `A: ${answer.selectedOption?.label || 'Not answered'}\n`;
      } else if (answer.type === 'multi-select') {
        const selected = answer.selectedOptions?.map(opt => opt.label).join(', ') || 'None selected';
        answerText += `A: ${selected}\n`;
      }
      
      return answerText;
    }).join('\n');

    return `
Analyze this skill assessment quiz for the NanoJobs platform and provide a comprehensive evaluation.

CANDIDATE: ${workerName}

QUIZ RESPONSES:
${formattedAnswers}

TASK: Evaluate the quiz responses and provide a JSON response with the following structure:

{
  "badge": "BRONZE|SILVER|GOLD|PLATINUM",
  "badgeReason": "Detailed explanation for badge assignment based on responses",
  "experienceLevel": "FRESHER|JUNIOR|EXPERIENCED|SENIOR",
  "estimatedHourlyRate": 200,
  "strengths": ["strength1", "strength2", "strength3"],
  "recommendedTasks": ["task_category1", "task_category2"],
  "confidence": 85,
  "source": "claude_ai"
}

EVALUATION CRITERIA:
- BRONZE (₹100-150/hr): Fresh graduates, basic skills, learning mindset, 1-2 hours availability
- SILVER (₹200-300/hr): Some experience, specific technical skills, good communication, 3-4 hours availability
- GOLD (₹350-450/hr): Solid experience, advanced skills, excellent problem-solving, 5+ hours availability
- PLATINUM (₹500+/hr): Expert level, leadership qualities, strategic thinking, full-time availability

TASK CATEGORIES TO CONSIDER:
- data-entry: Basic data input and management
- content-writing: Writing and editing tasks
- virtual-assistant: Administrative support
- graphic-design: Visual design and creativity
- web-development: Programming and development
- digital-marketing: Marketing and promotion
- research: Information gathering and analysis
- customer-support: Communication and support

ANALYSIS FOCUS:
1. Experience level and educational background
2. Technical skills and proficiencies
3. Learning ability and adaptability
4. Time availability and commitment
5. Problem-solving approach
6. Communication skills
7. Work preferences and motivation
8. Quality orientation

Provide ONLY the JSON response, no additional text.
`;
  }

  parseClaudeResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const requiredFields = ['badge', 'badgeReason', 'skills', 'experienceLevel', 'estimatedHourlyRate'];
      for (const field of requiredFields) {
        if (!analysis[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate badge level
      const validBadges = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
      if (!validBadges.includes(analysis.badge)) {
        analysis.badge = 'BRONZE';
      }

      // Ensure hourly rate is within reasonable bounds
      analysis.estimatedHourlyRate = Math.max(100, Math.min(1000, analysis.estimatedHourlyRate));

      // Ensure arrays are properly formatted
      analysis.skills = Array.isArray(analysis.skills) ? analysis.skills : [];
      analysis.strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
      analysis.recommendedTasks = Array.isArray(analysis.recommendedTasks) ? analysis.recommendedTasks : [];

      // Add metadata
      analysis.analyzedAt = new Date().toISOString();
      analysis.source = 'claude_ai';

      return analysis;

    } catch (error) {
      console.error('Error parsing Claude response:', error.message);
      throw new Error('Failed to parse AI analysis result');
    }
  }

  parseQuizEvaluationResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const evaluation = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const requiredFields = ['badge', 'badgeReason', 'experienceLevel', 'estimatedHourlyRate'];
      for (const field of requiredFields) {
        if (!evaluation[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate badge level
      const validBadges = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
      if (!validBadges.includes(evaluation.badge)) {
        evaluation.badge = 'BRONZE';
      }

      // Validate experience level
      const validExperienceLevels = ['FRESHER', 'JUNIOR', 'EXPERIENCED', 'SENIOR'];
      if (!validExperienceLevels.includes(evaluation.experienceLevel)) {
        evaluation.experienceLevel = 'FRESHER';
      }

      // Ensure hourly rate is within bounds
      evaluation.estimatedHourlyRate = Math.max(100, Math.min(1000, evaluation.estimatedHourlyRate));

      // Ensure arrays are properly formatted
      evaluation.strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths : [];
      evaluation.recommendedTasks = Array.isArray(evaluation.recommendedTasks) ? evaluation.recommendedTasks : [];

      // Add metadata
      evaluation.evaluatedAt = new Date().toISOString();
      evaluation.source = 'claude_ai';

      return evaluation;

    } catch (error) {
      console.error('Error parsing quiz evaluation response:', error.message);
      throw new Error('Failed to parse AI quiz evaluation result');
    }
  }

  getFallbackAnalysis(resumeText) {
    const textLength = resumeText.length;
    const hasExperience = /experience|work|job|company|project/i.test(resumeText);
    const hasTechnicalSkills = /programming|coding|development|design|marketing/i.test(resumeText);
    
    let badge = 'BRONZE';
    let estimatedHourlyRate = 120;
    
    if (textLength > 1000 && hasExperience && hasTechnicalSkills) {
      badge = 'SILVER';
      estimatedHourlyRate = 250;
    }
    
    if (textLength > 2000 && /manager|lead|senior|architect/i.test(resumeText)) {
      badge = 'GOLD';
      estimatedHourlyRate = 400;
    }

    return {
      badge,
      badgeReason: 'Basic analysis based on resume content and keywords',
      skills: ['General Skills', 'Communication'],
      experienceLevel: hasExperience ? 'JUNIOR' : 'FRESHER',
      strengths: ['Adaptable', 'Willing to Learn'],
      recommendedTasks: ['Data Entry', 'Virtual Assistant'],
      estimatedHourlyRate,
      confidence: 60,
      analyzedAt: new Date().toISOString(),
      source: 'fallback_analysis'
    };
  }

  getFallbackQuizEvaluation(answers, workerName) {
    let totalScore = 0;
    let maxScore = 40;
    
    answers.forEach(answer => {
      if (answer.selectedOption && answer.selectedOption.points) {
        totalScore += answer.selectedOption.points;
      }
      if (answer.selectedOptions && Array.isArray(answer.selectedOptions)) {
        answer.selectedOptions.forEach(option => {
          if (option.points) {
            totalScore += option.points;
          }
        });
      }
    });

    let badge = 'BRONZE';
    let estimatedHourlyRate = 120;
    let experienceLevel = 'FRESHER';
    
    if (totalScore >= 30) {
      badge = 'GOLD';
      estimatedHourlyRate = 400;
      experienceLevel = 'EXPERIENCED';
    } else if (totalScore >= 20) {
      badge = 'SILVER';
      estimatedHourlyRate = 250;
      experienceLevel = 'JUNIOR';
    }

    return {
      badge,
      badgeReason: `Rule-based assignment based on quiz score of ${totalScore}/${maxScore}`,
      experienceLevel,
      estimatedHourlyRate,
      strengths: ['Basic Skills', 'Willing to Learn'],
      recommendedTasks: ['data-entry', 'virtual-assistant'],
      confidence: 70,
      source: 'fallback_rules',
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Get badge color and description for UI
   */
  getBadgeDisplayInfo(badge) {
    const badgeInfo = {
      BRONZE: {
        color: '#CD7F32',
        bgColor: '#FFF8E1',
        textColor: '#E65100',
        description: 'Entry Level - Perfect for getting started',
        hourlyRange: '₹100-150'
      },
      SILVER: {
        color: '#C0C0C0',
        bgColor: '#F5F5F5',
        textColor: '#424242',
        description: 'Skilled Worker - Growing expertise',
        hourlyRange: '₹200-300'
      },
      GOLD: {
        color: '#FFD700',
        bgColor: '#FFFDE7',
        textColor: '#F57F17',
        description: 'Expert Level - Advanced capabilities',
        hourlyRange: '₹350-450'
      },
      PLATINUM: {
        color: '#E5E4E2',
        bgColor: '#FAFAFA',
        textColor: '#37474F',
        description: 'Master Level - Premium expertise',
        hourlyRange: '₹500+'
      }
    };

    return badgeInfo[badge] || badgeInfo.BRONZE;
  }
}

module.exports = new AIService();