// Ultra-minimal Express server for debugging
console.log('🔧 Starting minimal server...');

const express = require('express');
console.log('✅ Express imported');

const app = express();
console.log('✅ Express app created');

const PORT = 5001; // Different port to avoid conflicts

// Most basic route possible
app.get('/', (req, res) => {
  res.json({ message: 'Minimal server works!' });
});
console.log('✅ Basic route defined');

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log('✅ Server started successfully!');
});

console.log('🔧 Server setup completed');