  # NanoJobs - Updated Project Context & Production Roadmap

  ## 🎯 Refined Project Vision

  NanoJobs is a **specialized microtask platform for India** connecting workers with **1-3 hour business support tasks** using practical skill verification and badge-based progression, **with fake secure UPI payment integration**.

  **Vision**: Enable Indian housewives, students, and working professionals to earn **₹5,000-15,000 monthly extra income** through skill-based microtasks in business operations support

  **Core Value**: "Specialized microtask marketplace" - focused progression from bronze to platinum tasks with guaranteed payments and practical skill verification

  **Target Market**: 
  - **Workers**: Housewives (simple form path), students & working professionals (resume path) wanting extra income (not full-time replacement)
  - **Tasks**: 1-3 hour microtasks paying ₹200-800 (bronze) to ₹5,000+ (platinum)  
  - **Vertical**: Business Operations Support (data entry → admin → content → financial → strategic)

  ## 🔄 **CRITICAL CHANGES FROM PREVIOUS VERSION**

  ### **Major Feature Updates:**
  2. **✅ ENHANCED: Dual Registration Paths** (Resume OR Simple Form)
  3. **✅ SIMPLIFIED: 2-Badge System Initially** (Bronze + Silver, not 4 levels)

  ## 📊 Updated Implementation Status

  ### ✅ Foundation Complete (Phases 1-4)
  - ✅ Backend API server with Express.js + PostgreSQL + Prisma ORM
  - ✅ Claude AI integration for resume analysis
  - ✅ React frontend with modern UI/UX
  - ✅ MSG91 SMS OTP authentication (working with real SMS delivery)
  - ✅ Fake UPI payment integration with escrow system
  - ✅ Badge system infrastructure (Bronze, Silver, Gold, Platinum, only 2 badges initially)
  - ✅ Task marketplace with application workflow


  #### 5A: Dual Registration System Implementation
  - [ ] **Resume Path (Students & Working Professionals)**
    - Resume upload and AI analysis (existing system)
    - Professional skill extraction
    - Work experience validation
    - Direct badge assignment based on experience

  - [ ] **Simple Form Path (Housewives & First-time Workers)**  
    - Basic information form (name, phone, available hours, education level)
    - No complex verification initially
    - Trial tasks to prove capabilities

  #### 5B: Trial Tasks System
  - [ ] **3 Micro-Trial Tasks (₹50-100 each)**
    - Data entry trial (100 entries from image) - tests typing speed/accuracy
    - Content creation trial (5 product descriptions) - tests English/creativity
    - Organization trial (arrange 50 contacts in Excel) - tests software skills
    
  - [ ] **Progressive Skill Unlock**
    - Complete 3 trials → Bronze Badge
    - Complete 5 bronze tasks → Access to 50% more bronze tasks  
    - Complete 20 bronze tasks → Silver badge eligibility
    
  - [ ] **Performance-Based Matching**
    - Track completion time, accuracy, client satisfaction
    - Use actual performance data instead of quiz scores
    - Auto-suggest skill improvements based on task feedback

  #### 5C: Bronze Task Categories Implementation  
  - [ ] **Data Entry & Organization Tasks**
    - Online form and spreadsheet entry (₹200-600)
    - CRM system data entry (₹300-700)
    - Document conversion (PDF to Word/Excel) (₹200-500)
    - Database cleansing and validation (₹400-800)

  - [ ] **Content & Communication Tasks**
    - Product description writing (₹200-600)
    - Basic social media content creation (₹300-800)
    - Email management and responses (₹200-500)
    - Simple blog post writing (₹400-800)

  - [ ] **Customer Service & Research Tasks**
    - Lead generation and contact research (₹300-1,500)
    - Market research surveys compilation (₹350-750)
    - Basic competitor analysis (₹400-800)

  - [ ] **Basic Design & Financial Tasks**
    - Social media graphics using Canva (₹200-600)
    - Invoice creation and formatting (₹50-150 per invoice)
    - Basic bookkeeping data entry (₹400-800/hour)

  ## 🏗️ Updated Technical Architecture

  ### Current Backend Structure:

  ```
  NANOJOBS/
  ├── backend/
  │   ├── node_modules/
  │   ├── prisma/
  │   │   └── schema.prisma
  │   ├── src/
  │   │   ├── config/
  │   │   │   └── database.js
  │   │   ├── controllers/
  │   │   │   ├── employerController.js       
  │   │   │   ├── paymentController.js         
  │   │   │   ├── bronzeTaskController.js 
  │   │   │   ├── enhancedTrialTaskController.js          
  │   │   │   └── workerController.js        
  │   │   ├── middleware/
  │   │   │   ├── auth.js  
  │   │   │   ├── trialTaskValidation.js                    # EXISTING
  │   │   │   └── upload.js                    # EXISTING
  │   │   ├── routes/
  │   │   │   ├── ai.js                        # EXISTING
  │   │   │   ├── auth.js                      # EXISTING
  │   │   │   ├── employers.js                 # EXISTING
  │   │   │   ├── payments.js                  # EXISTING
  │   │   │   ├── tasks.js 
  │   │   │   ├── trials.js   
  │   │   │   ├── bronzeTaskRoutes.js                 # EXISTING
  │   │   │   └── workers.js                 # EXISTING
  │   │   ├── scripts/
  │   │   │   └── seed.js                      # EXISTING
  │   │   └── services/
  │   │       ├── aiService.js                 # EXISTING
  │   │       ├── bronzeTaskService.js         # EXISTING
  │   │       ├── languageService.js           # EXISTING
  │   │       ├── resumeParser.js              # EXISTING
  │   │       ├── taskMatchingService.js       # EXISTING
  │   │       └── enhancedTrialTaskService.js          # EXISTING
  │   ├── uploads/
  │   │   └── resumes/                         # EXISTING
  │   ├── .env
  │   ├── minimal-server.js
  │   ├── package-lock.json
  │   ├── package.json
  │   └── server.js
  ```

  ### Frontend Structure:

  ```
  frontend/
  ├── node_modules/
  ├── public/
  ├── src/
  │   ├── assets/
  │   ├── components/
  │   │   ├── common/
  │   │   │   ├── Button.jsx                   # EXISTING
  │   │   │   ├── Button.module.css            # EXISTING
  │   │   │   ├── Card.jsx                     # EXISTING
  │   │   │   ├── Card.module.css              # EXISTING
  │   │   │   ├── Input.jsx                    # EXISTING
  │   │   │   ├── Input.module.css             # EXISTING
  │   │   │   ├── LoadingSpinner.jsx           # EXISTING
  │   │   │   └── LoadingSpinner.module.css    # EXISTING
  │   │   ├── payment/
  │   │   │   ├── PaymentReleaseModal.jsx      
  │   │   │   ├── PaymentReleaseModal.module.css 
  │   │   │   ├── UPISetupModal.jsx            
  │   │   │   └── UPISetupModal.module.css              
  │   │   └── task/
  │   │       ├── taskCard.jsx                 # EXISTING
  │   │       └── TaskCard.module.css          # EXISTING
  │   │   ├── trial-tasks/         
  │   │   │   ├── TrialTaskflow.jsx
  │   │   │   ├── TrialTaskflow.module.css                    
  │   ├── pages/
  │   │   ├── EmployerDashboard.jsx            # EXISTING
  │   │   ├── EmployerDashboard.module.css     # EXISTING
  │   │   ├── EmployerRegistration.jsx         # EXISTING
  │   │   ├── EmployerRegistration.module.css  # EXISTING
  │   │   ├── Home.jsx                         # EXISTING
  │   │   ├── Home.module.css                  # EXISTING
  │   │   ├── Login.jsx                        # EXISTING
  │   │   ├── Login.module.css                 # EXISTING
  │   │   ├── SkillAssessment.module.css       # EXISTING
  │   │   ├── TaskMarketplace.jsx              # EXISTING
  │   │   ├── TaskMarketplace.module.css       # EXISTING
  │   │   ├── TaskPosting.jsx                  # EXISTING
  │   │   ├── TaskPosting.module.css           # EXISTING
  │   │   ├── WorkerDashboard.jsx              # EXISTING
  │   │   ├── WorkerDashboard.module.css       # EXISTING
  │   │   ├── WorkerRegistration.jsx           # EXISTING
  │   │   └── WorkerRegistration.module.css    # EXISTING
  │   ├── styles/
  │   │   └── global.css
  │   │   └── variables.css
  │   ├── utils/
  │   │   └── api.js                           # EXISTING
  │   ├── App.css                              # EXISTING
  │   ├── App.jsx                              # EXISTING
  │   ├── index.css                            # EXISTING
  │   └── main.jsx                             # EXISTING
  ├── .env
  ├── .gitignore
  ├── eslint.config.js
  ├── index.html
  ├── package-lock.json
  ├── package.json
  ├── README.md
  └── vite.config.js
  ```


  ## 💰 Updated Unit Economics

  ### Bronze Task Pricing Structure
  ```
  Data Entry Tasks:
  - Basic form entry: ₹200-400 (1-2 hours)
  - CRM data entry: ₹300-700 (2-3 hours)
  - Document conversion: ₹200-500 (1-2 hours)
  Commission: 15% = ₹30-105 per task

  Content Tasks:
  - Product descriptions: ₹200-600 (1-2 hours)
  - Social media content: ₹300-800 (2-3 hours)
  - Email management: ₹200-500 (1-2 hours)
  Commission: 15% = ₹30-120 per task

  Research Tasks:
  - Lead generation: ₹300-1,500 (2-3 hours)
  - Market research: ₹350-750 (2-4 hours)
  - Competition analysis: ₹400-800 (2-3 hours)
  Commission: 15% = ₹45-225 per task

  Monthly Revenue Projection (6 months):
  - Bronze tasks: 1,500/month × ₹75 avg commission = ₹1,12,500
  - Platform costs: ₹30,000
  - Net profit: ₹82,500/month
  ```

  **This updated vision positions NanoJobs as the specialized platform for business support microtasks in India, focusing on quality, progression, and consistent earning opportunities for our target workforce while serving the massive SME market need for affordable, reliable business operations support.**