import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  SlidersHorizontal,
  Award,
  MapPin,
  DollarSign,
  Clock,
  RefreshCw,
  X,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Building2,
  Users,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TaskCard from '../components/task/taskCard';

// Import enhanced API client
import { taskAPI, workerAPI, storageUtils } from '../utils/api';

import styles from './TaskMarketplace.module.css';

/**
 * Enhanced TaskMarketplace - Business Support Focus
 * Now specialized for business operations microtasks
 * 
 * Features:
 * - Business support task categories
 * - Bronze-level task focus
 * - Industry-specific filtering
 * - Language support (Hindi/English)
 * - Community integration
 */

const TaskMarketplace = ({ workerId, sessionToken }) => {
  const navigate = useNavigate();
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [language, setLanguage] = useState('english');
  
  // Filter State - Enhanced for Business Tasks
  const [filters, setFilters] = useState({
    category: '',
    industry: '',
    difficulty: '',
    urgency: '',
    location: '',
    minRate: '',
    maxRate: '',
    maxBudget: '',
    language: '',
    hasTemplates: false,
    recurring: false
  });

  // Get effective worker ID
  const effectiveWorkerId = workerId || storageUtils.getSession().workerId;

  // Fetch worker profile and language preference
  const { data: workerData, error: workerError } = useQuery(
    ['worker-profile', effectiveWorkerId],
    () => {
      if (!effectiveWorkerId) throw new Error('Worker ID required');
      return workerAPI.getProfile(effectiveWorkerId);
    },
    {
      enabled: !!effectiveWorkerId,
      retry: 1,
      onSuccess: (data) => {
        const worker = data?.data?.worker;
        if (worker?.preferredLanguage) {
          setLanguage(worker.preferredLanguage);
        }
      }
    }
  );

  // Fetch business support categories
  const { data: categoriesData } = useQuery(
    'business-categories',
    () => taskAPI.getBusinessSupportCategories(),
    {
      retry: 1,
      staleTime: 10 * 60 * 1000, // Cache for 10 minutes
      onSuccess: (data) => {
        console.log('✅ Business categories loaded:', data?.data?.categories?.length || 0);
      }
    }
  );

  // Fetch bronze tasks with enhanced filters
  // Replace the useQuery for bronze tasks in TaskMarketplace.jsx with this FIXED version:

// Fetch bronze tasks with enhanced filters
const { 
  data: tasksData, 
  isLoading: tasksLoading, 
  error: tasksError, 
  refetch: refetchTasks 
} = useQuery(
  ['bronze-tasks', effectiveWorkerId, searchQuery, filters, selectedCategory],
  () => {
    if (!effectiveWorkerId) {
      throw new Error('Worker ID required for task filtering');
    }
    
    console.log('🔄 Fetching bronze tasks:', { 
      workerId: effectiveWorkerId, 
      category: selectedCategory,
      search: searchQuery,
      filters 
    });
    
    // FIXED: Clean filters before sending to API
    const cleanedFilters = {};
    
    // Only include non-empty filter values
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        // Handle boolean values
        if (typeof value === 'boolean' && value === true) {
          cleanedFilters[key] = value;
        }
        // Handle string values
        else if (typeof value === 'string' && value.trim() !== '') {
          cleanedFilters[key] = value.trim();
        }
        // Handle numeric values
        else if ((key.includes('Rate') || key.includes('Budget')) && !isNaN(parseFloat(value))) {
          cleanedFilters[key] = parseFloat(value);
        }
      }
    });
    
    console.log('🧹 Cleaned filters:', cleanedFilters);
    
    // Use bronze task API if category selected, otherwise general tasks
    if (selectedCategory) {
      return taskAPI.getBronzeTasksByCategory(selectedCategory, {
        ...cleanedFilters,
        search: searchQuery.trim() || undefined
      });
    } else {
      return taskAPI.getMarketplaceTasks(effectiveWorkerId, searchQuery, {
        ...cleanedFilters,
        businessFocus: true // Request business-focused tasks
      });
    }
  },
  {
    enabled: !!effectiveWorkerId,
    retry: 2,
    onSuccess: (data) => {
      const taskCount = selectedCategory 
        ? data?.data?.tasks?.length || 0
        : data?.data?.tasks?.length || 0;
      console.log('✅ Tasks loaded:', taskCount);
    },
    onError: (error) => {
      console.error('❌ Failed to fetch tasks:', error);
      
      // Better error messages for users
      if (error.message.includes('Validation error')) {
        toast.error('❌ Invalid search parameters. Please check your filters.');
      } else if (error.message.includes('Authentication')) {
        toast.error('❌ Please log in again to view tasks.');
      } else {
        toast.error('❌ Failed to load tasks. Please try again.');
      }
    }
  }
);

  /**
   * Handle category selection
   */
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setFilters(prev => ({ ...prev, category: categoryId }));
    setShowFilters(false);
  };

  /**
   * Handle search input changes
   */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      category: '',
      industry: '',
      difficulty: '',
      urgency: '',
      location: '',
      minRate: '',
      maxRate: '',
      maxBudget: '',
      language: '',
      hasTemplates: false,
      recurring: false
    });
    setSearchQuery('');
    setSelectedCategory('');
  };

  /**
   * Handle bronze task application
   */
  const handleApplyForTask = async (task) => {
    if (!effectiveWorkerId) {
      toast.error('❌ Please log in to apply for tasks');
      return;
    }

    try {
      console.log('📝 Applying for bronze task:', task.id);
      
      const response = selectedCategory 
        ? await taskAPI.applyForBronzeTask(task.id, effectiveWorkerId, `I'm interested in this ${task.category} task.`)
        : await taskAPI.applyForTask(task.id, effectiveWorkerId, `I'm interested in this business task.`);

      if (response.success) {
        toast.success(`🎉 Applied for "${task.title}" successfully!`);
        refetchTasks();
      } else {
        throw new Error(response.message || 'Application failed');
      }

    } catch (error) {
      console.error('❌ Task application error:', error);
      
      if (error.response?.status === 409) {
        toast.error('❌ You have already applied for this task');
      } else if (error.response?.status === 403) {
        toast.error('❌ You need Bronze badge to apply for business tasks');
      } else {
        toast.error('❌ Failed to apply. Please try again.');
      }
    }
  };

  /**
   * Get localized text
   */
  const t = (key, defaultText) => {
    // Simple translation helper - in production, use proper i18n library
    const translations = {
      english: {
        taskMarketplace: 'Business Task Marketplace',
        findBusinessTasks: 'Find business support tasks that match your skills',
        businessCategories: 'Business Support Categories',
        allTasks: 'All Tasks',
        filters: 'Filters',
        industry: 'Industry',
        difficulty: 'Difficulty',
        language: 'Language',
        hasTemplates: 'Has Templates',
        recurring: 'Recurring Tasks',
        apply: 'Apply Now',
        paymentSecured: 'Payment Secured'
      },
      hindi: {
        taskMarketplace: 'व्यापारिक कार्य बाज़ार',
        findBusinessTasks: 'अपने कौशल से मेल खाने वाले व्यापारिक सहायता कार्य खोजें',
        businessCategories: 'व्यापारिक सहायता श्रेणियां',
        allTasks: 'सभी कार्य',
        filters: 'फिल्टर',
        industry: 'उद्योग',
        difficulty: 'कठिनाई',
        language: 'भाषा',
        hasTemplates: 'टेम्प्लेट उपलब्ध',
        recurring: 'नियमित कार्य',
        apply: 'आवेदन करें',
        paymentSecured: 'भुगतान सुरक्षित'
      }
    };
    
    return translations[language]?.[key] || defaultText;
  };

  // Extract data from API responses
  const worker = workerData?.data?.worker;
  const categories = categoriesData?.data?.categories || [];
  const tasks = selectedCategory 
    ? tasksData?.data?.tasks || []
    : tasksData?.data?.tasks || [];
  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== false) || searchQuery !== '';

  // Loading state
  if (tasksLoading || (effectiveWorkerId && !workerData && !workerError)) {
    return <LoadingSpinner fullscreen message="Loading business tasks..." />;
  }

  // Authentication error
  if (!effectiveWorkerId) {
    return (
      <div className={styles.container}>
        <Card className={styles.emptyState}>
          <CardBody>
            <div className={styles.emptyContent}>
              <AlertCircle size={48} className={styles.emptyIcon} />
              <h3>Authentication Required</h3>
              <p>Please log in as a worker to browse business tasks.</p>
              <Button onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Enhanced Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Button 
            variant="ghost" 
            icon={ArrowLeft} 
            onClick={() => navigate('/dashboard')}
          >
            {t('backToDashboard', 'Back to Dashboard')}
          </Button>
          
          <div className={styles.headerInfo}>
            <h1>{t('taskMarketplace', 'Business Task Marketplace')}</h1>
            <p>{t('findBusinessTasks', 'Find business support tasks that match your skills')}</p>
            {worker && (
              <div className={styles.workerBadge}>
                <Award size={16} />
                <span>{worker.badge} Level</span>
                <span className={styles.businessFocus}>• Business Focus</span>
              </div>
            )}
          </div>

          <div className={styles.headerActions}>
            <Button 
              variant="outline" 
              icon={RefreshCw}
              onClick={refetchTasks}
              disabled={tasksLoading}
            >
              {t('refresh', 'Refresh')}
            </Button>
          </div>
        </div>

        {/* Business Categories Selection */}
        <div className={styles.categorySection}>
          <h3>{t('businessCategories', 'Business Support Categories')}</h3>
          <div className={styles.categoryTabs}>
            <button
              className={`${styles.categoryTab} ${!selectedCategory ? styles.active : ''}`}
              onClick={() => handleCategorySelect('')}
            >
              <Briefcase size={16} />
              {t('allTasks', 'All Tasks')}
            </button>
            
            {categories.map(category => (
              <button
                key={category.id}
                className={`${styles.categoryTab} ${selectedCategory === category.id ? styles.active : ''}`}
                onClick={() => handleCategorySelect(category.id)}
              >
                <Building2 size={16} />
                <span>{category.name}</span>
                {category.taskCount > 0 && (
                  <span className={styles.taskCount}>({category.taskCount})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <Input
              type="text"
              placeholder={t('searchPlaceholder', 'Search business tasks, skills, or industries...')}
              value={searchQuery}
              onChange={handleSearchChange}
              icon={Search}
              className={styles.searchInput}
            />
            <Button
              variant="outline"
              icon={SlidersHorizontal}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? styles.activeFilter : ''}
            >
              {t('filters', 'Filters')}
            </Button>
          </div>

          {/* Enhanced Filter Panel */}
          {showFilters && (
            <Card className={styles.filtersPanel}>
              <CardBody>
                <div className={styles.filtersGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>{t('industry', 'Industry')}</label>
                    <select
                      value={filters.industry}
                      onChange={(e) => handleFilterChange('industry', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All industries</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="retail">Retail</option>
                      <option value="services">Services</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>{t('difficulty', 'Difficulty')}</label>
                    <select
                      value={filters.difficulty}
                      onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Max Budget</label>
                    <Input
                      type="number"
                      placeholder="e.g. 1000"
                      value={filters.maxBudget}
                      onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                      icon={DollarSign}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>{t('language', 'Language')}</label>
                    <select
                      value={filters.language}
                      onChange={(e) => handleFilterChange('language', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">Any language</option>
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="both">Both languages</option>
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterCheckbox}>
                      <input
                        type="checkbox"
                        checked={filters.hasTemplates}
                        onChange={(e) => handleFilterChange('hasTemplates', e.target.checked)}
                      />
                      {t('hasTemplates', 'Has Templates')}
                    </label>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterCheckbox}>
                      <input
                        type="checkbox"
                        checked={filters.recurring}
                        onChange={(e) => handleFilterChange('recurring', e.target.checked)}
                      />
                      {t('recurring', 'Recurring Tasks')}
                    </label>
                  </div>

                  <div className={styles.filterActions}>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      icon={X}
                      size="sm"
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={refetchTasks}
                      icon={RefreshCw}
                      size="sm"
                      disabled={tasksLoading}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </header>

      {/* Results Summary with Business Focus */}
      <div className={styles.resultsHeader}>
        <div className={styles.resultsSummary}>
          <h2>{tasks.length} Business Support Tasks</h2>
          {worker && (
            <p>
              Specialized microtasks for {worker.badge} level • Business operations focus
              {selectedCategory && ` • ${categories.find(c => c.id === selectedCategory)?.name}`}
            </p>
          )}
        </div>

        {selectedCategory && (
          <div className={styles.categoryInfo}>
            <div className={styles.categoryDetails}>
              <h4>{categories.find(c => c.id === selectedCategory)?.name}</h4>
              <p>{categories.find(c => c.id === selectedCategory)?.description}</p>
              <div className={styles.categoryMeta}>
                <span>Avg Rate: ₹{categories.find(c => c.id === selectedCategory)?.avgRate}/hr</span>
                <span>Duration: {categories.find(c => c.id === selectedCategory)?.timeRange}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      {!tasksLoading && !tasksError && (
        <div className={styles.tasksList}>
          {tasks.length === 0 ? (
            <Card className={styles.emptyState}>
              <CardBody>
                <div className={styles.emptyContent}>
                  <Briefcase size={48} className={styles.emptyIcon} />
                  <h3>No business tasks found</h3>
                  <p>
                    {hasActiveFilters 
                      ? 'No tasks match your current filters. Try adjusting your search criteria.'
                      : selectedCategory
                        ? `No tasks available in ${categories.find(c => c.id === selectedCategory)?.name} category.`
                        : 'No business support tasks are currently available.'
                    }
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} icon={X}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className={styles.tasksGrid}>
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={{
                    ...task,
                    // Enhanced business task properties
                    businessValue: task.businessValue,
                    industry: task.industry,
                    templates: task.templates,
                    instructionLanguage: task.instructionLanguage,
                    hasVoiceInstructions: task.hasVoiceInstructions
                  }}
                  onApply={handleApplyForTask}
                  onViewDetails={(task) => navigate(`/tasks/${task.id}`)}
                  highlightMatch={task.compatibility?.score >= 80}
                  showBusinessBadge={true}
                  language={language}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Business Support Stats */}
      {tasks.length > 0 && (
        <Card className={styles.businessStats}>
          <CardHeader title="Business Impact Stats" />
          <CardBody>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <Building2 size={20} />
                <div>
                  <div className={styles.statValue}>
                    {new Set(tasks.map(t => t.industry)).size}
                  </div>
                  <div className={styles.statLabel}>Industries Served</div>
                </div>
              </div>
              
              <div className={styles.stat}>
                <Users size={20} />
                <div>
                  <div className={styles.statValue}>
                    {tasks.filter(t => t.recurring).length}
                  </div>
                  <div className={styles.statLabel}>Recurring Opportunities</div>
                </div>
              </div>
              
              <div className={styles.stat}>
                <MessageSquare size={20} />
                <div>
                  <div className={styles.statValue}>
                    {tasks.filter(t => t.templates).length}
                  </div>
                  <div className={styles.statLabel}>With Templates</div>
                </div>
              </div>

              <div className={styles.stat}>
                <TrendingUp size={20} />
                <div>
                  <div className={styles.statValue}>
                    ₹{Math.round(tasks.reduce((sum, task) => sum + (parseFloat(task.payAmount || task.totalBudget) || 0), 0))}
                  </div>
                  <div className={styles.statLabel}>Total Earning Potential</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Business Success Tips */}
      <Card className={styles.businessTips}>
        <CardHeader title="Success Tips for Business Tasks" />
        <CardBody>
          <div className={styles.tips}>
            <div className={styles.tip}>
              <h4>Understand Business Context</h4>
              <p>Each task helps real businesses grow. Understanding the business value makes you more valuable.</p>
            </div>
            <div className={styles.tip}>
              <h4>Use Templates Wisely</h4>
              <p>Many business tasks include templates. Use them as starting points but customize for each client.</p>
            </div>
            <div className={styles.tip}>
              <h4>Focus on Quality</h4>
              <p>Business clients value accuracy and professionalism. Double-check your work before submission.</p>
            </div>
            <div className={styles.tip}>
              <h4>Build Client Relationships</h4>
              <p>Good work on business tasks often leads to recurring opportunities and higher rates.</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Language Toggle */}
      <div className={styles.languageToggle}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}
        >
          {language === 'english' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
        </Button>
      </div>
    </div>
  );
};

export default TaskMarketplace;