const express = require('express');
const path = require('path');
const app = express();
const port = 5500;

// Serve static files
app.use(express.static('frontend'));

// Handle all routes by serving the main HTML file
app.get('*', (req, res) => {
  // If the request is for a static file that exists, Express will handle it before this
  // Otherwise, serve the SPA entry point
  if (req.path.includes('/game') || req.path.includes('/tournament') || req.path.includes('/home')) {
    res.sendFile(path.resolve(__dirname, 'frontend', 'mainpage', 'mainpage.html'));
  } else {
    res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 