const { prisma } = require('../config/database');

/**
 * Language Service - Hindi and Vernacular Support
 * Handles multi-language content, voice instructions, and localization
 */

class LanguageService {
  constructor() {
    this.supportedLanguages = ['english', 'hindi'];
    this.translations = this.getTranslations();
  }

  /**
   * Get translation dictionary
   */
  getTranslations() {
    return {
      // Common UI Elements
      common: {
        english: {
          welcome: 'Welcome',
          login: 'Login',
          register: 'Register',
          submit: 'Submit',
          cancel: 'Cancel',
          next: 'Next',
          back: 'Back',
          save: 'Save',
          edit: 'Edit',
          delete: 'Delete',
          search: 'Search',
          filter: 'Filter',
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          phone: 'Phone Number',
          email: 'Email Address',
          name: 'Full Name',
          password: 'Password'
        },
        hindi: {
          welcome: 'स्वागत है',
          login: 'लॉगिन',
          register: 'पंजीकरण',
          submit: 'जमा करें',
          cancel: 'रद्द करें',
          next: 'अगला',
          back: 'पीछे',
          save: 'सेव करें',
          edit: 'संपादित करें',
          delete: 'हटाएं',
          search: 'खोजें',
          filter: 'फिल्टर',
          loading: 'लोड हो रहा है...',
          error: 'त्रुटि',
          success: 'सफलता',
          phone: 'फोन नंबर',
          email: 'ईमेल पता',
          name: 'पूरा नाम',
          password: 'पासवर्ड'
        }
      },

      // Task Categories
      taskCategories: {
        english: {
          'data-entry': 'Data Entry & Organization',
          'content-creation': 'Content & Communication',
          'customer-service': 'Customer Service & Research',
          'basic-design': 'Basic Design & Visual Content',
          'basic-finance': 'Basic Finance & Admin',
          'research-analysis': 'Research & Analysis'
        },
        hindi: {
          'data-entry': 'डेटा एंट्री और व्यवस्थापन',
          'content-creation': 'कंटेंट और संचार',
          'customer-service': 'ग्राहक सेवा और अनुसंधान', 
          'basic-design': 'बेसिक डिज़ाइन और विज़ुअल',
          'basic-finance': 'बेसिक वित्त और प्रशासन',
          'research-analysis': 'अनुसंधान और विश्लेषण'
        }
      },

      // Task Instructions
      taskInstructions: {
        english: {
          dataEntry: 'Enter the provided data accurately into the form fields. Pay attention to spelling and formatting.',
          contentWriting: 'Write engaging content that captures attention and provides value to readers.',
          customerService: 'Respond to customer inquiries professionally and helpfully.',
          basicDesign: 'Create visually appealing designs using the provided tools and templates.',
          research: 'Gather accurate information from reliable sources and compile findings clearly.'
        },
        hindi: {
          dataEntry: 'दिए गए डेटा को फॉर्म फील्ड में सही तरीके से भरें। स्पेलिंग और फॉर्मेटिंग पर ध्यान दें।',
          contentWriting: 'आकर्षक कंटेंट लिखें जो ध्यान आकर्षित करे और पाठकों को मूल्य प्रदान करे।',
          customerService: 'ग्राहकों के प्रश्नों का व्यावसायिक और सहायक तरीके से उत्तर दें।',
          basicDesign: 'दिए गए टूल्स और टेम्प्लेट का उपयोग करके आकर्षक डिज़ाइन बनाएं।',
          research: 'विश्वसनीय स्रोतों से सटीक जानकारी एकत्र करें और निष्कर्षों को स्पष्ट रूप से संकलित करें।'
        }
      },

      // Registration Flow
      registration: {
        english: {
          chooseYourPath: 'Choose Your Registration Path',
          professionalPath: 'Professional Path',
          simplePath: 'Simple Path',
          uploadResume: 'Upload Your Resume',
          startTrialTasks: 'Start Trial Tasks',
          perfectForStudents: 'Perfect for students and working professionals',
          perfectForHousewives: 'Perfect for housewives and first-time workers',
          noResumeRequired: 'No resume required',
          quickSetup: 'Quick setup (2-3 minutes)',
          earnWhileLearning: 'Earn money while learning',
          stepByStepGuidance: 'Step-by-step guidance'
        },
        hindi: {
          chooseYourPath: 'अपना पंजीकरण पथ चुनें',
          professionalPath: 'व्यावसायिक पथ',
          simplePath: 'सरल पथ',
          uploadResume: 'अपना रिज्यूमे अपलोड करें',
          startTrialTasks: 'ट्रायल टास्क शुरू करें',
          perfectForStudents: 'छात्रों और कामकाजी पेशेवरों के लिए बिल्कुल सही',
          perfectForHousewives: 'गृहिणियों और नए काम करने वालों के लिए बिल्कुल सही',
          noResumeRequired: 'कोई रिज्यूमे आवश्यक नहीं',
          quickSetup: 'त्वरित सेटअप (2-3 मिनट)',
          earnWhileLearning: 'सीखते समय पैसे कमाएं',
          stepByStepGuidance: 'चरण-दर-चरण मार्गदर्शन'
        }
      },

      // Success Messages
      messages: {
        english: {
          registrationSuccess: 'Registration successful! Welcome to NanoJobs!',
          taskCompleted: 'Task completed successfully!',
          applicationSubmitted: 'Application submitted successfully!',
          paymentReceived: 'Payment received successfully!',
          badgeEarned: 'Congratulations! You earned a new badge!',
          trialTaskPassed: 'Great work! Trial task passed!'
        },
        hindi: {
          registrationSuccess: 'पंजीकरण सफल! NanoJobs में आपका स्वागत है!',
          taskCompleted: 'कार्य सफलतापूर्वक पूरा हुआ!',
          applicationSubmitted: 'आवेदन सफलतापूर्वक जमा किया गया!',
          paymentReceived: 'भुगतान सफलतापूर्वक प्राप्त हुआ!',
          badgeEarned: 'बधाई हो! आपने एक नया बैज अर्जित किया!',
          trialTaskPassed: 'बहुत अच्छा काम! ट्रायल टास्क पास हो गया!'
        }
      },

      // Help and Guidance
      help: {
        english: {
          howToStart: 'How to Start',
          completeTasks: 'Complete Tasks',
          earnMoney: 'Earn Money',
          improveSkills: 'Improve Skills',
          getHelp: 'Get Help',
          contactSupport: 'Contact Support',
          faqTitle: 'Frequently Asked Questions',
          tutorialsTitle: 'Video Tutorials'
        },
        hindi: {
          howToStart: 'कैसे शुरू करें',
          completeTasks: 'कार्य पूरे करें',
          earnMoney: 'पैसे कमाएं',
          improveSkills: 'कौशल सुधारें',
          getHelp: 'सहायता प्राप्त करें',
          contactSupport: 'सहायता से संपर्क करें',
          faqTitle: 'अक्सर पूछे जाने वाले प्रश्न',
          tutorialsTitle: 'वीडियो ट्यूटोरियल'
        }
      }
    };
  }

