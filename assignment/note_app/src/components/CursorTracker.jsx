import React, { useEffect, useRef } from 'react';

const CursorTracker = ({ users, currentUserId }) => {
  const cursorRefs = useRef({});

  useEffect(() => {
    // Clean up old cursor elements
    Object.keys(cursorRefs.current).forEach(userId => {
      if (!users.find(user => user.id === userId)) {
        const cursorElement = cursorRefs.current[userId];
        if (cursorElement && cursorElement.parentNode) {
          cursorElement.parentNode.removeChild(cursorElement);
        }
        delete cursorRefs.current[userId];
      }
    });
  }, [users]);

  // Cleanup function for unmounted cursors
  useEffect(() => {
    return () => {
      // Clean up all cursor refs on unmount
      Object.values(cursorRefs.current).forEach(element => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      cursorRefs.current = {};
    };
  }, []);

  return (
    <div className="relative">
      {/* Remote cursors will be positioned here */}
      {users
        .filter(user => user.id !== currentUserId && user.cursor)
        .map(user => (
          <div
            key={user.id}
            ref={el => {
              if (el) cursorRefs.current[user.id] = el;
            }}
            className="absolute pointer-events-none z-50 transition-all duration-100 ease-out"
            style={{
              left: user.cursor.x,
              top: user.cursor.y,
              transform: 'translate(-2px, -2px)'
            }}
          >
            {/* Cursor */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              className="drop-shadow-lg"
            >
              <path
                d="M2 2L8 16L11 10L16 12L2 2Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            
            {/* User label */}
            <div
              className="absolute top-4 left-2 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        ))}
    </div>
  );
};

export default CursorTracker;
