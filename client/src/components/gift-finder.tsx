import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Friend, GiftRecommendation } from "@shared/schema";

interface GiftFinderProps {
  friends: Friend[];
  selectedFriend: Friend | null;
  onFriendSelect: (friend: Friend) => void;
  onRecommendationsGenerated: (recommendations: GiftRecommendation[]) => void;
}

export function GiftFinder({ 
  friends, 
  selectedFriend, 
  onFriendSelect, 
  onRecommendationsGenerated 
}: GiftFinderProps) {
  const [budget, setBudget] = useState([75]);
  const [customBudget, setCustomBudget] = useState("");
  const [useCustomBudget, setUseCustomBudget] = useState(false);
  const [hoveredProfileIndex, setHoveredProfileIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Auto-switch to custom budget if value exceeds 500
  const handleCustomBudgetChange = (value: string) => {
    setCustomBudget(value);
    const numValue = parseInt(value);
    if (numValue > 500) {
      setUseCustomBudget(true);
    } else if (value === "") {
      setUseCustomBudget(false);
    }
  };

  // Handle slider changes - clear custom budget when slider is used
  const handleSliderChange = (value: number[]) => {
    setBudget(value);
    if (customBudget) {
      setCustomBudget("");
      setUseCustomBudget(false);
    }
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols: { [key: string]: string } = {
      USD: "$", EUR: "€", GBP: "£", CAD: "C$", AUD: "A$", 
      JPY: "¥", KRW: "₩", BRL: "R$", MXN: "MX$", INR: "₹"
    };
    return symbols[currency] || "$";
  };

  const generateRecommendationsMutation = useMutation({
    mutationFn: async ({ friendId, budget }: { friendId: string; budget: number }) => {
      const response = await apiRequest("POST", "/api/gift-recommendations", {
        friendId,
        budget,
      });
      return response.json();
    },
    onSuccess: (recommendations) => {
      onRecommendationsGenerated(recommendations);
      toast({
        title: "Gift recommendations generated!",
        description: `Found ${recommendations.length} personalized gift ideas.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating recommendations",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateRecommendations = () => {
    if (!selectedFriend) {
      toast({
        title: "Please select a friend",
        description: "Choose a friend to generate gift recommendations for.",
        variant: "destructive",
      });
      return;
    }

    const finalBudget = customBudget && parseInt(customBudget) > 0
      ? parseInt(customBudget) 
      : budget[0];

    console.log("BUDGET DEBUG:", { customBudget, budget: budget[0], finalBudget });

    if (customBudget && (isNaN(parseInt(customBudget)) || parseInt(customBudget) <= 0)) {
      toast({
        title: "Invalid budget",
        description: "Please enter a valid budget amount.",
        variant: "destructive",
      });
      return;
    }

    generateRecommendationsMutation.mutate({
      friendId: selectedFriend.id,
      budget: finalBudget,
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getInitialColor = (name: string) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-purple-500', 'bg-orange-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 mb-12">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-900">Find the Perfect Gift 🎁</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">AI-Powered</span>
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Friend Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">Choose a Friend</label>
        {friends.length === 0 ? (
          <div className="text-center py-8 border rounded-xl border-dashed">
            <p className="text-gray-500 mb-4">No friends added yet</p>
            <p className="text-sm text-gray-400">Add a friend first to get personalized gift recommendations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {friends.map((friend, index) => (
              <div
                key={friend.id}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-colors ${
                  selectedFriend?.id === friend.id
                    ? 'border-primary bg-primary bg-opacity-5'
                    : 'border-gray-200 hover:border-primary hover:bg-primary hover:bg-opacity-5'
                }`}
                onClick={() => onFriendSelect(friend)}
              >
                <div className="flex items-center">
                  {friend.profilePicture ? (
                    <div 
                      className="relative mr-3 cursor-pointer group"
                      onMouseEnter={() => setHoveredProfileIndex(index)}
                      onMouseLeave={() => setHoveredProfileIndex(null)}
                    >
                      <img 
                        src={friend.profilePicture} 
                        alt={friend.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Full profile picture overlay on hover */}
                      {hoveredProfileIndex === index && (
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
                    <div className={`w-10 h-10 ${getInitialColor(friend.name)} rounded-full flex items-center justify-center text-white font-semibold mr-3`}>
                      {getInitials(friend.name)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{friend.name}</div>
                    <div className="text-sm text-gray-500">
                      {friend.country} • {friend.personalityTraits.slice(0, 2).join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Selection - SIMPLIFIED FOR TESTING */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">Budget Amount</label>
        <div className="bg-red-100 rounded-xl p-6 border-4 border-red-500">
          <h2 className="text-2xl font-bold text-red-600 mb-4">SLIDER REMOVED - TESTING MODE</h2>
          
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Enter your budget:</label>
            <input
              type="number"
              value={customBudget || budget[0]}
              onChange={(e) => setCustomBudget(e.target.value)}
              placeholder="Enter any budget amount (no limits!)"
              className="w-full px-4 py-3 border-2 border-red-300 rounded-lg text-xl font-bold bg-yellow-100"
              min="1"
            />
            <p className="text-lg font-bold text-red-600">
              Current Budget: {getCurrencySymbol(selectedFriend?.currency || "USD")}
              {customBudget || budget[0]}
            </p>
            <p className="text-sm text-red-500">
              If you can see this red box, hot reload is working!
            </p>
          </div>
        </div>
      </div>

      {/* Generate Recommendations Button */}
      <div className="text-center">
        <Button
          onClick={handleGenerateRecommendations}
          disabled={!selectedFriend || generateRecommendationsMutation.isPending}
          className="bg-gradient-to-r from-primary to-secondary hover:from-indigo-700 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
        >
          {generateRecommendationsMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating Ideas...
            </>
          ) : (
            <>
              <Sparkles className="mr-2" size={20} />
              Generate Gift Ideas
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
