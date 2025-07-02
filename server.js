const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Store for simulating data changes
let dataStore = {
  counter: 0,
  lastUpdated: new Date(),
  version: 1
};

// Middleware to log requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Helper function to generate ETag
function generateETag(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

// Helper function to format date for HTTP headers
function formatHttpDate(date) {
  return date.toUTCString();
}

// Home page with navigation
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cache Control Demo</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .demo-link { display: block; padding: 10px; margin: 10px 0; background: #f0f0f0; text-decoration: none; border-radius: 5px; }
        .demo-link:hover { background: #e0e0e0; }
        .description { color: #666; font-size: 14px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <h1>Cache Control Mechanisms Demo</h1>
      <p>This demo showcases different HTTP caching strategies. Open Chrome DevTools (Network tab) to observe caching behavior.</p>
      
      <h2>Basic Cache Control</h2>
      <a href="/max-age" class="demo-link">
        <strong>Max-Age Caching</strong>
        <div class="description">Cache for 60 seconds with max-age directive</div>
      </a>
      
      <a href="/no-cache" class="demo-link">
        <strong>No-Cache</strong>
        <div class="description">Always revalidate with server before using cached response</div>
      </a>
      
      <a href="/no-store" class="demo-link">
        <strong>No-Store</strong>
        <div class="description">Never cache this response</div>
      </a>
      
      <h2>Advanced Cache Control</h2>
      <a href="/stale-while-revalidate" class="demo-link">
        <strong>Stale-While-Revalidate (SWR)</strong>
        <div class="description">Serve stale content while fetching fresh content in background</div>
      </a>
      
      <a href="/stale-if-error" class="demo-link">
        <strong>Stale-If-Error (SIE)</strong>
        <div class="description">Serve stale content if server returns an error</div>
      </a>
      
      <h2>Conditional Requests</h2>
      <a href="/etag-demo" class="demo-link">
        <strong>ETag Demo</strong>
        <div class="description">Use ETags for efficient cache validation</div>
      </a>
      
      <a href="/last-modified-demo" class="demo-link">
        <strong>Last-Modified Demo</strong>
        <div class="description">Use Last-Modified header for cache validation</div>
      </a>
      
      <h2>Combined Strategies</h2>
      <a href="/combined-strategy" class="demo-link">
        <strong>Combined Strategy</strong>
        <div class="description">ETag + Last-Modified + SWR</div>
      </a>
      
      <h2>Utilities</h2>
      <a href="/update-data" class="demo-link">
        <strong>Update Server Data</strong>
        <div class="description">Increment counter to test cache invalidation</div>
      </a>
      
      <a href="/force-error" class="demo-link">
        <strong>Force Server Error</strong>
        <div class="description">Simulate server error for SIE testing</div>
      </a>
    </body>
    </html>
  `;
  
  res.send(html);
});

// 1. Basic max-age caching
app.get('/max-age', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=60', // Cache for 60 seconds
    'Content-Type': 'application/json'
  });
  
  res.json({
    message: 'This response is cached for 60 seconds',
    timestamp: new Date().toISOString(),
    counter: dataStore.counter,
    cacheStrategy: 'max-age=60'
  });
});

// 2. No-cache directive
app.get('/no-cache', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache', // Always revalidate
    'Content-Type': 'application/json'
  });
  
  res.json({
    message: 'This response uses no-cache (always revalidate)',
    timestamp: new Date().toISOString(),
    counter: dataStore.counter,
    cacheStrategy: 'no-cache'
  });
});

// 3. No-store directive
app.get('/no-store', (req, res) => {
  res.set({
    'Cache-Control': 'no-store', // Never cache
    'Content-Type': 'application/json'
  });
  
  res.json({
    message: 'This response is never cached (no-store)',
    timestamp: new Date().toISOString(),
    counter: dataStore.counter,
    cacheStrategy: 'no-store'
  });
});

// 4. Stale-While-Revalidate (SWR)
app.get('/stale-while-revalidate', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    'Content-Type': 'application/json'
  });
  
  res.json({
    message: 'Fresh for 30s, then stale-while-revalidate for 60s',
    timestamp: new Date().toISOString(),
    counter: dataStore.counter,
    cacheStrategy: 'max-age=30, stale-while-revalidate=60'
  });
});

// 5. Stale-If-Error (SIE)
app.get('/stale-if-error', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=30, stale-if-error=300',
    'Content-Type': 'application/json'
  });
  
  res.json({
    message: 'Fresh for 30s, serve stale for 300s if server error occurs',
    timestamp: new Date().toISOString(),
    counter: dataStore.counter,
    cacheStrategy: 'max-age=30, stale-if-error=300'
  });
});

// 6. ETag demonstration
app.get('/etag-demo', (req, res) => {
  const data = {
    message: 'This response uses ETag for validation',
    timestamp: new Date().toISOString(),
    counter: dataStore.counter,
    version: dataStore.version
  };
  
  const etag = generateETag(data);
  
  // Check if client has matching ETag
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end(); // Not Modified
    return;
  }
  
  res.set({
    'ETag': etag,
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Content-Type': 'application/json'
  });
  
  res.json({
    ...data,
    cacheStrategy: 'ETag validation',
    etag: etag
  });
});

// 7. Last-Modified demonstration
app.get('/last-modified-demo', (req, res) => {
  const lastModified = formatHttpDate(dataStore.lastUpdated);
  
  // Check if client has matching Last-Modified
  if (req.headers['if-modified-since'] === lastModified) {
    res.status(304).end(); // Not Modified
    return;
  }
  
  res.set({
    'Last-Modified': lastModified,
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Content-Type': 'application/json'
  });
  
  res.json({
    message: 'This response uses Last-Modified for validation',
    timestamp: new Date().toISOString(),
    counter: dataStore.counter,
    lastModified: lastModified,
    cacheStrategy: 'Last-Modified validation'
  });
});

// 8. Combined strategy (ETag + Last-Modified + SWR)
app.get('/combined-strategy', (req, res) => {
  const data = {
    message: 'Combined caching strategy: ETag + Last-Modified + SWR',
    timestamp: new Date().toISOString(),
    counter: dataStore.counter,
    version: dataStore.version
  };
  
  const etag = generateETag(data);
  const lastModified = formatHttpDate(dataStore.lastUpdated);
  
  // Check ETag first, then Last-Modified
  if (req.headers['if-none-match'] === etag || 
      req.headers['if-modified-since'] === lastModified) {
    res.status(304).end(); // Not Modified
    return;
  }
  
  res.set({
    'ETag': etag,
    'Last-Modified': lastModified,
    'Cache-Control': 'public, max-age=20, stale-while-revalidate=40, must-revalidate',
    'Content-Type': 'application/json'
  });
  
  res.json({
    ...data,
    cacheStrategy: 'ETag + Last-Modified + SWR',
    etag: etag,
    lastModified: lastModified
  });
});

// Utility route to update data (for testing cache invalidation)
app.get('/update-data', (req, res) => {
  dataStore.counter++;
  dataStore.lastUpdated = new Date();
  dataStore.version++;
  
  res.json({
    message: 'Data updated successfully',
    newCounter: dataStore.counter,
    newVersion: dataStore.version,
    updatedAt: dataStore.lastUpdated.toISOString()
  });
});

// Utility route to force server error (for SIE testing)
app.get('/force-error', (req, res) => {
  res.status(500).json({
    error: 'Simulated server error for stale-if-error testing',
    timestamp: new Date().toISOString()
  });
});

// API endpoint to get current server state
app.get('/api/status', (req, res) => {
  res.json({
    serverTime: new Date().toISOString(),
    dataStore: dataStore,
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Cache Control Demo Server running on http://localhost:${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the demo navigation`);
  console.log(`Open Chrome DevTools (Network tab) to observe caching behavior`);
}); 