import { useState } from 'react';
import { Bell, BellRing, Plus } from 'lucide-react';

interface AlarmIconProps {
  friendId: string;
  friendName: string;
  hasReminders?: boolean;
  onCreateReminder: (friendId: string) => void;
  className?: string;
}

export function AlarmIcon({ 
  friendId, 
  friendName, 
  hasReminders = false, 
  onCreateReminder,
  className = "" 
}: AlarmIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    onCreateReminder(friendId);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative p-2 rounded-full transition-all duration-200 hover:bg-gray-100 group ${className}`}
    >
      {hasReminders ? (
        <BellRing 
          size={18} 
          className="text-yellow-600 group-hover:text-yellow-700 transition-colors duration-200" 
        />
      ) : (
        <div className="relative">
          <Bell 
            size={18} 
            className="text-gray-400 group-hover:text-blue-600 transition-colors duration-200" 
          />
          {isHovered && (
            <Plus 
              size={10} 
              className="absolute -top-1 -right-1 text-blue-600 bg-white rounded-full border border-blue-600" 
            />
          )}
        </div>
      )}
      
      {/* Tooltip - only appears on hover */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
          {hasReminders ? 'Manage reminders' : 'Set gift reminder'}
        </div>
      )}
    </button>
  );
}