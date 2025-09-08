import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditFriendModal } from "./edit-friend-modal";
import type { Friend } from "@shared/schema";

interface FriendCardProps {
  friend: Friend;
  onFindGifts: () => void;
}

export function FriendCard({ friend, onFindGifts }: FriendCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFullProfilePic, setShowFullProfilePic] = useState(false);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Recently";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getInitialColor = (name: string) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-purple-500', 'bg-orange-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4">
        {friend.profilePicture ? (
          <div 
            className="relative mr-3 cursor-pointer group"
            onMouseEnter={() => setShowFullProfilePic(true)}
            onMouseLeave={() => setShowFullProfilePic(false)}
          >
            <img 
              src={friend.profilePicture} 
              alt={friend.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Full profile picture overlay on hover */}
            {showFullProfilePic && (
              <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 transition-opacity duration-300">
                <div className="max-w-2xl max-h-full p-4">
                  <img 
                    src={friend.profilePicture} 
                    alt={friend.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`w-12 h-12 ${getInitialColor(friend.name)} rounded-full flex items-center justify-center text-white font-semibold mr-3`}>
            {getInitials(friend.name)}
          </div>
        )}
        <div>
          <div className="font-medium">{friend.name}</div>
          <div className="text-sm text-gray-500">
            {friend.country} • Added {getTimeAgo(friend.createdAt)}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">Personality Traits</div>
        <div className="flex flex-wrap gap-2">
          {friend.personalityTraits.slice(0, 3).map((trait) => (
            <span key={trait} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {trait}
            </span>
          ))}
          {friend.personalityTraits.length > 3 && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              +{friend.personalityTraits.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">Interests</div>
        <div className="flex flex-wrap gap-2">
          {friend.interests.slice(0, 3).map((interest) => (
            <span key={interest} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              {interest}
            </span>
          ))}
          {friend.interests.length > 3 && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              +{friend.interests.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        <Button 
          onClick={onFindGifts}
          className="flex-1 bg-primary hover:bg-indigo-700 text-white text-sm"
        >
          Find Gifts
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
          <Edit size={16} />
        </Button>
      </div>
      
      <EditFriendModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        friend={friend}
      />
    </div>
  );
}
