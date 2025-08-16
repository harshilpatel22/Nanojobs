/**
 * Trial Task Seeding Script
 * Creates production-ready trial tasks in the database
 * 
 * Usage: node src/scripts/seedTrialTasks.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTrialTasks() {
  try {
    console.log('🌱 Starting trial task seeding...');

    const trialTasks = [
      {
        title: 'Customer Data Entry Challenge',
        description: 'Test your data entry skills by accurately entering customer information from a sample form. This trial evaluates your typing speed, attention to detail, and data formatting abilities.',
        category: 'DATA_ENTRY',
        payAmount: 75.00,
        timeLimit: 20, // 20 minutes
        difficulty: 'beginner',
        accuracyThreshold: 90.0,
        speedThreshold: 2.0, // 2 entries per minute
        qualityChecklist: {
          requirements: [
            'All fields must be completed accurately',
            'Phone numbers in correct 10-digit format',
            'Valid email addresses with @ symbol',
            'Proper name capitalization',
            'No spelling errors in city names'
          ],
          passingCriteria: 'Must achieve 90% accuracy with at least 8/10 entries completed'
        },
        sampleData: {
          instructions: 'Enter the following customer data exactly as shown',
          fields: ['name', 'phone', 'email', 'city'],
          sampleEntries: [
            { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh.kumar@email.com', city: 'Mumbai' },
            { name: 'Priya Sharma', phone: '9876543211', email: 'priya.sharma@gmail.com', city: 'Delhi' },
            { name: 'Arjun Patel', phone: '9876543212', email: 'arjun.patel@yahoo.com', city: 'Ahmedabad' },
            { name: 'Sneha Reddy', phone: '9876543213', email: 'sneha.reddy@outlook.com', city: 'Hyderabad' },
            { name: 'Vikram Singh', phone: '9876543214', email: 'vikram.singh@hotmail.com', city: 'Jaipur' },
            { name: 'Anita Gupta', phone: '9876543215', email: 'anita.gupta@email.com', city: 'Pune' },
            { name: 'Rahul Verma', phone: '9876543216', email: 'rahul.verma@gmail.com', city: 'Kolkata' },
            { name: 'Meera Iyer', phone: '9876543217', email: 'meera.iyer@yahoo.com', city: 'Chennai' },
            { name: 'Suresh Joshi', phone: '9876543218', email: 'suresh.joshi@email.com', city: 'Bangalore' },
            { name: 'Kavya Nair', phone: '9876543219', email: 'kavya.nair@gmail.com', city: 'Kochi' }
          ],
          entryCount: 10,
          displayMode: 'form_fields'
        },
        instructions: `You will see a list of customer information displayed above the entry form. Your task is to:

1. **Look at each customer's details carefully**
2. **Enter the information in the corresponding form fields**
3. **Ensure accuracy in all fields:**
   - Names: Use proper capitalization (First Last)
   - Phone: Enter exactly 10 digits (9876543210)
   - Email: Include the complete email address
   - City: Use proper capitalization

**Tips for Success:**
- Double-check each entry before moving to the next
- Pay attention to spelling, especially for city names
- Ensure phone numbers are exactly 10 digits
- Type carefully to avoid errors

**Evaluation Criteria:**
- Accuracy: 90% or higher required to pass
- Speed: Complete as many entries as possible within 20 minutes
- Quality: Proper formatting and no spelling errors`,
        expectedOutput: {
          format: 'form_entries',
          totalEntries: 10,
          requiredFields: ['name', 'phone', 'email', 'city'],
          validation: {
            name: 'Non-empty string, proper capitalization',
            phone: 'Exactly 10 digits, numeric only',
            email: 'Valid email format with @ symbol',
            city: 'Non-empty string, proper capitalization'
          }
        },
        autoGrading: true,
        manualReview: false,
        isActive: true
      },
      {
        title: 'Product Description Writer Challenge',
        description: 'Showcase your content writing skills by creating compelling product descriptions. This trial tests your ability to write engaging, persuasive copy that would help customers make purchasing decisions.',
        category: 'CONTENT',
        payAmount: 100.00,
        timeLimit: 25, // 25 minutes
        difficulty: 'beginner',
        accuracyThreshold: 85.0,
        qualityChecklist: {
          requirements: [
            'Write exactly 3 product descriptions',
            'Each description: 80-120 words',
            'Include ALL provided product features',
            'Use professional, persuasive language',
            'Focus on customer benefits',
            'Maintain consistent tone throughout'
          ],
          passingCriteria: 'Minimum 300 words total, all features mentioned, professional quality'
        },
        sampleData: {
          products: [
            {
              name: 'Premium Wireless Bluetooth Headphones',
              features: [
                'Advanced noise cancellation technology',
                '30-hour extended battery life',
                'Foldable and portable design',
                'Touch gesture controls',
                'Premium leather headband',
                'Compatible with all devices'
              ],
              targetAudience: 'Music lovers, professionals, travelers',
              priceRange: '₹3,000 - ₹5,000'
            },
            {
              name: 'Smart Fitness Tracker Watch',
              features: [
                '24/7 heart rate monitoring',
                'Built-in GPS tracking',
                'Waterproof up to 50 meters',
                'Sleep pattern analysis',
                '7-day battery life',
                'Smartphone notifications'
              ],
              targetAudience: 'Fitness enthusiasts, health-conscious individuals',
              priceRange: '₹2,500 - ₹4,000'
            },
            {
              name: 'Organic Premium Green Tea Collection',
              features: [
                '100% certified organic tea leaves',
                '25 individually wrapped tea bags',
                'Natural weight management support',
                'Rich in antioxidants',
                'Ethically sourced from Indian gardens',
                'Zero artificial additives'
              ],
              targetAudience: 'Health enthusiasts, tea connoisseurs',
              priceRange: '₹400 - ₹600'
            }
          ],
          writingGuidelines: {
            tone: 'Professional yet engaging',
            style: 'Benefits-focused, customer-centric',
            structure: 'Opening hook + features + benefits + call to action',
            keywords: ['premium', 'quality', 'perfect', 'ideal', 'innovative', 'designed']
          }
        },
        instructions: `Write compelling product descriptions that would convince customers to purchase these items. For each product:

**Writing Requirements:**
- **Word count**: 80-120 words per description
- **Include ALL features** mentioned for each product
- **Focus on benefits** - how does this help the customer?
- **Use persuasive language** - make it appealing
- **Professional tone** - suitable for e-commerce websites

**Structure for each description:**
1. **Opening** - Hook the customer's attention
2. **Features** - Highlight key product features
3. **Benefits** - Explain how it improves customer's life
4. **Closing** - Create desire to purchase

**Example opening:** "Experience the perfect blend of comfort and technology with..."

**Tips for Success:**
- Think like a customer - what would convince YOU to buy?
- Use action words: experience, enjoy, discover, transform
- Mention the target audience benefits
- Keep sentences clear and engaging
- Proofread for grammar and spelling

**Evaluation focuses on:**
- Completeness (all features mentioned)
- Persuasiveness (compelling language)
- Professional quality (grammar, structure)
- Customer focus (benefits over features)`,
        expectedOutput: {
          format: 'text_content',
          minWords: 300,
          maxWords: 400,
          productsCount: 3,
          structure: {
            description1: 'Wireless Headphones description (80-120 words)',
            description2: 'Fitness Tracker description (80-120 words)',
            description3: 'Green Tea description (80-120 words)'
          },
          qualityMetrics: [
            'Word count compliance',
            'Feature inclusion rate',
            'Professional language use',
            'Persuasiveness score',
            'Grammar and spelling accuracy'
          ]
        },
        autoGrading: true,
        manualReview: false,
        isActive: true
      },
      {
        title: 'Contact Database Organization Challenge',
        description: 'Test your organizational skills by converting messy contact information into a clean, structured database format. This trial evaluates your attention to detail, data formatting abilities, and organizational efficiency.',
        category: 'ORGANIZATION',
        payAmount: 80.00,
        timeLimit: 15, // 15 minutes
        difficulty: 'beginner',
        accuracyThreshold: 92.0,
        speedThreshold: 3.0, // 3 contacts per minute
        qualityChecklist: {
          requirements: [
            'Organize all 6 provided contacts',
            'Extract and separate: Name, Phone, Email, Company',
            'Use consistent formatting throughout',
            'Clean up formatting issues (extra spaces, inconsistent capitalization)',
            'Ensure no information is lost or duplicated'
          ],
          passingCriteria: 'All contacts organized with 92% accuracy in formatting and completeness'
        },
        sampleData: {
          rawContacts: [
            'John Smith - john.smith@techcorp.com - 9876543210 - Tech Corp Solutions',
            'Sarah Johnson, Marketing Director, sarah.j@innovatemarketing.in, +91-9876543211, Innovate Marketing Agency',
            '9876543212 | David Wilson | david.wilson@consultancy.co.in | Wilson Business Consultancy',
            'maria garcia - MARIA.GARCIA@financeplus.com - 9876543213 - Finance Plus Services',
            'Robert Brown, robert.brown@logistics.in, +91 98765 43214, Brown Logistics Pvt Ltd',
            'PRIYA SHAH - priya.shah@designstudio.com - 9876543215 - Creative Design Studio'
          ],
          organizationInstructions: 'The contacts above are in different formats. Your job is to organize them into a clean, consistent table format.',
          targetFormat: {
            columns: ['Name', 'Phone', 'Email', 'Company'],
            formatting: {
              name: 'Proper Case (First Last)',
              phone: '10 digits only (9876543210)',
              email: 'Lowercase, complete address',
              company: 'Proper Case, no extra words'
            }
          }
        },
        instructions: `You'll see 6 contacts in different messy formats above. Your task is to organize them into a clean, structured format:

**Your Task:**
1. **Extract information** from each messy contact entry
2. **Organize into 4 columns**: Name | Phone | Email | Company
3. **Apply consistent formatting** to all entries
4. **Clean up any formatting issues**

**Formatting Standards:**
- **Names**: Use proper capitalization (John Smith, not JOHN SMITH or john smith)
- **Phone Numbers**: Extract only the 10 digits (9876543210, remove +91, spaces, dashes)
- **Emails**: Use lowercase, keep complete email address
- **Company Names**: Use proper capitalization, remove extra words like "Pvt Ltd" if inconsistent

**Example:**
Raw: "JOHN SMITH - john.smith@COMPANY.COM - +91-98765-43210 - TECH COMPANY PVT LTD"
Organized: 
- Name: John Smith
- Phone: 9876543210  
- Email: john.smith@company.com
- Company: Tech Company

**Tips for Success:**
- Look for patterns: name, email, phone can be in any order
- Clean up capitalization (UPPERCASE → Proper Case)
- Remove extra formatting from phone numbers
- Be consistent with your formatting choices
- Double-check that you've captured all information

**Common Issues to Watch For:**
- Phone numbers with +91, spaces, or dashes
- Names in ALL CAPS or lowercase
- Emails in mixed case
- Missing information (some contacts might not have all fields)`,
        expectedOutput: {
          format: 'structured_data',
          contactCount: 6,
          columns: ['Name', 'Phone', 'Email', 'Company'],
          validation: {
            name: 'Proper case formatting, no extra spaces',
            phone: 'Exactly 10 digits, numeric only',
            email: 'Lowercase, valid email format',
            company: 'Proper case, consistent naming'
          },
          qualityMetrics: [
            'Data completeness (all contacts organized)',
            'Formatting consistency',
            'Information accuracy',
            'No data loss or duplication'
          ]
        },
        autoGrading: true,
        manualReview: false,
        isActive: true
      },
      {
        title: 'Email Response Writing Challenge',
        description: 'Test your professional communication skills by writing appropriate email responses to customer inquiries. This trial evaluates your ability to communicate clearly, professionally, and helpfully.',
        category: 'COMMUNICATION',
        payAmount: 90.00,
        timeLimit: 20, // 20 minutes
        difficulty: 'beginner',
        accuracyThreshold: 88.0,
        qualityChecklist: {
          requirements: [
            'Write 3 professional email responses',
            'Address all customer concerns mentioned',
            'Maintain professional yet friendly tone',
            'Include proper email structure (greeting, body, closing)',
            'Provide helpful and actionable information',
            'Keep responses concise but complete'
          ],
          passingCriteria: 'Professional quality responses that address all customer concerns'
        },
        sampleData: {
          customerInquiries: [
            {
              from: 'rajesh.customer@email.com',
              subject: 'Question about wireless headphones battery life',
              message: 'Hi, I saw your wireless headphones online and I\'m interested. Can you tell me more about the battery life? I need something that lasts for long flights. Also, do they come with a carrying case? Thanks!',
              productContext: 'Premium Wireless Bluetooth Headphones',
              customerConcerns: ['Battery life duration', 'Suitability for long flights', 'Carrying case inclusion']
            },
            {
              from: 'priya.shopper@gmail.com',
              subject: 'Shipping time and return policy',
              message: 'Hello, I want to order the fitness tracker but I need it by next Friday for a gift. What are your shipping options? Also, what if the person doesn\'t like it - can I return it? Please let me know the return policy.',
              productContext: 'Smart Fitness Tracker Watch',
              customerConcerns: ['Urgent delivery needed', 'Shipping options', 'Return policy details']
            },
            {
              from: 'arjun.tea@yahoo.com',
              subject: 'Green tea questions',
              message: 'I\'m trying to lose weight and heard green tea helps. Is your organic green tea good for weight loss? How many cups should I drink per day? Are there any side effects I should know about?',
              productContext: 'Organic Premium Green Tea Collection',
              customerConcerns: ['Weight loss benefits', 'Daily consumption guidance', 'Possible side effects']
            }
          ],
          responseGuidelines: {
            tone: 'Professional yet friendly and helpful',
            structure: 'Greeting + Address concerns + Helpful information + Next steps + Professional closing',
            length: '100-150 words per response',
            keyElements: ['Address by name', 'Thank for inquiry', 'Answer all questions', 'Provide helpful details', 'Encourage next steps']
          }
        },
        instructions: `Write professional email responses to the 3 customer inquiries shown above. Each response should address all the customer's questions and concerns professionally.

**Response Structure:**
1. **Professional greeting** (Dear [Name] or Hello [Name])
2. **Thank them** for their inquiry
3. **Address each concern** they mentioned
4. **Provide helpful information** and details
5. **Next steps** or call to action
6. **Professional closing** (Best regards, Thank you, etc.)

**Writing Guidelines:**
- **Tone**: Professional but warm and helpful
- **Length**: 100-150 words per response
- **Address ALL concerns** mentioned by the customer
- **Be specific** - give actual details, not vague answers
- **Be helpful** - anticipate additional questions they might have

**For Each Inquiry:**

**Email 1 (Headphones)**: Address battery life, suitability for flights, carrying case
**Email 2 (Fitness Tracker)**: Address urgent shipping, delivery options, return policy
**Email 3 (Green Tea)**: Address weight loss benefits, usage instructions, safety

**Tips for Success:**
- Read each inquiry carefully - note ALL questions
- Use the customer's name if provided
- Give specific information (not just "yes, it's good")
- Sound knowledgeable about the products
- End with encouragement to purchase or ask more questions
- Proofread for professional language and grammar

**Example Opening:** "Dear Rajesh, Thank you for your interest in our Premium Wireless Bluetooth Headphones..."`,
        expectedOutput: {
          format: 'email_responses',
          responseCount: 3,
          structure: {
            response1: 'Reply to headphones battery inquiry',
            response2: 'Reply to shipping and returns inquiry', 
            response3: 'Reply to green tea benefits inquiry'
          },
          qualityMetrics: [
            'Professional tone and structure',
            'All customer concerns addressed',
            'Helpful and specific information',
            'Appropriate length (100-150 words)',
            'Grammar and spelling accuracy',
            'Clear call to action'
          ]
        },
        autoGrading: true,
        manualReview: false,
        isActive: true
      },
      {
        title: 'Basic Research Task Challenge',
        description: 'Test your research and information gathering skills by finding specific information about Indian companies. This trial evaluates your ability to search effectively and present findings clearly.',
        category: 'RESEARCH',
        payAmount: 85.00,
        timeLimit: 18, // 18 minutes
        difficulty: 'beginner',
        accuracyThreshold: 90.0,
        qualityChecklist: {
          requirements: [
            'Find information for all 3 companies',
            'Include all requested details for each company',
            'Verify information accuracy',
            'Present findings in clear, organized format',
            'Include sources where information was found'
          ],
          passingCriteria: 'Complete and accurate information for all companies with proper formatting'
        },
        sampleData: {
          researchTasks: [
            {
              company: 'Infosys',
              requiredInfo: [
                'Headquarters location (city)',
                'Year founded',
                'Current CEO name',
                'Primary business/services',
                'Number of employees (approximate)'
              ]
            },
            {
              company: 'Flipkart',
              requiredInfo: [
                'Headquarters location (city)',
                'Year founded', 
                'Current CEO name',
                'Primary business/services',
                'Parent company (if any)'
              ]
            },
            {
              company: 'Tata Consultancy Services (TCS)',
              requiredInfo: [
                'Headquarters location (city)',
                'Year founded',
                'Current CEO name',
                'Primary business/services',
                'Stock exchange listing (if applicable)'
              ]
            }
          ],
          researchGuidelines: {
            sources: 'Use reliable sources like company websites, Wikipedia, business news sites',
            accuracy: 'Double-check information from multiple sources',
            formatting: 'Present information clearly for each company',
            timeManagement: 'Spend about 6 minutes per company'
          }
        },
        instructions: `Research the 3 Indian companies listed above and find the specific information requested for each. You'll need to search online and gather accurate, up-to-date information.

**Your Task:**
For each company, find and provide:
1. **Headquarters location** (which city)
2. **Year founded** (when the company was established)
3. **Current CEO name** (as of 2024)
4. **Primary business/services** (what they do)
5. **Additional specific info** (varies by company)

**Research Tips:**
- Start with the company's official website
- Use reliable sources (Wikipedia, business news sites, official reports)
- Cross-check information from multiple sources
- Look for recent information (2023-2024)
- If you can't find exact info, note "Information not available"

**Formatting Your Answers:**
Present your findings clearly for each company:

**Company Name:**
- Headquarters: [City name]
- Founded: [Year]
- CEO: [Full name]
- Business: [Brief description]
- [Additional info]: [Details]

**Example Format:**
**Infosys:**
- Headquarters: Bangalore
- Founded: 1981
- CEO: Salil Parekh
- Business: IT services and consulting
- Employees: Approximately 300,000

**Time Management:**
- Spend about 6 minutes per company
- Don't get stuck on one detail - move on if info is hard to find
- Focus on finding the most recent and accurate information

**Evaluation Criteria:**
- Accuracy of information found
- Completeness (all requested details)
- Clear formatting and presentation
- Use of reliable sources`,
        expectedOutput: {
          format: 'research_findings',
          companiesCount: 3,
          requiredFields: ['headquarters', 'founded', 'ceo', 'business', 'additional'],
          structure: 'Organized presentation of findings for each company',
          qualityMetrics: [
            'Information accuracy and currency',
            'Completeness of all required fields',
            'Clear formatting and organization',
            'Use of reliable sources',
            'Professional presentation'
          ]
        },
        autoGrading: true,
        manualReview: false,
        isActive: true
      }
    ];

    // Delete existing trial tasks to avoid duplicates
    await prisma.trialTask.deleteMany({});
    console.log('🗑️ Cleared existing trial tasks');

    // Insert new trial tasks
    let createdCount = 0;
    for (const taskData of trialTasks) {
      try {
        const created = await prisma.trialTask.create({
          data: taskData
        });
        console.log(`✅ Created trial task: ${created.title}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create task "${taskData.title}":`, error.message);
      }
    }

    console.log(`🎉 Successfully seeded ${createdCount}/${trialTasks.length} trial tasks`);

    // Verify the seeding
    const totalTasks = await prisma.trialTask.count();
    const activeTasks = await prisma.trialTask.count({ where: { isActive: true } });
    
    console.log(`📊 Database status: ${totalTasks} total tasks, ${activeTasks} active tasks`);
    
    // Show categories and earnings
    const tasksByCategory = await prisma.trialTask.groupBy({
      by: ['category'],
      _count: { id: true },
      _sum: { payAmount: true }
    });

    console.log('📋 Tasks by category:');
    tasksByCategory.forEach(cat => {
      console.log(`  ${cat.category}: ${cat._count.id} tasks, ₹${cat._sum.payAmount} total earnings`);
    });

    const totalEarnings = trialTasks.reduce((sum, task) => sum + task.payAmount, 0);
    console.log(`💰 Total trial task earnings available: ₹${totalEarnings}`);

    return {
      success: true,
      tasksCreated: createdCount,
      totalEarnings,
      categories: tasksByCategory.length
    };

  } catch (error) {
    console.error('❌ Trial task seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding function for exports
async function seedTrialTasksExport() {
  return await seedTrialTasks();
}

// Run if called directly
if (require.main === module) {
  seedTrialTasks()
    .then((result) => {
      console.log('🎉 Seeding completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedTrialTasks: seedTrialTasksExport };