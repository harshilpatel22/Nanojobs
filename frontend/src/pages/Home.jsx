import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles,
  Trophy,
  Users,
  Clock,
  ArrowRight,
  Star,
  Zap,
  Heart,
  Shield,
  TrendingUp,
  Coins,
  Target,
  ChevronRight,
  Play,
  Award,
  Rocket,
  CheckCircle2,
  IndianRupee,
  Briefcase,
  Home,
  Menu,
  X
} from 'lucide-react';

// Character Mascot Component
const NanoBot = ({ emotion = 'happy', size = 80, animate = false }) => {
  return (
    <div style={{
      width: size,
      height: size,
      position: 'relative',
      animation: animate ? 'bounce 2s ease-in-out infinite' : 'none'
    }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* Body */}
        <ellipse cx="50" cy="60" rx="25" ry="30" fill="url(#botGradient)" />
        {/* Head */}
        <circle cx="50" cy="35" r="20" fill="url(#botGradient)" />
        {/* Eyes */}
        <circle cx="42" cy="33" r="3" fill="#1a1a1a" />
        <circle cx="58" cy="33" r="3" fill="#1a1a1a" />
        {/* Sparkle on eye */}
        <circle cx="43" cy="32" r="1" fill="white" />
        <circle cx="59" cy="32" r="1" fill="white" />
        {/* Mouth */}
        {emotion === 'happy' && (
          <path d="M 40 38 Q 50 44 60 38" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {/* Antenna */}
        <line x1="50" y1="15" x2="50" y2="25" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="13" r="3" fill="#FFB800" />
        {/* Arms */}
        <ellipse cx="25" cy="55" rx="8" ry="15" fill="url(#botGradient)" transform="rotate(-30 25 55)" />
        <ellipse cx="75" cy="55" rx="8" ry="15" fill="url(#botGradient)" transform="rotate(30 75 55)" />
        {/* Badge */}
        <circle cx="65" cy="60" r="8" fill="#FFB800" opacity="0.9" />
        <text x="65" y="64" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">₹</text>
        
        <defs>
          <linearGradient id="botGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4D8BFF" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>
        </defs>
      </svg>
      {animate && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          animation: 'float 3s ease-in-out infinite'
        }}>
          <Sparkles size={20} color="#FFB800" />
        </div>
      )}
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = '#0066FF' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 0.5s ease-in-out'
        }}
      />
    </svg>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    const isNumber = !isNaN(end);
    const endValue = isNumber ? parseInt(end) : 0;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * endValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
};

