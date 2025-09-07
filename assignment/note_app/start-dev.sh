#!/bin/bash

echo "🚀 Starting Collaborative Notes Development Environment..."
echo

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Start backend server in background
echo "🔧 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Start frontend server
echo "🎨 Starting frontend development server..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo
echo "✅ Development environment started!"
echo "🔧 Backend: http://localhost:5000"
echo "🎨 Frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID
