# Cache Control Demo Server

A minimal Express.js server demonstrating different HTTP cache control mechanisms that work with Google Chrome and other modern browsers.

## Features

This demo showcases:
- **Basic Cache Control**: `max-age`, `no-cache`, `no-store`
- **Advanced Strategies**: Stale-While-Revalidate (SWR), Stale-If-Error (SIE)
- **Conditional Requests**: ETags and Last-Modified headers
- **Combined Approaches**: Multiple caching strategies working together

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

4. **Open Chrome DevTools:**
   Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Opt+I` (Mac)
   Go to the **Network** tab to observe caching behavior

## Cache Control Mechanisms Demonstrated

### Basic Cache Control

#### 1. Max-Age Caching (`/max-age`)
- **Header**: `Cache-Control: public, max-age=60`
- **Behavior**: Response is cached for 60 seconds
- **Testing**: Refresh the page multiple times within 60 seconds - subsequent requests will be served from cache

#### 2. No-Cache (`/no-cache`)
- **Header**: `Cache-Control: no-cache`
- **Behavior**: Browser must revalidate with server before using cached response
- **Testing**: Each request will show a revalidation request to the server

#### 3. No-Store (`/no-store`)
- **Header**: `Cache-Control: no-store`
- **Behavior**: Response is never cached
- **Testing**: Every request will be fresh, never served from cache

### Advanced Cache Control

#### 4. Stale-While-Revalidate (`/stale-while-revalidate`)
- **Header**: `Cache-Control: public, max-age=30, stale-while-revalidate=60`
- **Behavior**: 
  - Fresh for 30 seconds
  - For the next 60 seconds, serve stale content immediately while fetching fresh content in the background
- **Testing**: 
  1. Load the page (fresh response)
  2. Wait 35 seconds, reload (serves stale content immediately + background fetch)
  3. Reload again quickly (serves the fresh content from background fetch)

#### 5. Stale-If-Error (`/stale-if-error`)
- **Header**: `Cache-Control: public, max-age=30, stale-if-error=300`
- **Behavior**: 
  - Fresh for 30 seconds
  - If server returns an error, serve stale content for up to 300 seconds
- **Testing**:
  1. Load the page (gets cached)
  2. Wait 35 seconds
  3. Use `/force-error` to simulate server error
  4. Reload the stale-if-error page (should serve stale content)

### Conditional Requests

#### 6. ETag Demo (`/etag-demo`)
- **Headers**: `ETag: <hash>`, `Cache-Control: public, max-age=0, must-revalidate`
- **Behavior**: Uses ETag for efficient cache validation
- **Testing**:
  1. Load the page (receives ETag)
  2. Reload (sends `If-None-Match` header, receives 304 Not Modified)
  3. Use `/update-data` to change server state
  4. Reload (receives new content with new ETag)

#### 7. Last-Modified Demo (`/last-modified-demo`)
- **Headers**: `Last-Modified: <date>`, `Cache-Control: public, max-age=0, must-revalidate`
- **Behavior**: Uses Last-Modified date for cache validation
- **Testing**:
  1. Load the page (receives Last-Modified header)
  2. Reload (sends `If-Modified-Since` header, receives 304 Not Modified)
  3. Use `/update-data` to change server state
  4. Reload (receives new content with updated Last-Modified)

#### 8. Combined Strategy (`/combined-strategy`)
- **Headers**: ETag + Last-Modified + SWR
- **Behavior**: Combines multiple caching strategies for optimal performance
- **Testing**: Test scenarios from both ETag and SWR demos

## Utility Endpoints

- **`/update-data`**: Increments server counter and updates timestamps (useful for testing cache invalidation)
- **`/force-error`**: Returns a 500 error (useful for testing stale-if-error behavior)
- **`/api/status`**: Returns current server state and uptime

## How to Test Cache Behavior

### In Chrome DevTools:

1. **Network Tab Columns**: Enable "Status", "Size", and "Time" columns
2. **Status Codes**:
   - `200`: Fresh response from server
   - `304`: Not Modified (conditional request succeeded)
   - `(from disk cache)`: Served directly from cache
   - `(from memory cache)`: Served from memory cache

3. **Size Column**:
   - Shows actual bytes transferred vs. resource size
   - Cached responses show smaller transfer sizes

4. **Cache Testing**:
   - **Disable Cache**: Check "Disable cache" to see uncached behavior
   - **Hard Refresh**: `Ctrl+F5` / `Cmd+Shift+R` bypasses cache
   - **Normal Refresh**: `F5` / `Cmd+R` respects cache headers

### Testing Workflow:

1. **Load a demo endpoint** with DevTools Network tab open
2. **Observe the initial request** (should be 200 with full content)
3. **Refresh the page** and observe caching behavior
4. **Try different timing** (wait for cache expiry, etc.)
5. **Use utility endpoints** to modify server state
6. **Test error scenarios** using `/force-error`

## Understanding the Output

Each endpoint returns JSON with:
- `message`: Description of the caching strategy
- `timestamp`: Current server time
- `counter`: Server-side counter (changes when `/update-data` is called)
- `cacheStrategy`: Summary of cache headers used
- Additional fields specific to each demo (ETags, Last-Modified dates, etc.)

## Browser Cache Hierarchy

Chrome uses multiple cache layers:
1. **Memory Cache**: Fast, temporary (cleared on tab close)
2. **Disk Cache**: Persistent across browser sessions
3. **Service Worker Cache**: If service workers are implemented
4. **HTTP Cache**: Standard HTTP caching (what this demo focuses on)

## Real-World Applications

- **Static Assets**: Use `max-age` for CSS, JS, images
- **API Responses**: Use ETags or Last-Modified for efficient updates
- **News/Content Sites**: Use SWR for perceived performance
- **Offline-First Apps**: Combine SWR and SIE for resilience
- **CDN Optimization**: Understand cache behavior for better CDN configuration

Happy caching! 🚀