const NanoJobsHome = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Navigation items (max 4)
  const navItems = [
    { label: 'How it Works', href: '#how-it-works', icon: Zap },
    { label: 'For Employers', href: '#employers', icon: Briefcase },
    { label: 'Login', href: '/login', icon: Users, secondary: true },
    { label: 'Start Earning', href: '/register', primary: true, icon: Rocket }
  ];

  // Task categories with icons
  const taskCategories = [
    { name: 'Data Entry', icon: '📊', tasks: '500+', color: '#E3F2FD' },
    { name: 'Content Writing', icon: '✍️', tasks: '300+', color: '#FFF3E0' },
    { name: 'Social Media', icon: '📱', tasks: '250+', color: '#F3E5F5' },
    { name: 'Research', icon: '🔍', tasks: '400+', color: '#E8F5E9' }
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Housewife, Mumbai',
      avatar: '👩',
      earnings: '₹12,000/month',
      badge: 'Silver',
      story: 'I started with simple data entry tasks and now earn a steady income from home!'
    },
    {
      name: 'Rahul Verma',
      role: 'College Student, Delhi',
      avatar: '👨‍🎓',
      earnings: '₹8,000/month',
      badge: 'Bronze',
      story: 'Perfect for earning while studying. The trial tasks were so easy to complete!'
    },
    {
      name: 'Anjali Patel',
      role: 'Working Professional, Bangalore',
      avatar: '👩‍💼',
      earnings: '₹15,000/month',
      badge: 'Gold',
      story: 'Great side income! I work on tasks during weekends and evenings.'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FAFBFC 0%, #F0F4F8 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1
      }}>
        {/* Floating Orbs */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(0, 102, 255, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 20s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255, 184, 0, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 15s ease-in-out infinite reverse'
        }} />
      </div>

      {/* Navigation Bar - Simplified */}
      <nav style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        zIndex: 1000,
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo with Mascot */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}>
            <NanoBot size={40} />
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #0066FF, #4D8BFF)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              NanoJobs
            </span>
          </div>

          {/* Desktop Navigation */}
          <div style={{
            display: window.innerWidth > 768 ? 'flex' : 'none',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: item.primary || item.secondary ? '0.75rem 1.5rem' : '0.75rem 1rem',
                  borderRadius: '12px',
                  background: item.primary 
                    ? 'linear-gradient(135deg, #0066FF, #4D8BFF)'
                    : item.secondary
                    ? 'white'
                    : 'transparent',
                  color: item.primary ? 'white' : item.secondary ? '#0066FF' : '#4A5568',
                  border: item.secondary ? '2px solid #0066FF' : 'none',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  boxShadow: item.primary ? '0 4px 15px rgba(0, 102, 255, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (item.primary) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 102, 255, 0.4)';
                  } else if (item.secondary) {
                    e.currentTarget.style.background = '#0066FF';
                    e.currentTarget.style.color = 'white';
                  } else {
                    e.currentTarget.style.background = 'rgba(0, 102, 255, 0.05)';
                    e.currentTarget.style.color = '#0066FF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (item.primary) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 102, 255, 0.3)';
                  } else if (item.secondary) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#0066FF';
                  } else {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#4A5568';
                  }
                }}
              >
                <item.icon size={18} />
                {item.label}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              display: window.innerWidth <= 768 ? 'block' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && window.innerWidth <= 768 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            padding: '1rem',
            zIndex: 999
          }}>
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: item.primary 
                    ? 'linear-gradient(135deg, #0066FF, #4D8BFF)'
                    : item.secondary
                    ? 'white'
                    : 'transparent',
                  color: item.primary ? 'white' : item.secondary ? '#0066FF' : '#4A5568',
                  border: item.secondary ? '2px solid #0066FF' : 'none',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '1rem',
                  marginBottom: '0.5rem',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon size={20} />
                {item.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '3rem 1.5rem 5rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '3rem',
          alignItems: 'center'
        }}>
          {/* Left Content */}
          <div>
            {/* Trust Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, rgba(0, 200, 150, 0.1), rgba(0, 200, 150, 0.05))',
              borderRadius: '50px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(0, 200, 150, 0.2)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <Shield size={16} color="#00C896" />
              <span style={{ 
                color: '#00C896', 
                fontSize: '0.875rem', 
                fontWeight: '600' 
              }}>
                100% Secure Payments
              </span>
            </div>

            {/* Main Heading */}
            <h1 style={{
              fontSize: window.innerWidth > 768 ? '3.5rem' : '2.5rem',
              fontWeight: '800',
              lineHeight: '1.1',
              marginBottom: '1.5rem',
              color: '#1A1A1A'
            }}>
              Earn Money with
              <span style={{
                display: 'block',
                background: 'linear-gradient(135deg, #0066FF, #00C896)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Simple Tasks
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '1.25rem',
              color: '#6B7280',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Join 15,000+ Indians earning <strong>₹5,000-15,000</strong> monthly through flexible microtasks. 
              Start in <strong>2 minutes!</strong>
            </p>

            {/* Quick Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {[
                { icon: IndianRupee, value: '12K', label: 'Avg Earning', color: '#00C896' },
                { icon: Clock, value: '2-3hr', label: 'Per Task', color: '#FFB800' },
                { icon: Trophy, value: '98%', label: 'Success Rate', color: '#0066FF' }
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <stat.icon size={24} color={stat.color} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1A1A1A' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => window.location.href = '/register'}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #0066FF, #4D8BFF)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 25px rgba(0, 102, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 102, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 102, 255, 0.3)';
                }}
              >
                <Rocket size={20} />
                Start Earning Now
                <ArrowRight size={20} />
              </button>

              <button
                onClick={() => setIsVideoPlaying(true)}
                style={{
                  padding: '1rem 2rem',
                  background: 'white',
                  color: '#0066FF',
                  border: '2px solid #E5E7EB',
                  borderRadius: '14px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0066FF';
                  e.currentTarget.style.background = 'rgba(0, 102, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = 'white';
                }}
              >
                <Play size={20} />
                Watch Demo
              </button>
            </div>
          </div>

          {/* Right Visual - Interactive Dashboard Preview */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Neumorphic Card */}
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: '20px 20px 60px #d1d1d1, -20px -20px 60px #ffffff',
              maxWidth: '400px',
              width: '100%',
              position: 'relative'
            }}>
              {/* Mascot at top */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                marginBottom: '1.5rem' 
              }}>
                <NanoBot emotion="happy" size={80} animate={true} />
              </div>

              {/* Progress Ring */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                position: 'relative'
              }}>
                <ProgressRing progress={75} size={120} color="#0066FF" />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1A1A1A' }}>
                    <AnimatedCounter end={75} suffix="%" />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Complete</div>
                </div>
              </div>

              {/* Task Categories */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                {taskCategories.map((category, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.75rem',
                      background: category.color,
                      borderRadius: '12px',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      border: '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.borderColor = '#0066FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                      {category.icon}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1A1A1A' }}>
                      {category.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                      {category.tasks}
                    </div>
                  </div>
                ))}
              </div>

              {/* Earnings Display */}
              <div style={{
                background: 'linear-gradient(135deg, #0066FF, #4D8BFF)',
                borderRadius: '12px',
                padding: '1rem',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                  Today's Earnings
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                  ₹<AnimatedCounter end={1250} />
                </div>
              </div>

              {/* Floating Achievement */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                background: 'linear-gradient(135deg, #FFB800, #FFC733)',
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(255, 184, 0, 0.3)',
                animation: 'bounce 2s ease-in-out infinite'
              }}>
                <Trophy size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                Level Up!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Gamified Steps */}
      <section id="how-it-works" style={{
        padding: '4rem 1.5rem',
        background: 'white',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 102, 255, 0.05))',
              borderRadius: '50px',
              marginBottom: '1rem'
            }}>
              <Zap size={16} color="#0066FF" />
              <span style={{ color: '#0066FF', fontSize: '0.875rem', fontWeight: '600' }}>
                Quick Start Guide
              </span>
            </div>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#1A1A1A'
            }}>
              Start Earning in 3 Simple Steps
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#6B7280',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              No experience needed! Our smart system guides you every step of the way
            </p>
          </div>

          {/* Gamified Steps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth > 768 ? 'repeat(3, 1fr)' : '1fr',
            gap: '2rem',
            position: 'relative'
          }}>
            {/* Connection Lines (desktop only) */}
            {window.innerWidth > 768 && (
              <>
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '33%',
                  width: '34%',
                  height: '2px',
                  background: 'linear-gradient(90deg, #0066FF, #00C896)',
                  zIndex: 0
                }} />
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '66%',
                  width: '34%',
                  height: '2px',
                  background: 'linear-gradient(90deg, #00C896, #FFB800)',
                  zIndex: 0
                }} />
              </>
            )}

            {[
              {
                step: 1,
                icon: Heart,
                title: 'Choose Your Path',
                description: 'Simple form for beginners or resume upload for professionals',
                color: '#0066FF',
                bgColor: '#E3F2FD'
              },
              {
                step: 2,
                icon: Target,
                title: 'Complete Trial Tasks',
                description: '3 easy trial tasks to showcase your skills and earn your first badge',
                color: '#00C896',
                bgColor: '#E8F5E9'
              },
              {
                step: 3,
                icon: Coins,
                title: 'Start Earning',
                description: 'Access hundreds of tasks and get paid instantly via UPI',
                color: '#FFB800',
                bgColor: '#FFF3E0'
              }
            ].map((step, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Step Number Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '120px',
                  height: '120px',
                  background: hoveredCard === index 
                    ? `linear-gradient(135deg, ${step.color}, ${step.color}88)`
                    : 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: hoveredCard === index
                    ? `0 15px 35px ${step.color}33`
                    : '0 10px 30px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  border: `3px solid ${step.color}`,
                  zIndex: 2
                }}>
                  <step.icon 
                    size={40} 
                    color={hoveredCard === index ? 'white' : step.color}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                </div>

                {/* Card Content */}
                <div style={{
                  background: hoveredCard === index 
                    ? `linear-gradient(135deg, ${step.bgColor}, white)`
                    : 'white',
                  borderRadius: '20px',
                  padding: '5rem 1.5rem 2rem',
                  boxShadow: hoveredCard === index
                    ? '0 20px 40px rgba(0, 0, 0, 0.1)'
                    : '0 10px 25px rgba(0, 0, 0, 0.05)',
                  border: `2px solid ${hoveredCard === index ? step.color : '#E5E7EB'}`,
                  transform: hoveredCard === index ? 'translateY(-10px)' : 'translateY(0)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: step.color,
                    color: 'white',
                    borderRadius: '20px',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    STEP {step.step}
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    color: '#1A1A1A',
                    textAlign: 'center'
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#6B7280',
                    lineHeight: '1.6',
                    textAlign: 'center'
                  }}>
                    {step.description}
                  </p>

                  {/* Progress indicator */}
                  <div style={{
                    marginTop: '1.5rem',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '0.25rem'
                    }}>
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: i < step.step ? step.color : '#E5E7EB',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Carousel Style */}
      <section id="testimonials" style={{
        padding: '4rem 1.5rem',
        background: 'linear-gradient(135deg, #FAFBFC 0%, #F0F4F8 100%)',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 184, 0, 0.05))',
              borderRadius: '50px',
              marginBottom: '1rem'
            }}>
              <Star size={16} color="#FFB800" />
              <span style={{ color: '#FFB800', fontSize: '0.875rem', fontWeight: '600' }}>
                Success Stories
              </span>
            </div>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#1A1A1A'
            }}>
              Real People, Real Earnings
            </h2>
          </div>

          {/* Testimonial Card */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Quote Icon */}
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              fontSize: '4rem',
              color: '#E5E7EB',
              opacity: 0.5,
              lineHeight: 1
            }}>
              "
            </div>

            {/* Testimonial Content */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Avatar */}
              <div style={{
                fontSize: '4rem',
                background: 'linear-gradient(135deg, #E3F2FD, #F3E5F5)',
                borderRadius: '50%',
                width: '100px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {testimonials[activeTestimonial].avatar}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  color: '#1A1A1A'
                }}>
                  {testimonials[activeTestimonial].name}
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#6B7280',
                  marginBottom: '0.75rem'
                }}>
                  {testimonials[activeTestimonial].role}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.75rem',
                    background: 'linear-gradient(135deg, #00C896, #33D4B0)',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    <IndianRupee size={14} />
                    {testimonials[activeTestimonial].earnings}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.75rem',
                    background: testimonials[activeTestimonial].badge === 'Gold' 
                      ? 'linear-gradient(135deg, #FFD700, #FFC107)'
                      : testimonials[activeTestimonial].badge === 'Silver'
                      ? 'linear-gradient(135deg, #C0C0C0, #9E9E9E)'
                      : 'linear-gradient(135deg, #CD7F32, #8D6E63)',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    <Award size={14} />
                    {testimonials[activeTestimonial].badge}
                  </span>
                </div>
              </div>
            </div>

            {/* Story */}
            <p style={{
              fontSize: '1.1rem',
              color: '#4A5568',
              lineHeight: '1.8',
              fontStyle: 'italic'
            }}>
              "{testimonials[activeTestimonial].story}"
            </p>

            {/* Dots Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '2rem'
            }}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  style={{
                    width: index === activeTestimonial ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: index === activeTestimonial 
                      ? 'linear-gradient(135deg, #0066FF, #4D8BFF)'
                      : '#E5E7EB',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Employers Section */}
      <section id="employers" style={{
        padding: '4rem 1.5rem',
        background: 'white',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
            gap: '4rem',
            alignItems: 'center'
          }}>
            {/* Left Content */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05))',
                borderRadius: '50px',
                marginBottom: '1rem',
                border: '1px solid rgba(255, 107, 53, 0.2)'
              }}>
                <Briefcase size={16} color="#FF6B35" />
                <span style={{ color: '#FF6B35', fontSize: '0.875rem', fontWeight: '600' }}>
                  For Businesses
                </span>
              </div>

              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#1A1A1A',
                lineHeight: '1.1'
              }}>
                Find Skilled Workers for Your
                <span style={{
                  display: 'block',
                  background: 'linear-gradient(135deg, #FF6B35, #FF8A5C)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Business Tasks
                </span>
              </h2>

              <p style={{
                fontSize: '1.1rem',
                color: '#6B7280',
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                Access a pool of 15,000+ verified workers ready to handle your business operations. 
                From data entry to content creation, get quality work done at affordable rates.
              </p>

              {/* Benefits List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {[
                  { icon: CheckCircle2, text: 'Pre-verified workers with skill badges', color: '#00C896' },
                  { icon: Clock, text: 'Tasks completed within 24 hours', color: '#0066FF' },
                  { icon: Shield, text: 'Quality guarantee with escrow protection', color: '#FFB800' },
                  { icon: IndianRupee, text: 'Save 60% on operational costs', color: '#FF6B35' }
                ].map((benefit, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      background: 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 107, 53, 0.05)';
                      e.currentTarget.style.transform = 'translateX(10px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: `${benefit.color}15`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <benefit.icon size={20} color={benefit.color} />
                    </div>
                    <span style={{
                      fontSize: '1rem',
                      color: '#4A5568',
                      fontWeight: '500'
                    }}>
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => window.location.href = '/register/employer'}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #FF6B35, #FF8A5C)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 107, 53, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.3)';
                  }}
                >
                  <Briefcase size={20} />
                  Post Your First Task
                  <ArrowRight size={20} />
                </button>

                <button
                  onClick={() => window.location.href = '/login'}
                  style={{
                    padding: '1rem 2rem',
                    background: 'transparent',
                    color: '#FF6B35',
                    border: '2px solid #FF6B35',
                    borderRadius: '14px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 53, 0.05)';
                    e.currentTarget.style.borderColor = '#FF8A5C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#FF6B35';
                  }}
                >
                  Employer Login
                </button>
              </div>
            </div>

            {/* Right Visual - Employer Dashboard Preview */}
            <div style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {/* Main Dashboard Card */}
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E5E7EB',
                maxWidth: '450px',
                width: '100%',
                position: 'relative'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1A1A1A'
                  }}>
                    Active Tasks
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'linear-gradient(135deg, #FF6B35, #FF8A5C)',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    12 Live
                  </span>
                </div>

                {/* Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  {[
                    { label: 'Posted', value: '45', color: '#0066FF' },
                    { label: 'In Progress', value: '12', color: '#FFB800' },
                    { label: 'Completed', value: '33', color: '#00C896' }
                  ].map((stat, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        background: `${stat.color}08`,
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: `1px solid ${stat.color}20`
                      }}
                    >
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: stat.color
                      }}>
                        {stat.value}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6B7280'
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Task List Preview */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {[
                    { title: 'Data Entry - Product Catalog', workers: 5, progress: 75, color: '#0066FF' },
                    { title: 'Content Writing - Blog Posts', workers: 3, progress: 50, color: '#00C896' },
                    { title: 'Social Media Graphics', workers: 2, progress: 90, color: '#FFB800' }
                  ].map((task, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        background: '#F8F9FA',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F0F4F8';
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8F9FA';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: '#1A1A1A'
                        }}>
                          {task.title}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#6B7280'
                        }}>
                          {task.workers} workers
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div style={{
                        height: '4px',
                        background: '#E5E7EB',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${task.progress}%`,
                          height: '100%',
                          background: task.color,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cost Savings Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  background: 'linear-gradient(135deg, #00C896, #33D4B0)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(0, 200, 150, 0.3)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>60%</div>
                  <div style={{ fontSize: '0.65rem' }}>Saved</div>
                </div>
              </div>

              {/* Floating Elements */}
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '-10%',
                background: 'white',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                display: window.innerWidth > 768 ? 'flex' : 'none',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'float 4s ease-in-out infinite'
              }}>
                <Users size={20} color="#0066FF" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Available</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1A1A1A' }}>
                    <AnimatedCounter end={1250} />+
                  </div>
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '20%',
                right: '-5%',
                background: 'white',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                display: window.innerWidth > 768 ? 'flex' : 'none',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'float 5s ease-in-out infinite reverse'
              }}>
                <TrendingUp size={20} color="#00C896" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Efficiency</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1A1A1A' }}>+45%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Task Categories for Employers */}
          <div style={{
            marginTop: '4rem',
            padding: '2rem',
            background: 'linear-gradient(135deg, #FFF8F0, #FFF5EB)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 107, 53, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: '#1A1A1A'
            }}>
              Popular Task Categories
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 640 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              {[
                { name: 'Data Entry', icon: '📊', price: '₹200-800/task' },
                { name: 'Content Writing', icon: '✍️', price: '₹300-1500/task' },
                { name: 'Customer Support', icon: '💬', price: '₹200-600/task' },
                { name: 'Market Research', icon: '🔍', price: '₹400-1200/task' },
                { name: 'Social Media', icon: '📱', price: '₹300-800/task' },
                { name: 'Graphic Design', icon: '🎨', price: '₹500-2000/task' },
                { name: 'Lead Generation', icon: '🎯', price: '₹300-1500/task' },
                { name: 'Translation', icon: '🌐', price: '₹400-1000/task' }
              ].map((category, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '12px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 107, 53, 0.15)';
                    e.currentTarget.style.borderColor = '#FF6B35';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {category.icon}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1A1A1A' }}>
                    {category.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    {category.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Gamified */
      <section style={{
        padding: '4rem 1.5rem',
        background: 'linear-gradient(135deg, #0066FF, #4D8BFF)',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 2
      }}>
        {/* Animated Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.1) 10px,
            rgba(255, 255, 255, 0.1) 20px
          )`,
          animation: 'slide 20s linear infinite'
        }} />

        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Mascot */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            marginBottom: '2rem',
            filter: 'brightness(0) invert(1)'
          }}>
            <NanoBot size={100} animate={true} />
          </div>

          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: 'white'
          }}>
            Your Success Journey Starts Here!
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '2.5rem',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '600px',
            margin: '0 auto 2.5rem'
          }}>
            Join 15,000+ Indians already earning extra income. 
            Start your first task in the next 2 minutes!
          </p>

          {/* Achievement Preview */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2.5rem',
            flexWrap: 'wrap'
          }}>
            {['🎯 First Task', '🏆 Bronze Badge', '💰 First ₹1000'].map((achievement, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '50px',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  animation: `float ${3 + index}s ease-in-out infinite`
                }}
              >
                {achievement}
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <button
            style={{
              padding: '1.25rem 3rem',
              background: 'white',
              color: '#0066FF',
              border: 'none',
              borderRadius: '16px',
              fontSize: '1.25rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)';
            }}
          >
            <Rocket size={24} />
            Start Your Journey
            <ChevronRight size={24} />
          </button>

          {/* Trust Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            {[
              { icon: Shield, text: '100% Secure' },
              { icon: CheckCircle2, text: 'Instant Payments' },
              { icon: Users, text: '24/7 Support' }
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.95rem'
                }}
              >
                <item.icon size={18} />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

              }
      <footer style={{
        background: '#1A1A1A',
        color: 'white',
        padding: '2rem 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <NanoBot size={30} />
            <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>NanoJobs</span>
          </div>
          <p style={{
            color: '#9CA3AF',
            fontSize: '0.9rem'
          }}>
            © 2024 NanoJobs. Empowering India's workforce, one task at a time.
          </p>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(20px); }
        }
      `}</style>
    </div>
  );
};

export default NanoJobsHome;