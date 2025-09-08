# Frontend Error Troubleshooting Guide

## Current Issue: "Something went wrong" Error

The ErrorBoundary is catching a JavaScript error in the React app. Here's how to identify and fix it:

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Look for error messages that start with:
   - "Error caught by boundary:"
   - "Error stack:"
   - "Component stack:"

## Step 2: Test with Simple Component

I've temporarily modified the app to show a simple test component on the home page. If you can see "Simple Test Component" without errors, the issue is in the main components.

## Step 3: Common Causes and Solutions

### A. Socket.io Connection Issues
**Symptoms:** Errors related to socket.io-client
**Solution:** 
```bash
cd note_app
npm install socket.io-client@latest
```

### B. Missing Dependencies
**Symptoms:** Import errors
**Solution:**
```bash
cd note_app
npm install
```

### C. Port Conflicts
**Symptoms:** Connection refused errors
**Solution:** Make sure backend is running on port 5001

### D. CORS Issues
**Symptoms:** CORS errors in console
**Solution:** Backend CORS is already configured for localhost:5173

## Step 4: Debug Steps

1. **Start with Simple Test:**
   - Visit `http://localhost:5173/`
   - Should show "Simple Test Component"
   - If this works, the issue is in CreateNote or EnhancedNoteEditor

2. **Test Create Note:**
   - Visit `http://localhost:5173/create`
   - Try creating a note
   - Check console for errors

3. **Test Note Editor:**
   - Create a note first
   - Visit the note URL
   - Check console for socket connection errors

## Step 5: Backend Verification

Make sure backend is running correctly:
```bash
# Test backend health
curl http://localhost:5001/api/health

# Test create note
curl -X POST http://localhost:5001/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Note"}'
```

## Step 6: Reset to Working State

If all else fails, reset the frontend:
```bash
cd note_app
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Current Modifications Made

1. **Enhanced ErrorBoundary:** Now shows detailed error information
2. **Simple Test Route:** Added `/` route with SimpleTest component
3. **Create Note Route:** Moved to `/create` route
4. **Debug Script:** Created `debug-app.js` for testing imports

## Next Steps

1. Check browser console for specific error details
2. Test the simple component first
3. Gradually test other components
4. Report the specific error message from console