  /**
   * Get translated text
   * @param {string} key - Translation key (e.g., 'common.welcome')
   * @param {string} language - Language code
   * @returns {string} Translated text
   */
  translate(key, language = 'english') {
    try {
      const keys = key.split('.');
      let translation = this.translations;
      
      for (const k of keys) {
        translation = translation[k];
        if (!translation) break;
      }
      
      if (translation && typeof translation === 'object') {
        return translation[language] || translation['english'] || key;
      }
      
      return translation || key;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key;
    }
  }

  /**
   * Get worker's preferred language
   * @param {string} workerId - Worker ID
   * @returns {string} Language preference
   */
  async getWorkerLanguagePreference(workerId) {
    try {
      const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        select: { preferredLanguage: true }
      });
      
      return worker?.preferredLanguage || 'english';
    } catch (error) {
      console.error('Get language preference error:', error);
      return 'english';
    }
  }

  /**
   * Update worker's language preference
   * @param {string} workerId - Worker ID
   * @param {string} language - Language preference
   */
  async updateWorkerLanguagePreference(workerId, language) {
    try {
      if (!this.supportedLanguages.includes(language)) {
        throw new Error('Unsupported language');
      }

      await prisma.worker.update({
        where: { id: workerId },
        data: { preferredLanguage: language }
      });

      return {
        success: true,
        data: {
          workerId,
          preferredLanguage: language,
          message: this.translate('messages.preferencesUpdated', language)
        }
      };

    } catch (error) {
      console.error('Update language preference error:', error);
      return {
        success: false,
        error: 'Failed to update language preference',
        message: error.message
      };
    }
  }

  /**
   * Get task instructions in preferred language
   * @param {string} taskCategory - Task category
   * @param {string} language - Language preference
   * @returns {Object} Instructions in specified language
   */
  getTaskInstructions(taskCategory, language = 'english') {
    const instructionKey = this.getCategoryInstructionKey(taskCategory);
    
    return {
      category: this.translate(`taskCategories.${taskCategory}`, language),
      instructions: this.translate(`taskInstructions.${instructionKey}`, language),
      tips: this.getTaskTips(taskCategory, language),
      commonMistakes: this.getCommonMistakes(taskCategory, language)
    };
  }

  /**
   * Get category instruction key mapping
   */
  getCategoryInstructionKey(taskCategory) {
    const mapping = {
      'data-entry': 'dataEntry',
      'content-creation': 'contentWriting',
      'customer-service': 'customerService',
      'basic-design': 'basicDesign',
      'research-analysis': 'research'
    };
    return mapping[taskCategory] || 'dataEntry';
  }

  /**
   * Get task tips in specified language
   */
  getTaskTips(taskCategory, language) {
    const tips = {
      'data-entry': {
        english: [
          'Double-check all entries before submitting',
          'Use keyboard shortcuts to work faster',
          'Keep data consistent in format',
          'Verify phone numbers and email addresses'
        ],
        hindi: [
          'सबमिट करने से पहले सभी एंट्री को दोबारा चेक करें',
          'तेज़ी से काम करने के लिए कीबोर्ड शॉर्टकट का उपयोग करें',
          'डेटा को फॉर्मेट में एक समान रखें',
          'फोन नंबर और ईमेल पते को वेरिफाई करें'
        ]
      },
      'content-creation': {
        english: [
          'Write in clear, simple language',
          'Use engaging headlines and openings',
          'Proofread for grammar and spelling',
          'Keep your target audience in mind'
        ],
        hindi: [
          'स्पष्ट, सरल भाषा में लिखें',
          'आकर्षक शीर्षक और शुरुआत का उपयोग करें',
          'व्याकरण और स्पेलिंग के लिए प्रूफरीड करें',
          'अपने लक्षित दर्शकों को ध्यान में रखें'
        ]
      }
    };

    return tips[taskCategory]?.[language] || tips[taskCategory]?.english || [];
  }

  /**
   * Get common mistakes in specified language
   */
  getCommonMistakes(taskCategory, language) {
    const mistakes = {
      'data-entry': {
        english: [
          'Typing errors in names and addresses',
          'Incorrect phone number formats',
          'Missing required fields',
          'Inconsistent date formats'
        ],
        hindi: [
          'नाम और पते में टाइपिंग एरर',
          'गलत फोन नंबर फॉर्मेट',
          'आवश्यक फील्ड छूटना',
          'असंगत दिनांक फॉर्मेट'
        ]
      },
      'content-creation': {
        english: [
          'Poor grammar and spelling',
          'Not following the brief requirements',
          'Using inappropriate tone',
          'Plagiarizing content'
        ],
        hindi: [
          'खराब व्याकरण और स्पेलिंग',
          'ब्रीफ आवश्यकताओं का पालन नहीं करना',
          'अनुचित टोन का उपयोग',
          'कंटेंट कॉपी करना'
        ]
      }
    };

    return mistakes[taskCategory]?.[language] || mistakes[taskCategory]?.english || [];
  }

  /**
   * Generate voice instructions (mock implementation)
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language for speech
   * @returns {Object} Voice instruction data
   */
  async generateVoiceInstructions(text, language = 'english') {
    try {
      // Mock implementation - in production, integrate with TTS service
      const voiceData = {
        text,
        language,
        audioUrl: `https://api.nanojobs.com/voice/${language}/${encodeURIComponent(text)}`,
        duration: Math.ceil(text.length / 10), // Rough estimate: 10 characters per second
        format: 'mp3',
        generated: true
      };

      console.log('🔊 Voice instructions generated (mock):', { language, textLength: text.length });

      return {
        success: true,
        data: voiceData
      };

    } catch (error) {
      console.error('Voice instructions error:', error);
      return {
        success: false,
        error: 'Failed to generate voice instructions',
        message: error.message
      };
    }
  }

  /**
   * Get localized UI content for worker dashboard
   * @param {string} workerId - Worker ID
   * @returns {Object} Localized UI content
   */
  async getLocalizedDashboardContent(workerId) {
    try {
      const language = await this.getWorkerLanguagePreference(workerId);
      
      const content = {
        navigation: {
          dashboard: this.translate('common.dashboard', language),
          tasks: this.translate('common.tasks', language),
          profile: this.translate('common.profile', language),
          earnings: this.translate('common.earnings', language),
          help: this.translate('help.getHelp', language)
        },
        
        dashboard: {
          welcome: this.translate('common.welcome', language),
          totalEarnings: language === 'hindi' ? 'कुल कमाई' : 'Total Earnings',
          tasksCompleted: language === 'hindi' ? 'पूरे किए गए कार्य' : 'Tasks Completed',
          currentBadge: language === 'hindi' ? 'वर्तमान बैज' : 'Current Badge',
          availableTasks: language === 'hindi' ? 'उपलब्ध कार्य' : 'Available Tasks'
        },

        taskCategories: {
          title: language === 'hindi' ? 'कार्य श्रेणियां' : 'Task Categories',
          categories: Object.keys(this.translations.taskCategories.english).map(key => ({
            id: key,
            name: this.translate(`taskCategories.${key}`, language)
          }))
        },

        help: {
          title: this.translate('help.faqTitle', language),
          contactSupport: this.translate('help.contactSupport', language),
          tutorials: this.translate('help.tutorialsTitle', language)
        },

        language,
        languageOptions: [
          { code: 'english', name: 'English' },
          { code: 'hindi', name: 'हिंदी' }
        ]
      };

      return {
        success: true,
        data: content
      };

    } catch (error) {
      console.error('Get localized content error:', error);
      return {
        success: false,
        error: 'Failed to get localized content',
        message: error.message
      };
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return {
      success: true,
      data: {
        supported: this.supportedLanguages,
        languages: [
          {
            code: 'english',
            name: 'English',
            nativeName: 'English',
            isDefault: true
          },
          {
            code: 'hindi',
            name: 'Hindi',
            nativeName: 'हिंदी',
            isDefault: false
          }
        ]
      }
    };
  }
}

module.exports = new LanguageService();