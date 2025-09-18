import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Friend, GiftRecommendation, SavedGift } from "@shared/schema";
import { FriendForm } from "../components/FriendForm";
import { GiftWrappingAnimation } from "../components/gift-wrapping-animation";
import { AuthModal } from "../components/auth-modal";

function Home() {
  const [activeTab, setActiveTab] = useState("friends");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [recommendations, setRecommendations] = useState<GiftRecommendation[]>([]);
  const [budget, setBudget] = useState("£50");
  const [budgetValue, setBudgetValue] = useState(50); // Numeric value for slider
  const [showFriendForm, setShowFriendForm] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [recommendationsForFriend, setRecommendationsForFriend] = useState<Friend | null>(null); // Track who recommendations are for
  const [dropdownOpen, setDropdownOpen] = useState<{[key: string]: boolean}>({});
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const queryClient = useQueryClient();

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

  // Update budget format when friend/currency changes
  useEffect(() => {
    if (selectedFriend && budget) {
      // Update budget to use correct currency symbol if it contains a currency symbol
      const numericPart = budget.replace(/[^\d]/g, '');
      if (numericPart) {
        setBudget(`${currencySymbol}${numericPart}`);
      }
    }
  }, [selectedFriend?.currency, currencySymbol]);

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: async (): Promise<Friend[]> => {
      const response = await fetch("/api/friends");
      if (!response.ok) throw new Error("Failed to fetch friends");
      return response.json();
    },
  });

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
      const response = await fetch("/api/gift-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId, budget }),
      });
      if (!response.ok) throw new Error("Failed to generate recommendations");
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendations(data);
      setRecommendationsForFriend(selectedFriend);
      setActiveTab("recommendations");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedGifts"] });
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
      generateRecommendationsMutation.mutate({
        friendId: selectedFriend.id,
        budget,
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
              {currentUser ? (
                <span>Welcome back, <strong>{currentUser.username}</strong>!</span>
              ) : (
                <span>You're browsing as a guest</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentUser ? (
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
              {["friends", "generate", "recommendations", "saved"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
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
                          setSelectedFriend(friend);
                          setActiveTab("generate");
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
                      setSelectedFriend(friend || null);
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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Budget: {currencySymbol}{budgetValue} {currentCurrency !== 'USD' ? `(${currentCurrency})` : ''}
                  </label>
                  
                  {/* Budget slider */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Drag to adjust budget</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={budgetValue}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setBudgetValue(value);
                        setBudget(`${currencySymbol}${value}`);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{currencySymbol}10</span>
                      <span>{currencySymbol}100</span>
                      <span>{currencySymbol}250</span>
                      <span>{currencySymbol}500</span>
                    </div>
                  </div>

                  {/* Quick budget buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[25, 50, 100, 200].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setBudgetValue(amount);
                          setBudget(`${currencySymbol}${amount}`);
                        }}
                        className={`px-3 py-2 rounded-md text-sm ${
                          budgetValue === amount
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
                    <label className="block text-xs text-gray-500 mb-1">Or enter custom budget:</label>
                    <input
                      type="text"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder={`e.g., ${currencySymbol}50, ${currencySymbol}100-200, under ${currencySymbol}30`}
                      className="w-full p-2 border rounded-md text-sm"
                    />
                  </div>
                </div>

                {selectedFriend && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Friend Profile:</h3>
                    <p><strong>Name:</strong> {selectedFriend.name}</p>
                    <p><strong>Country:</strong> {selectedFriend.country}</p>
                    <p><strong>Currency:</strong> {selectedFriend.currency}</p>
                    <p><strong>Interests:</strong> {selectedFriend.interests.join(", ")}</p>
                    <p><strong>Personality:</strong> {selectedFriend.personalityTraits.join(", ")}</p>
                    {selectedFriend.notes && (
                      <p><strong>Notes:</strong> {selectedFriend.notes}</p>
                    )}
                  </div>
                )}

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
                      <div key={savedGift.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{savedGift.giftData.name}</h3>
                          <div className="flex gap-1">
                            <span className="text-sm text-gray-500">
                              For {friend?.name || "Unknown"}
                            </span>
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to remove this saved gift?")) {
                                  deleteSavedGiftMutation.mutate(savedGift.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 ml-2"
                              title="Remove saved gift"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{savedGift.giftData.description}</p>
                        <p className="font-semibold text-blue-600 mb-2">{savedGift.giftData.price}</p>
                        <div className="flex gap-2">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {savedGift.giftData.matchPercentage}% match
                          </span>
                          {savedGift.giftData.shops.length > 0 && (
                            <div className="relative">
                              {savedGift.giftData.shops.length === 1 ? (
                                <button
                                  onClick={() => window.open(savedGift.giftData.shops[0].url, "_blank")}
                                  className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                                >
                                  Shop at {savedGift.giftData.shops[0].name}
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDropdown(index, 'saved');
                                    }}
                                    className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                                  >
                                    Shop ({savedGift.giftData.shops.length}) ▼
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
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
