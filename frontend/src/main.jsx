import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * NanoJobs Frontend Entry Point
 * Initializes the React application with error boundaries and performance monitoring
 */

// Error boundary for catching React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.logError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '2rem auto',
          fontFamily: 'var(--font-sans, -apple-system, sans-serif)'
        }}>
          <h1 style={{ 
            color: 'var(--error, #E53E3E)', 
            marginBottom: '1rem',
            fontSize: '1.5rem' 
          }}>
            Oops! Something Went Wrong
          </h1>
          
          <p style={{ 
            color: 'var(--text-secondary, #6B7280)', 
            marginBottom: '1.5rem',
            lineHeight: '1.5' 
          }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: 'var(--primary, #0066FF)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            Refresh Page
          </button>

          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--primary, #0066FF)',
              border: '1px solid var(--primary, #0066FF)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginTop: '2rem', 
              textAlign: 'left',
              backgroundColor: '#f8f8f8',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #ddd'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{ 
                fontSize: '0.875rem', 
                color: '#e53e3e',
                overflow: 'auto',
                marginTop: '0.5rem'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring for development
if (process.env.NODE_ENV === 'development') {
  // Log performance metrics
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'measure') {
        console.log(`⚡ Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
      }
    });
  });
  
  if ('observe' in observer) {
    observer.observe({ entryTypes: ['measure'] });
  }
}

// Service Worker registration for PWA capabilities (future feature)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Hot Module Replacement for development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Log app initialization
console.log('🚀 NanoJobs Frontend initialized');
console.log('📱 Optimized for mobile-first experience');
console.log('🇮🇳 Built for India\'s next 500M internet users');

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent the default behavior (logging to console)
  event.preventDefault();
  
  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error reporting service
    // errorReportingService.logError(new Error('Unhandled Promise Rejection'), { reason: event.reason });
  }
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global JavaScript error:', event.error);
  
  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error reporting service
    // errorReportingService.logError(event.error, { filename: event.filename, lineno: event.lineno });
  }
});

// Accessibility: Focus management for mobile users
document.addEventListener('DOMContentLoaded', () => {
  // Add focus-visible polyfill behavior for better keyboard navigation
  const focusVisibleElements = document.querySelectorAll('button, input, select, textarea, a[href], [tabindex]');
  
  focusVisibleElements.forEach(element => {
    element.addEventListener('mousedown', () => {
      element.classList.add('mouse-focused');
    });
    
    element.addEventListener('keydown', () => {
      element.classList.remove('mouse-focused');
    });
  });
});

// Network status monitoring for offline capabilities (future feature)
if ('navigator' in window && 'onLine' in navigator) {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    document.body.setAttribute('data-network-status', isOnline ? 'online' : 'offline');
    
    if (!isOnline) {
      console.warn('📡 App is offline. Some features may not work.');
    } else {
      console.log('📡 App is back online.');
    }
  };
  
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus(); // Initial check
}

export default App;