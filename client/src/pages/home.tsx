import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Friend, GiftRecommendation, SavedGift } from "@shared/schema";
import { FriendForm } from "../components/FriendForm";
import { GiftWrappingAnimation } from "../components/gift-wrapping-animation";
import { AuthModal } from "../components/auth-modal";
import { AnalyticsDashboard } from "../components/analytics-dashboard";
import { useAnalytics, usePageTracking, usePerformanceTracking, useEngagementTracking } from "../hooks/use-analytics";

function Home() {
  const [activeTab, setActiveTab] = useState("friends");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [recommendations, setRecommendations] = useState<GiftRecommendation[]>([]);
  const [budget, setBudget] = useState("50"); // Store just the numeric part
  const [customBudget, setCustomBudget] = useState(""); // Custom budget input for values > 500
  const [useCustomBudget, setUseCustomBudget] = useState(false); // Whether to use custom budget
  const [showFriendForm, setShowFriendForm] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [recommendationsForFriend, setRecommendationsForFriend] = useState<Friend | null>(null); // Track who recommendations are for
  const [dropdownOpen, setDropdownOpen] = useState<{[key: string]: boolean}>({});
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);
  const [focusedImage, setFocusedImage] = useState<{src: string, alt: string} | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [giftFeedback, setGiftFeedback] = useState<{[key: string]: { rating: number | null, feedback: string, showFeedback: boolean }}>({});
  const queryClient = useQueryClient();

  // Analytics hooks
  const { trackClick, trackGiftGeneration, trackGiftSave, submitFeedback } = useAnalytics();
  const { trackOperation } = usePerformanceTracking();
  const { trackBudgetChange, trackTabSwitch, trackFriendSelect, trackFeatureUsage } = useEngagementTracking();
  
  // Track page view
  usePageTracking("home");

  // Helper function for tab switching with analytics
  const switchTab = (newTab: string) => {
    trackTabSwitch(activeTab, newTab);
    setActiveTab(newTab);
  };

  // Helper function for friend selection with analytics
  const selectFriend = (friend: Friend | null) => {
    if (friend) {
      trackFriendSelect(friend.id, friend.name);
    }
    setSelectedFriend(friend);
  };

  // Helper functions for gift feedback
  const getGiftId = (gift: GiftRecommendation, index: number) => `${gift.name}-${index}`;

  const handleGiftRating = (gift: GiftRecommendation, index: number, rating: number) => {
    const giftId = getGiftId(gift, index);
    setGiftFeedback(prev => ({
      ...prev,
      [giftId]: {
        ...prev[giftId],
        rating,
        showFeedback: rating === -1, // Show feedback form for thumbs down
      }
    }));

    // Submit basic rating immediately
    if (recommendationsForFriend) {
      submitFeedback({
        friendId: recommendationsForFriend.id,
        recommendationData: {
          giftName: gift.name,
          price: gift.price,
          matchPercentage: gift.matchPercentage,
          generationParams: {
            budget: getEffectiveBudget(),
            currency: recommendationsForFriend.currency,
            personalityTraits: recommendationsForFriend.personalityTraits,
            interests: recommendationsForFriend.interests,
          },
        },
        rating,
        helpful: rating === 1,
      });
    }

    trackClick('gift_rating', { 
      giftName: gift.name, 
      rating: rating === 1 ? 'thumbs_up' : 'thumbs_down',
      friendId: recommendationsForFriend?.id 
    });
  };

  const handleDetailedFeedback = (gift: GiftRecommendation, index: number, feedback: string) => {
    const giftId = getGiftId(gift, index);
    const currentRating = giftFeedback[giftId]?.rating || -1;
    
    if (recommendationsForFriend) {
      submitFeedback({
        friendId: recommendationsForFriend.id,
        recommendationData: {
          giftName: gift.name,
          price: gift.price,
          matchPercentage: gift.matchPercentage,
          generationParams: {
            budget: getEffectiveBudget(),
            currency: recommendationsForFriend.currency,
            personalityTraits: recommendationsForFriend.personalityTraits,
            interests: recommendationsForFriend.interests,
          },
        },
        rating: currentRating,
        feedback,
        helpful: false,
      });
    }

    // Hide feedback form after submission
    setGiftFeedback(prev => ({
      ...prev,
      [giftId]: {
        ...prev[giftId],
        showFeedback: false,
      }
    }));

    trackClick('detailed_feedback_submit', { 
      giftName: gift.name, 
      feedbackLength: feedback.length,
      friendId: recommendationsForFriend?.id 
    });
  };

  // Check current user on load
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        }
      } catch (error) {
        // User not logged in, no problem
      }
    };
    checkUser();
  }, []);

  // Logout function
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["savedGifts"] });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Helper function to toggle dropdown
  const toggleDropdown = (giftIndex: number, section: string = 'generated') => {
    const key = `${section}-${giftIndex}`;
    setDropdownOpen(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen({});
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Helper function to extract numeric value from budget string
  const extractBudgetValue = (budgetString: string): number => {
    // Remove currency symbols and extract first number
    const numericPart = budgetString.replace(/[^\d]/g, '');
    const value = parseInt(numericPart) || 50; // Default to 50 if no valid number
    const clampedValue = Math.min(Math.max(value, 10), 500); // Clamp between 10 and 500 for slider
    return clampedValue;
  };

  // Get the effective budget value (custom budget takes precedence if > 500)
  const getEffectiveBudget = (): number => {
    if (useCustomBudget && customBudget) {
      const customValue = parseInt(customBudget);
      if (!isNaN(customValue) && customValue > 0) {
        return customValue;
      }
    }
    return extractBudgetValue(budget);
  };

  // Get the current numeric budget value for the slider (always clamped to 500)
  const currentBudgetValue = extractBudgetValue(budget);

  // Helper function to update slider budget value
  const updateBudget = (value: number) => {
    const oldValue = currentBudgetValue;
    const clampedValue = Math.min(Math.max(value, 10), 500);
    setBudget(clampedValue.toString());
    
    // Clear custom budget when using slider
    if (customBudget) {
      setCustomBudget("");
      setUseCustomBudget(false);
    }
    
    // Track budget changes for analytics
    if (oldValue !== clampedValue) {
      trackBudgetChange(oldValue, clampedValue, currentCurrency);
    }
  };

  // Helper function to handle custom budget changes
  const handleCustomBudgetChange = (value: string) => {
    setCustomBudget(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 500) {
      setUseCustomBudget(true);
    } else if (value === "") {
      setUseCustomBudget(false);
    }
  };

  // Get formatted budget string with currency symbol
  const getFormattedBudget = () => {
    const effectiveBudget = getEffectiveBudget();
    const formatted = `${currencySymbol}${effectiveBudget}`;
    return formatted;
  };

  // Helper function to get currency symbol
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'INR': '₹',
      'BRL': 'R$',
      'KRW': '₩',
      'MXN': '$',
      'RUB': '₽',
      'ZAR': 'R',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'PLN': 'zł',
      'TRY': '₺',
      'THB': '฿',
    };
    return symbols[currency] || currency;
  };

  // Get current currency based on selected friend
  const currentCurrency = selectedFriend?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currentCurrency);

  // No need for complex effects - budget state is now just the numeric value
  // The formatted budget is computed on the fly

  // Keyboard handler for image focus modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focusedImage) {
        setFocusedImage(null);
      }
    };

    if (focusedImage) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [focusedImage]);

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: async (): Promise<Friend[]> => {
      const response = await fetch("/api/friends");
      if (!response.ok) throw new Error("Failed to fetch friends");
      return response.json();
    },
  });

  // Update selectedFriend when friends data changes (e.g., after editing)
  useEffect(() => {
    if (selectedFriend && friends.length > 0) {
      const updatedSelectedFriend = friends.find(f => f.id === selectedFriend.id);
      if (updatedSelectedFriend && JSON.stringify(updatedSelectedFriend) !== JSON.stringify(selectedFriend)) {
        setSelectedFriend(updatedSelectedFriend);
      }
    }
  }, [friends, selectedFriend]);

  // Fetch saved gifts
  const { data: savedGifts = [] } = useQuery({
    queryKey: ["savedGifts"],
    queryFn: async (): Promise<SavedGift[]> => {
      const response = await fetch("/api/saved-gifts");
      if (!response.ok) throw new Error("Failed to fetch saved gifts");
      return response.json();
    },
  });

  // Generate gift recommendations
  const generateRecommendationsMutation = useMutation({
    mutationFn: async ({ friendId, budget }: { friendId: string; budget: string }) => {
      return trackOperation('ai_recommendation', async () => {
        const response = await fetch("/api/gift-recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId, budget }),
        });
        if (!response.ok) throw new Error("Failed to generate recommendations");
        return response.json();
      }, {
        friendId,
        budget,
        personalityTraits: selectedFriend?.personalityTraits,
        interests: selectedFriend?.interests,
      });
    },
    onSuccess: (data) => {
      setRecommendations(data);
      setRecommendationsForFriend(selectedFriend);
      
      // Track successful gift generation
      if (selectedFriend) {
        trackGiftGeneration(selectedFriend, parseInt(budget), selectedFriend.currency);
      }
      
      switchTab("recommendations");
    },
  });

  // Save gift mutation
  const saveGiftMutation = useMutation({
    mutationFn: async ({ friendId, giftData }: { friendId: string; giftData: any }) => {
      const response = await fetch("/api/saved-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId, giftData }),
      });
      if (!response.ok) throw new Error("Failed to save gift");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savedGifts"] });
      
      // Track gift save for analytics
      trackGiftSave(variables.giftData, variables.friendId);
      trackFeatureUsage('save_gift', {
        giftName: variables.giftData.name,
        giftPrice: variables.giftData.price,
      });
    },
  });

  // Delete friend mutation
  const deleteFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete friend");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["savedGifts"] });
    },
  });

  // Delete saved gift mutation
  const deleteSavedGiftMutation = useMutation({
    mutationFn: async (giftId: string) => {
      const response = await fetch(`/api/saved-gifts/${giftId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete saved gift");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedGifts"] });
    },
  });

  const handleGenerateRecommendations = () => {
    if (selectedFriend && budget) {
      const formattedBudget = getFormattedBudget();
      generateRecommendationsMutation.mutate({
        friendId: selectedFriend.id,
        budget: formattedBudget,
      });
    }
  };

  const handleSaveGift = (gift: GiftRecommendation) => {
    if (selectedFriend) {
      saveGiftMutation.mutate({
        friendId: selectedFriend.id,
        giftData: gift,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with authentication */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {currentUser && currentUser.username !== 'Guest' ? (
                <span>Welcome back, <strong>{currentUser.username}</strong>!</span>
              ) : (
                <span>You're browsing as a guest</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentUser && currentUser.username !== 'Guest' ? (
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            🎁 Gift Genie
          </h1>
          <p className="text-xl text-center text-gray-600 mb-12">
            Find the perfect gift for your friends with AI-powered recommendations
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              {["friends", "generate", "recommendations", "saved", ...(currentUser?.isAdmin ? ["analytics"] : [])].map((tab) => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`px-4 py-2 rounded-md capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab === "generate" ? "Generate Gifts" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Friends Tab */}
          {activeTab === "friends" && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">👥 Your Friends</h2>
                <button 
                  onClick={() => setShowFriendForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Friend
                </button>
              </div>
              
              {friendsLoading ? (
                <div className="text-center py-8">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No friends added yet. Add your first friend to get started!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend, index) => (
                    <div
                      key={friend.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center mb-3">
                        {friend.profilePicture ? (
                          <div className="w-16 h-16 mr-4 rounded-full transition-all duration-300 hover:scale-125 hover:shadow-lg ring-2 ring-blue-200 hover:ring-blue-400">
                            <img
                              src={friend.profilePicture}
                              alt={friend.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-full mr-4 flex items-center justify-center text-xl transition-all duration-300 hover:scale-125 hover:shadow-lg">
                            👤
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{friend.name}</h3>
                          <p className="text-sm text-gray-500">{friend.country}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingFriend(friend);
                              setShowFriendForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit friend"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${friend.name}?`)) {
                                deleteFriendMutation.mutate(friend.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete friend"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">Interests:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {friend.interests.slice(0, 3).map((interest, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {interest}
                            </span>
                          ))}
                          {friend.interests.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{friend.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">Personality:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {friend.personalityTraits.slice(0, 2).map((trait, index) => (
                            <span
                              key={index}
                              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                            >
                              {trait}
                            </span>
                          ))}
                          {friend.personalityTraits.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{friend.personalityTraits.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          selectFriend(friend);
                          switchTab("generate");
                        }}
                        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm"
                      >
                        Generate Gifts
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generate Tab */}
          {activeTab === "generate" && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-6">🤖 Generate Gift Recommendations</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Friend</label>
                  <select
                    value={selectedFriend?.id || ""}
                    onChange={(e) => {
                      const friend = friends.find(f => f.id === e.target.value);
                      selectFriend(friend || null);
                    }}
                    className="w-full p-3 border rounded-md"
                  >
                    <option value="">Choose a friend...</option>
                    {friends.map((friend) => (
                      <option key={friend.id} value={friend.id}>
                        {friend.name}
                      </option>
                    ))}
                  </select>

                  {/* Selected Friend Display */}
                  {selectedFriend && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 shadow-sm">
                      <div className="flex items-start gap-6">
                        {selectedFriend.profilePicture ? (
                          <div className="w-20 h-20 rounded-full border-3 border-white shadow-lg ring-2 ring-blue-200 flex-shrink-0">
                            <img
                              src={selectedFriend.profilePicture}
                              alt={selectedFriend.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-xl font-bold border-3 border-white shadow-lg flex-shrink-0">
                            {selectedFriend.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold text-gray-800">
                              {selectedFriend.name}
                            </h3>
                            <button
                              onClick={() => {
                                setEditingFriend(selectedFriend);
                                setShowFriendForm(true);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                              title="Edit friend"
                            >
                              <span>✏️</span>
                              Edit
                            </button>
                          </div>
                          
                          {/* Location & Currency */}
                          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              <strong>{selectedFriend.country}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>💰</span>
                              <strong>{selectedFriend.currency}</strong>
                            </span>
                          </div>

                          {/* Interests */}
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Interests</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedFriend.interests.map((interest, i) => (
                                <span key={i} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Personality Traits */}
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Personality</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedFriend.personalityTraits.map((trait, i) => (
                                <span key={i} className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full border border-green-200">
                                  {trait}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Notes */}
                          {selectedFriend.notes && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 italic">
                                "{selectedFriend.notes}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Budget: {getFormattedBudget()} {currentCurrency !== 'USD' ? `(${currentCurrency})` : ''}
                  </label>
                  
                  {/* Budget slider */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">
                        {useCustomBudget && parseInt(customBudget) > 500 
                          ? "Slider disabled - using custom amount above $500" 
                          : "Drag to adjust budget"
                        }
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={10}
                      value={currentBudgetValue}
                      onChange={(e) => {
                        const value = Math.max(10, parseInt(e.target.value)); // Ensure minimum of 10
                        updateBudget(value);
                      }}
                      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${
                        useCustomBudget && parseInt(customBudget) > 500 ? 'opacity-50' : ''
                      }`}
                      disabled={useCustomBudget && parseInt(customBudget) > 500}
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #10B981 ${(currentBudgetValue / 500) * 100}%, #E5E7EB ${(currentBudgetValue / 500) * 100}%, #E5E7EB 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2 relative">
                      <span className="absolute left-0 transform -translate-x-1/2">{currencySymbol}0</span>
                      <span className="absolute left-1/2 transform -translate-x-1/2">{currencySymbol}250</span>
                      <span className="absolute right-0 transform translate-x-1/2">{currencySymbol}500</span>
                    </div>
                  </div>

                  {/* Quick budget buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[25, 50, 100, 200].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          updateBudget(amount);
                        }}
                        className={`px-3 py-2 rounded-md text-sm ${
                          currentBudgetValue === amount
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {currencySymbol}{amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom budget input */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {useCustomBudget && parseInt(customBudget) > 500 
                        ? `Custom budget (overriding slider): ${currencySymbol}${customBudget}`
                        : "Or enter custom budget:"
                      }
                    </label>
                    <input
                      type="text"
                      value={useCustomBudget && customBudget ? customBudget : getFormattedBudget()}
                      onChange={(e) => {
                        const newValue = e.target.value.replace(/[^\d]/g, ''); // Extract just numbers
                        if (newValue === "") {
                          handleCustomBudgetChange("");
                        } else {
                          const numericValue = parseInt(newValue);
                          if (numericValue > 500) {
                            handleCustomBudgetChange(newValue);
                          } else {
                            // For values <= 500, update the slider instead
                            updateBudget(numericValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const numericValue = e.target.value.replace(/[^\d]/g, '');
                        if (numericValue === "") {
                          handleCustomBudgetChange("");
                        } else {
                          const value = parseInt(numericValue);
                          if (value > 500) {
                            handleCustomBudgetChange(numericValue);
                          } else {
                            updateBudget(value);
                          }
                        }
                      }}
                      placeholder={`e.g., 50, 100, 750 (values over 500 override slider)`}
                      className="w-full p-2 border rounded-md text-sm"
                    />
                    {useCustomBudget && parseInt(customBudget) > 500 && (
                      <p className="text-xs text-blue-600 mt-1">
                        ✓ Using custom budget: {currencySymbol}{customBudget} (slider disabled)
                      </p>
                    )}
                  </div>
                </div>

                {/* Loading Animation */}
                {generateRecommendationsMutation.isPending && (
                  <div className="mb-6 flex justify-center">
                    <GiftWrappingAnimation />
                  </div>
                )}

                {/* Generate Button with Loading Bar */}
                <div className="relative">
                  <button
                    onClick={handleGenerateRecommendations}
                    disabled={!selectedFriend || !budget || generateRecommendationsMutation.isPending}
                    className={`w-full py-3 rounded-md transition-all duration-300 relative overflow-hidden ${
                      generateRecommendationsMutation.isPending
                        ? "bg-blue-400 text-white cursor-not-allowed"
                        : !selectedFriend || !budget
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {/* Loading Bar Background */}
                    {generateRecommendationsMutation.isPending && (
                      <div className="absolute inset-0 bg-blue-500">
                        <div className="h-full bg-blue-600 animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer"></div>
                      </div>
                    )}
                    
                    {/* Button Text */}
                    <span className="relative z-10 font-medium">
                      {generateRecommendationsMutation.isPending
                        ? "🎁 Generating Perfect Gifts..."
                        : "Generate Gift Recommendations"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === "recommendations" && (
            <div className="bg-white rounded-lg p-6 shadow-sm" style={{overflow: 'visible'}}>
              <h2 className="text-2xl font-semibold mb-6">💡 Gift Recommendations</h2>
              
              {/* Show who recommendations are for */}
              {recommendationsForFriend && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mb-6 border border-blue-200">
                  <div className="flex items-center gap-4">
                    {recommendationsForFriend.profilePicture ? (
                      <div className="w-20 h-20 rounded-full border-2 border-white shadow-lg transition-all duration-300 hover:scale-125 hover:shadow-xl ring-2 ring-blue-200 hover:ring-blue-400">
                        <img
                          src={recommendationsForFriend.profilePicture}
                          alt={recommendationsForFriend.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-2xl font-bold border-2 border-white shadow-lg transition-all duration-300 hover:scale-125 hover:shadow-xl">
                        {recommendationsForFriend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Recommendations for {recommendationsForFriend.name}
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-block mr-4">📍 {recommendationsForFriend.country}</span>
                        <span className="inline-block mr-4">💰 {recommendationsForFriend.currency}</span>
                        <span className="inline-block">{recommendations.length} gift{recommendations.length !== 1 ? 's' : ''} found</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recommendationsForFriend.interests.slice(0, 3).map((interest, i) => (
                          <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                            {interest}
                          </span>
                        ))}
                        {recommendationsForFriend.interests.length > 3 && (
                          <span className="text-xs text-gray-500">+{recommendationsForFriend.interests.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-6xl mb-4">🎁</div>
                  <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                  <p>Generate some recommendations to see personalized gift ideas here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{overflow: 'visible'}}>
                  {recommendations.map((gift, index) => (
                                        <div key={index} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow relative flex flex-col" style={{overflow: 'visible'}}>
                      {/* Gift Image */}
                      {gift.image && (
                        <div 
                          className="h-48 rounded-t-lg flex-shrink-0 relative cursor-pointer group overflow-hidden"
                          onMouseEnter={() => setHoveredImageIndex(index)}
                          onMouseLeave={() => setHoveredImageIndex(null)}
                          onClick={() => setFocusedImage({src: gift.image, alt: gift.name})}
                        >
                          <img
                            src={gift.image}
                            alt={gift.name}
                            className={`w-full h-full transition-all duration-500 ease-in-out ${
                              hoveredImageIndex === index 
                                ? 'object-contain scale-110' 
                                : 'object-contain hover:scale-105'
                            }`}
                            onError={(e) => {
                              // Fallback to a reliable placeholder if image fails to load
                              const img = e.target as HTMLImageElement;
                              if (img.src !== 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300') {
                                img.src = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300';
                              } else {
                                // If even our fallback fails, use a simple placeholder
                                img.src = `https://via.placeholder.com/400x300/e5e7eb/6b7280?text=${encodeURIComponent(gift.name)}`;
                              }
                            }}
                          />
                          {/* Click to enlarge indicator */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-2">
                              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-4 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg text-gray-800">{gift.name}</h3>
                          <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full font-medium">
                            {gift.matchPercentage}% match
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 leading-relaxed flex-grow">{gift.description}</p>
                        <p className="font-semibold text-blue-600 mb-3 text-lg">{gift.price}</p>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Why this matches:</p>
                          <div className="flex flex-wrap gap-1">
                            {gift.matchingTraits.map((trait, i) => (
                              <span
                                key={i}
                                className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
                              >
                                {trait}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Gift Feedback System */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                          <p className="text-sm font-medium text-gray-700 mb-2">How is this recommendation?</p>
                          <div className="flex items-center gap-3 mb-2">
                            <button
                              onClick={() => handleGiftRating(gift, index, 1)}
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                                giftFeedback[getGiftId(gift, index)]?.rating === 1
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-green-50'
                              }`}
                            >
                              👍 Good match
                            </button>
                            <button
                              onClick={() => handleGiftRating(gift, index, -1)}
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                                giftFeedback[getGiftId(gift, index)]?.rating === -1
                                  ? 'bg-red-100 text-red-700 border border-red-300'
                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-red-50'
                              }`}
                            >
                              👎 Poor match
                            </button>
                          </div>
                          
                          {/* Detailed feedback form for negative ratings */}
                          {giftFeedback[getGiftId(gift, index)]?.showFeedback && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-gray-600">Help us improve - what made this a poor match?</p>
                              <textarea
                                placeholder="e.g., Too expensive, not their style, already have one..."
                                className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                                rows={2}
                                value={giftFeedback[getGiftId(gift, index)]?.feedback || ''}
                                onChange={(e) => {
                                  const giftId = getGiftId(gift, index);
                                  setGiftFeedback(prev => ({
                                    ...prev,
                                    [giftId]: {
                                      ...prev[giftId],
                                      feedback: e.target.value,
                                    }
                                  }));
                                }}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDetailedFeedback(gift, index, giftFeedback[getGiftId(gift, index)]?.feedback || '')}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  Submit feedback
                                </button>
                                <button
                                  onClick={() => {
                                    const giftId = getGiftId(gift, index);
                                    setGiftFeedback(prev => ({
                                      ...prev,
                                      [giftId]: {
                                        ...prev[giftId],
                                        showFeedback: false,
                                      }
                                    }));
                                  }}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                                >
                                  Skip
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={() => handleSaveGift(gift)}
                            disabled={saveGiftMutation.isPending}
                            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-1"
                          >
                            💝 Save Gift
                          </button>
                          {gift.shops && gift.shops.length > 0 && (
                            <div className="flex-1 relative">
                              {gift.shops.length === 1 ? (
                                <button
                                  onClick={() => window.open(gift.shops[0].url, "_blank")}
                                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  🛒 Shop at {gift.shops[0].name}
                                </button>
                              ) : (
                                <div className="relative">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDropdown(index, 'generated');
                                    }}
                                    className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                                  >
                                    🛒 Shop Now ({gift.shops.length} stores) ▼
                                  </button>
                                  {dropdownOpen[`generated-${index}`] && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-50 max-h-60 overflow-y-auto">
                                      {gift.shops.map((shop, shopIndex) => (
                                        <button
                                          key={shopIndex}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(shop.url, "_blank");
                                            setDropdownOpen(prev => ({...prev, [`generated-${index}`]: false}));
                                          }}
                                          className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center justify-between text-sm border-b border-gray-100 last:border-b-0"
                                        >
                                          <span className="font-medium">{shop.name}</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-green-600 font-semibold">{shop.price}</span>
                                            {shop.inStock && (
                                              <span className="text-xs text-green-500">✓ In Stock</span>
                                            )}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === "saved" && (
            <div className="bg-white rounded-lg p-6 shadow-sm" style={{overflow: 'visible'}}>
              <h2 className="text-2xl font-semibold mb-6">💝 Saved Gifts</h2>
              
              {savedGifts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No saved gifts yet. Save some recommendations to see them here!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedGifts.map((savedGift, index) => {
                    const friend = friends.find(f => f.id === savedGift.friendId);
                    return (
                      <div key={savedGift.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        {/* Gift Image */}
                        {savedGift.giftData.image && (
                          <div className="mb-3 cursor-pointer group relative overflow-hidden rounded-md">
                            <img 
                              src={savedGift.giftData.image} 
                              alt={savedGift.giftData.name}
                              className="w-full h-32 object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
                              onClick={() => setFocusedImage({src: savedGift.giftData.image, alt: savedGift.giftData.name})}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            {/* Click to enlarge indicator */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-1">
                                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg">{savedGift.giftData.name}</h3>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to remove this saved gift?")) {
                                deleteSavedGiftMutation.mutate(savedGift.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 ml-2 text-lg"
                            title="Remove saved gift"
                          >
                            🗑️
                          </button>
                        </div>
                        
                        {/* Friend Info with Profile Picture */}
                        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-md">
                          {friend?.profilePicture ? (
                            <img 
                              src={friend.profilePicture} 
                              alt={friend.name}
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(friend.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
                              }}
                            />
                          ) : friend ? (
                            <img 
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(friend.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                              alt={friend.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs text-gray-600">?</span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            For {friend?.name || "Deleted Friend"}
                          </span>
                          {friend ? (
                            <span className="text-xs text-gray-500">
                              ({friend.country})
                            </span>
                          ) : (
                            <span className="text-xs text-orange-500 font-medium">
                              (Friend no longer exists)
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-3">{savedGift.giftData.description}</p>
                        <p className="font-bold text-lg text-blue-600 mb-3">{savedGift.giftData.price}</p>
                        
                        <div className="flex gap-2 mb-3">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                            {savedGift.giftData.matchPercentage}% match
                          </span>
                        </div>
                        
                        {/* Shop buttons */}
                        {savedGift.giftData.shops.length > 0 && (
                          <div className="flex gap-2">
                            {savedGift.giftData.shops.length === 1 ? (
                              <button
                                onClick={() => window.open(savedGift.giftData.shops[0].url, "_blank")}
                                className="flex-1 bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                              >
                                🛒 Shop at {savedGift.giftData.shops[0].name}
                              </button>
                            ) : (
                              <div className="flex-1 relative">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDropdown(index, 'saved');
                                  }}
                                  className="w-full bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  🛒 Shop ({savedGift.giftData.shops.length}) ▼
                                </button>
                                {dropdownOpen[`saved-${index}`] && (
                                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-50 min-w-48 max-h-60 overflow-y-auto">
                                    {savedGift.giftData.shops.map((shop, shopIndex) => (
                                      <button
                                        key={shopIndex}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(shop.url, "_blank");
                                          setDropdownOpen(prev => ({...prev, [`saved-${index}`]: false}));
                                        }}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center justify-between text-xs border-b border-gray-100 last:border-b-0"
                                      >
                                        <span className="font-medium">{shop.name}</span>
                                        <span className="text-green-600 font-semibold">{shop.price}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && currentUser?.isAdmin && (
            <AnalyticsDashboard currentUser={currentUser} />
          )}
          
          {/* Friend Form Modal */}
          {showFriendForm && (
            <FriendForm
              friend={editingFriend || undefined}
              onClose={() => {
                setShowFriendForm(false);
                setEditingFriend(null);
              }}
            />
          )}
        </div>
      </div>

      {/* Image Focus Modal */}
      {focusedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setFocusedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full flex items-center justify-center">
            <img
              src={focusedImage.src}
              alt={focusedImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
            />
            {/* Close button */}
            <button
              onClick={() => setFocusedImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-2 transition-all duration-200 shadow-lg"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Image title */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 text-white p-3 rounded-lg">
              <p className="text-center font-medium">{focusedImage.alt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}

export default Home;
