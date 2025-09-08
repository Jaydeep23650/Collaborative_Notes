import React from 'react';

const UserPresence = ({ users, currentUser }) => {
  // Ensure users is always an array
  const usersArray = Array.isArray(users) ? users : [];
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span>👥</span>
        Active Collaborators ({usersArray.length})
      </h3>
      
      <div className="space-y-3">
        {usersArray.map((user) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              user.id === currentUser?.id 
                ? 'bg-primary-50 border border-primary-200' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {/* User Avatar */}
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              
              {/* Typing indicator */}
              {user.isTyping && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-800 truncate">
                  {user.name}
                  {user.id === currentUser?.id && (
                    <span className="text-primary-600 text-xs ml-1">(You)</span>
                  )}
                </p>
              </div>
              
              {/* Status */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Online</span>
                {user.isTyping && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 animate-pulse">Typing...</span>
                  </>
                )}
              </div>
            </div>
            
            {/* User Color Indicator */}
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: user.color }}
              title={`${user.name}'s color`}
            ></div>
          </div>
        ))}
      </div>
      
      {usersArray.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">👤</div>
          <p>No other collaborators</p>
          <p className="text-sm">Share the link to invite others!</p>
        </div>
      )}
    </div>
  );
};

export default UserPresence;
