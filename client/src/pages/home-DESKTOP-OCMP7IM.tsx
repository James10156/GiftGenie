import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, UserPlus, Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddFriendModal } from "../components/add-friend-modal";
import { FriendCard } from "../components/friend-card";
import { GiftFinder } from "../components/gift-finder";
import { GiftCard } from "../components/gift-card";
import type { Friend, GiftRecommendation } from "@shared/schema";

export default function Home() {
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [recommendations, setRecommendations] = useState<GiftRecommendation[]>([]);

  const { data: friends = [], isLoading: isLoadingFriends } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriend(friend);
    setRecommendations([]);
  };

  const handleRecommendationsGenerated = (newRecommendations: GiftRecommendation[]) => {
    setRecommendations(newRecommendations);
  };

  return (
    <div className="min-h-screen bg-custom-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary">
                  <Gift className="inline mr-2" size={24} />
                  GiftMate
                </h1>
              </div>
            </div>
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#" className="text-gray-900 hover:text-primary px-3 py-2 text-sm font-medium">Discover</a>
                <a href="#" className="text-gray-500 hover:text-primary px-3 py-2 text-sm font-medium">My Friends</a>
                <a href="#" className="text-gray-500 hover:text-primary px-3 py-2 text-sm font-medium">Saved Gifts</a>
              </div>
            </nav>
            <div className="flex items-center">
              <Button 
                onClick={() => setIsAddFriendModalOpen(true)}
                className="bg-primary hover:bg-indigo-700 text-white"
              >
                <UserPlus className="mr-2" size={16} />
                Add Friend
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 mb-12 text-white">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Find the Perfect Gift for Every Friend</h2>
            <p className="text-lg mb-6 text-indigo-100">Use AI to discover personalized gift suggestions based on personality traits, interests, and your budget.</p>
            <Button 
              className="bg-white text-primary hover:bg-gray-50"
              onClick={() => document.getElementById('gift-finder')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start Gift Discovery <Search className="ml-2" size={16} />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div 
            className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setIsAddFriendModalOpen(true)}
          >
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <UserPlus className="text-primary" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Add a Friend</h3>
            <p className="text-gray-600">Create a profile with personality traits and interests</p>
          </div>
          
          <div 
            className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => document.getElementById('gift-finder')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Search className="text-secondary" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Find Gifts</h3>
            <p className="text-gray-600">Get AI-powered recommendations for any friend</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Heart className="text-accent" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Saved Ideas</h3>
            <p className="text-gray-600">View your favorite gift suggestions</p>
          </div>
        </div>

        {/* Gift Finder Interface */}
        <div id="gift-finder">
          <GiftFinder 
            friends={friends}
            selectedFriend={selectedFriend}
            onFriendSelect={handleFriendSelect}
            onRecommendationsGenerated={handleRecommendationsGenerated}
          />
        </div>

        {/* Gift Recommendations */}
        {recommendations.length > 0 && selectedFriend && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gift Recommendations for {selectedFriend.name}</h3>
                <p className="text-gray-600">
                  Based on {selectedFriend.personalityTraits.join(" & ")} personality
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((gift, index) => (
                <GiftCard 
                  key={index} 
                  gift={gift} 
                  friendId={selectedFriend.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* My Friends Section */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">My Friends</h3>
            <Button variant="ghost" className="text-primary hover:text-indigo-700">
              View All <Search className="ml-1" size={16} />
            </Button>
          </div>

          {isLoadingFriends ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading friends...</div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No friends added yet</div>
              <Button 
                onClick={() => setIsAddFriendModalOpen(true)}
                className="bg-primary hover:bg-indigo-700 text-white"
              >
                <UserPlus className="mr-2" size={16} />
                Add Your First Friend
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.slice(0, 3).map((friend: Friend) => (
                <FriendCard 
                  key={friend.id} 
                  friend={friend}
                  onFindGifts={() => handleFriendSelect(friend)}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Add Friend Modal */}
      <AddFriendModal 
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />
    </div>
  );
}
