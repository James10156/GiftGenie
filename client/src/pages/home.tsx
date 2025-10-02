import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Friend, GiftRecommendation, SavedGift } from "@shared/schema";
import { FriendForm } from "../components/FriendForm";
import { GiftWrappingAnimation } from "../components/gift-wrapping-animation";
import { AuthModal } from "../components/auth-modal";
import { AnalyticsDashboard } from "../components/analytics-dashboard";
import { MobileTabsDropdown } from "../components/mobile-tabs-dropdown";
import { useAnalytics, usePageTracking, usePerformanceTracking, useEngagementTracking } from "../hooks/use-analytics";

function Home() {
  // State declarations first
  const [isMobile, setIsMobile] = useState(false);
  const [friendsViewMode, setFriendsViewMode] = useState<'grid' | 'carousel'>(() => {
    // Set initial state based on screen size - no complex logic
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'carousel' : 'grid';
  });
  
  // Mobile detection - only handles screen size, never changes view mode
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [hoveredFriend, setHoveredFriend] = useState<string | null>(null);
  const [expandedMobileFriend, setExpandedMobileFriend] = useState<string | null>(null);
  const [draggedFriend, setDraggedFriend] = useState<string | null>(null);
  const [dragOverFriend, setDragOverFriend] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Touch/swipe support for carousel
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(0);
    setIsDragging(true);
    setIsAnimating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    
    // Calculate real-time offset for smooth dragging
    const offset = currentX - touchStart;
    
    // Only prevent default if this is clearly a horizontal swipe
    if (Math.abs(offset) > 10) {
      e.preventDefault(); // Prevent page scrolling during horizontal swipe
    }
    
    const maxOffset = 150; // Maximum drag distance
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
    setSwipeOffset(clampedOffset);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !isDragging) {
      setIsDragging(false);
      setSwipeOffset(0);
      return;
    }
    
    setIsDragging(false);
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (filteredFriends.length > 0) {
      setIsAnimating(true);
      
      if (Math.abs(distance) > minSwipeDistance) {
        if (distance > 0) {
          // Swipe left - next friend
          setCarouselIndex((carouselIndex + 1) % filteredFriends.length);
        } else {
          // Swipe right - previous friend
          setCarouselIndex((carouselIndex - 1 + filteredFriends.length) % filteredFriends.length);
        }
        
        // Immediately reset offset for smooth continuous transition
        setSwipeOffset(0);
        setIsAnimating(false);
      } else {
        // Snap back to center if swipe wasn't strong enough
        setSwipeOffset(0);
        setIsAnimating(false);
      }
    } else {
      setSwipeOffset(0);
      setIsAnimating(false);
    }
  };

  // Drag and drop handlers for reordering friends
  const handleDragStart = (e: React.DragEvent, friendId: string) => {
    setDraggedFriend(friendId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', friendId);
  };

  const handleDragOver = (e: React.DragEvent, friendId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFriend(friendId);
  };

  const handleDragLeave = () => {
    setDragOverFriend(null);
  };

  const handleDrop = (e: React.DragEvent, targetFriendId: string) => {
    e.preventDefault();
    
    if (!draggedFriend || draggedFriend === targetFriendId) {
      setDraggedFriend(null);
      setDragOverFriend(null);
      return;
    }

    // Find the indices of the dragged and target friends
    const draggedIndex = friends.findIndex(f => f.id === draggedFriend);
    const targetIndex = friends.findIndex(f => f.id === targetFriendId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create a new array with reordered friends
    const newFriends = [...friends];
    const [draggedItem] = newFriends.splice(draggedIndex, 1);
    newFriends.splice(targetIndex, 0, draggedItem);

    // Update the query cache with the new order
    queryClient.setQueryData(["friends"], newFriends);

    // TODO: Persist the new order to the backend
    // You might want to add an API endpoint to save friend order preferences

    setDraggedFriend(null);
    setDragOverFriend(null);
  };

  const handleDragEnd = () => {
    setDraggedFriend(null);
    setDragOverFriend(null);
  };
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

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      friend.name.toLowerCase().includes(query) ||
      friend.country.toLowerCase().includes(query) ||
      friend.interests.some(interest => interest.toLowerCase().includes(query)) ||
      friend.personalityTraits.some(trait => trait.toLowerCase().includes(query)) ||
      (friend.notes && friend.notes.toLowerCase().includes(query)) ||
      friend.category.toLowerCase().includes(query) ||
      (friend.gender && friend.gender.toLowerCase().includes(query)) ||
      (friend.ageRange && friend.ageRange.toLowerCase().includes(query))
    );
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

  // Reset carousel index when friends change or switching to carousel mode
  useEffect(() => {
    if (filteredFriends.length > 0 && carouselIndex >= filteredFriends.length) {
      setCarouselIndex(0);
    } else if (filteredFriends.length === 0) {
      setCarouselIndex(0);
    }
  }, [filteredFriends.length, carouselIndex]);

  // Reset carousel index when switching to carousel mode
  useEffect(() => {
    if (friendsViewMode === 'carousel') {
      setCarouselIndex(0);
    }
  }, [friendsViewMode]);

  // Reset search when switching away from friends tab
  useEffect(() => {
    if (activeTab !== 'friends' && searchQuery) {
      setSearchQuery('');
      setSearchExpanded(false);
    }
  }, [activeTab]);

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
    onSuccess: (data, variables) => {
      // If we already have recommendations for this friend, append new ones
      // Otherwise, replace the recommendations (normal generation)
      if (recommendationsForFriend && recommendationsForFriend.id === variables.friendId && recommendations.length > 0) {
        // Filter out duplicates by name and append new recommendations
        const existingNames = new Set(recommendations.map(r => r.name.toLowerCase()));
        const newRecommendations = data.filter((rec: any) => !existingNames.has(rec.name.toLowerCase()));
        setRecommendations(prev => [...prev, ...newRecommendations]);
      } else {
        // First time generating or different friend
        setRecommendations(data);
        setRecommendationsForFriend(selectedFriend);
        switchTab("recommendations");
      }
      
      // Track successful gift generation
      const friendForTracking = recommendationsForFriend?.id === variables.friendId ? recommendationsForFriend : selectedFriend;
      if (friendForTracking) {
        trackGiftGeneration(friendForTracking, parseInt(budget), friendForTracking.currency);
      }
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

  const handleSuggestMore = () => {
    if (recommendationsForFriend && budget) {
      const formattedBudget = getFormattedBudget();
      generateRecommendationsMutation.mutate({
        friendId: recommendationsForFriend.id,
        budget: formattedBudget,
      });
    }
  };

  // Add a convenient way to check if generating
  const isGenerating = generateRecommendationsMutation.isPending;

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
        <div className="container mx-auto px-4 py-2 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/blog" className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium">
                About us
              </Link>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-xs md:text-sm text-gray-600">
                {currentUser && currentUser.username !== 'Guest' ? (
                  <span className="hidden sm:inline">Welcome back, <strong>{currentUser.username}</strong>!</span>
                ) : (
                  <span className="hidden sm:inline">You're browsing as a guest</span>
                )}
              </div>
              {currentUser && currentUser.username !== 'Guest' ? (
                <button
                  onClick={handleLogout}
                  className="text-xs md:text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-xs md:text-sm bg-blue-600 text-white px-2 md:px-4 py-1 md:py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-3 lg:py-6">
        <div className="max-w-7xl mx-auto">
          {/* Compact header on mobile, more space-efficient on desktop */}
          <div className="text-center mb-3 lg:mb-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 lg:mb-4">
              🎁 Gift Genie
            </h1>
            <p className="text-sm md:text-lg lg:text-xl text-gray-600 mb-2 lg:mb-6 hidden sm:block">
              Find the perfect gift for your friends with AI-powered recommendations
            </p>
          </div>

          {/* Tab Navigation - More compact on desktop */}
          <div className="mb-3 lg:mb-6">
            {isMobile ? (
              <MobileTabsDropdown
                tabs={[
                  { id: "friends", label: "Friends" },
                  { id: "generate", label: "Generate Gifts" },
                  { id: "recommendations", label: "Recommendations" },
                  { id: "saved", label: "Saved" },
                  ...(currentUser?.isAdmin ? [{ id: "analytics", label: "Analytics" }] : [])
                ]}
                activeTab={activeTab}
                onTabChange={switchTab}
              />
            ) : (
              <div className="flex justify-center">
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
            )}
          </div>

          {/* Friends Tab */}
          {activeTab === "friends" && (
            <div className="bg-white rounded-lg p-3 lg:p-4 xl:p-6 shadow-sm">
              <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:justify-between md:items-center mb-3 lg:mb-4">
                <h2 className="text-lg md:text-xl lg:text-2xl font-semibold">👥 Your Friends</h2>
                <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:gap-4">
                  {/* Search and View Mode Controls */}
                  {friends.length > 0 && (
                    <div className="flex items-center gap-2">
                      {/* Search Button - Collapsible */}
                      <div className={`relative transition-all duration-300 ${searchExpanded ? 'flex-1 md:max-w-md' : 'max-w-max'}`}>
                        {!searchExpanded ? (
                          // Collapsed state - just the magnifying glass
                          <button
                            onClick={() => setSearchExpanded(true)}
                            className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Search friends"
                          >
                            <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </button>
                        ) : (
                          // Expanded state - full search bar
                          <>
                            <input
                              type="text"
                              placeholder={isMobile ? "Search friends..." : "Search friends by name, country, interests, traits, notes, or category..."}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onBlur={() => {
                                // Auto-collapse if no text when focus is lost
                                if (!searchQuery.trim()) {
                                  setSearchExpanded(false);
                                }
                              }}
                              className="w-full pl-8 md:pl-10 pr-8 md:pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              autoFocus
                            />
                            <div className="absolute inset-y-0 left-0 pl-2 md:pl-3 flex items-center pointer-events-none">
                              <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <button
                              onClick={() => {
                                setSearchExpanded(false);
                                setSearchQuery("");
                              }}
                              className="absolute inset-y-0 right-0 pr-2 md:pr-3 flex items-center"
                              title="Close search"
                            >
                              <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* View Mode Toggle - Always visible next to search */}
                      {!searchExpanded && (
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                          <button
                            onTouchStart={(e) => {
                              e.preventDefault();
                              setFriendsViewMode('grid');
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFriendsViewMode('grid');
                            }}
                            className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-md transition-colors ${
                              friendsViewMode === 'grid'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            type="button"
                          >
                            📱 Grid
                          </button>
                          <button
                            onTouchStart={(e) => {
                              e.preventDefault();
                              setFriendsViewMode('carousel');
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFriendsViewMode('carousel');
                            }}
                            className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-md transition-colors ${
                              friendsViewMode === 'carousel'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            type="button"
                          >
                            🔄 {isMobile ? 'Swipe' : 'Carousel'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button 
                    onClick={() => setShowFriendForm(true)}
                    className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-md hover:bg-blue-700 text-sm md:text-base w-full md:w-auto"
                  >
                    Add Friend
                  </button>
                </div>
              </div>
              
              {/* Search Results Counter */}
              {searchQuery && searchExpanded && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Found {filteredFriends.length} friend{filteredFriends.length !== 1 ? 's' : ''} matching "{searchQuery}"
                  </p>
                </div>
              )}
              
              {friendsLoading ? (
                <div className="text-center py-8">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No friends added yet. Add your first friend to get started!
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No friends found matching your search. Try a different search term.
                </div>
              ) : friendsViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {filteredFriends.map((friend, index) => (
                    <div
                      key={friend.id}
                      className={`group relative border rounded-lg p-3 md:p-4 transition-all duration-200 select-none ${
                        draggedFriend === friend.id 
                          ? 'opacity-50 scale-95 rotate-2 cursor-grabbing shadow-2xl z-10' 
                          : dragOverFriend === friend.id
                          ? 'shadow-lg border-blue-400 bg-blue-50 scale-105'
                          : 'hover:shadow-md cursor-grab'
                      }`}
                      draggable={!isMobile}
                      onDragStart={!isMobile ? (e) => handleDragStart(e, friend.id) : undefined}
                      onDragOver={!isMobile ? (e) => handleDragOver(e, friend.id) : undefined}
                      onDragLeave={!isMobile ? handleDragLeave : undefined}
                      onDrop={!isMobile ? (e) => handleDrop(e, friend.id) : undefined}
                      onDragEnd={!isMobile ? handleDragEnd : undefined}
                    >
                      {/* Drag Handle - Desktop only */}
                      {!isMobile && (
                        <div className="absolute top-3 left-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/>
                          </svg>
                        </div>
                      )}

                      {/* Profile Picture - Smaller on mobile */}
                      <div className="text-center mb-3 md:mb-4">
                        {friend.profilePicture ? (
                          <div 
                            className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full transition-all duration-300 hover:scale-125 hover:shadow-lg ring-2 ring-blue-200 hover:ring-blue-400 cursor-pointer"
                            onClick={() => friend.profilePicture && setFocusedImage({src: friend.profilePicture, alt: `${friend.name}'s profile picture`})}
                            onMouseEnter={() => setHoveredFriend(friend.id)}
                            onMouseLeave={() => setHoveredFriend(null)}
                          >
                            <img
                              src={friend.profilePicture}
                              alt={friend.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full mx-auto flex items-center justify-center text-xl md:text-2xl transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer"
                            onMouseEnter={() => setHoveredFriend(friend.id)}
                            onMouseLeave={() => setHoveredFriend(null)}
                          >
                            👤
                          </div>
                        )}
                      </div>

                      {/* Name and Info - More compact on mobile */}
                      <div 
                        className={`text-center mb-3 ${isMobile ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (isMobile) {
                            setExpandedMobileFriend(expandedMobileFriend === friend.id ? null : friend.id);
                          }
                        }}
                      >
                        <h3 className="font-semibold text-base md:text-lg">{friend.name}</h3>
                        {!isMobile && (
                          <>
                            <p className="text-xs md:text-sm text-gray-500">{friend.country}</p>
                            {(friend.gender || friend.ageRange) && (
                              <p className="text-xs text-gray-400">
                                {friend.gender && friend.ageRange 
                                  ? `${friend.gender}, ${friend.ageRange}`
                                  : friend.gender || friend.ageRange
                                }
                              </p>
                            )}
                            <p className={`text-xs italic transition-colors duration-200 ${
                              hoveredFriend === friend.id 
                                ? 'text-blue-600' 
                                : 'text-gray-400'
                            }`}>
                              {hoveredFriend === friend.id ? 'Showing details...' : 'Hover profile to see details'}
                            </p>
                          </>
                        )}
                        {isMobile && (
                          <p className="text-xs text-gray-400 mt-1">
                            {expandedMobileFriend === friend.id ? 'Tap to collapse' : 'Tap to expand'}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons - Always visible on mobile */}
                      <div className={`absolute top-2 md:top-3 right-2 md:right-3 flex gap-1 transition-opacity duration-200 ${
                        isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <button
                          onClick={() => {
                            setEditingFriend(friend);
                            setShowFriendForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-xs md:text-sm"
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
                          className="text-red-600 hover:text-red-800 p-1 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-xs md:text-sm"
                          title="Delete friend"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      {/* Interests and Personality - Click to expand on mobile, hover on desktop */}
                      <div className={`transition-all duration-300 overflow-hidden ${
                        (!isMobile && hoveredFriend === friend.id) || (isMobile && expandedMobileFriend === friend.id)
                          ? `${isMobile ? 'max-h-96' : 'max-h-40'} opacity-100 mb-3`
                          : 'max-h-0 opacity-0 mb-0'
                      }`}>
                        {/* Basic Info - Mobile only */}
                        {isMobile && (
                          <div className="mb-2 text-center">
                            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                              <span>📍</span>
                              {friend.country}
                            </p>
                            {(friend.gender || friend.ageRange) && (
                              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                                <span>👤</span>
                                {friend.gender && friend.ageRange 
                                  ? `${friend.gender}, ${friend.ageRange}`
                                  : friend.gender || friend.ageRange
                                }
                              </p>
                            )}
                            <p className="text-xs text-blue-600 font-medium flex items-center justify-center gap-1">
                              <span>🏷️</span>
                              {friend.category}
                            </p>
                          </div>
                        )}
                        
                        <div className="mb-2">
                          <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                            <span>🎯</span>
                            Interests:
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {friend.interests.slice(0, isMobile ? 2 : 3).map((interest, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {interest}
                              </span>
                            ))}
                            {friend.interests.length > (isMobile ? 2 : 3) && (
                              <span className="text-xs text-gray-500">
                                +{friend.interests.length - (isMobile ? 2 : 3)} more
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                            <span>✨</span>
                            Personality:
                          </p>
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
                        
                        {/* Notes Section (if exists) */}
                        {friend.notes && (
                          <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
                            <h4 className={`font-semibold text-gray-800 mb-2 ${
                              isMobile ? 'text-base' : 'text-lg'
                            }`}>📝 Notes</h4>
                            <p className={`text-gray-600 bg-gray-50 p-3 rounded-lg italic ${
                              isMobile ? 'text-sm' : 'text-base'
                            }`}>
                              "{friend.notes.length > 100 ? friend.notes.substring(0, 100) + '...' : friend.notes}"
                            </p>
                          </div>
                        )}
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
              ) : (
                // Carousel View
                <div className="relative">
                  {/* Carousel Navigation */}
                  <div className="flex justify-center items-center mb-6 gap-4">
                    <button
                      onClick={() => filteredFriends.length > 0 && setCarouselIndex((carouselIndex - 1 + filteredFriends.length) % filteredFriends.length)}
                      className="p-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full transition-colors"
                      disabled={filteredFriends.length === 0}
                    >
                      ←
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                      {filteredFriends.length > 0 ? `${carouselIndex + 1} of ${filteredFriends.length}` : '0 of 0'}
                    </span>
                    <button
                      onClick={() => filteredFriends.length > 0 && setCarouselIndex((carouselIndex + 1) % filteredFriends.length)}
                      className="p-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full transition-colors"
                      disabled={filteredFriends.length === 0}
                    >
                      →
                    </button>
                  </div>

                  {/* Carousel Content - Responsive Three Card View */}
                  <div 
                    className={`relative overflow-hidden ${
                      isMobile && isDragging ? 'bg-gradient-to-r from-blue-50 via-white to-blue-50' : ''
                    }`}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={isMobile ? {
                      transition: isDragging ? 'background 0.2s ease' : 'background 0.3s ease',
                      touchAction: 'pan-y pinch-zoom', // Allow vertical scrolling but prevent horizontal
                    } : {}}
                  >
                    {filteredFriends.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No friends found matching your search.
                      </div>
                    ) : (
                    <div className={`flex justify-center items-center px-2 md:px-4 py-4 md:py-8 ${
                      isMobile ? 'gap-2' : 'gap-4'
                    }`}>
                      {/* Previous Friend (Preview) - Hidden on mobile */}
                      {!isMobile && (
                        <div 
                          className="flex-shrink-0 w-48 transform scale-75 opacity-60 cursor-pointer transition-all duration-300 hover:scale-80 hover:opacity-80"
                          onClick={() => filteredFriends.length > 0 && setCarouselIndex((carouselIndex - 1 + filteredFriends.length) % filteredFriends.length)}
                        >
                          {(() => {
                            const prevIndex = (carouselIndex - 1 + filteredFriends.length) % filteredFriends.length;
                            const prevFriend = filteredFriends[prevIndex];
                            if (!prevFriend) return null;
                            return (
                              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md">
                                <div className="text-center">
                                  {prevFriend.profilePicture ? (
                                    <div className="w-16 h-16 mx-auto rounded-full mb-3 ring-2 ring-gray-200">
                                      <img
                                        src={prevFriend.profilePicture}
                                        alt={prevFriend.name}
                                        className="w-full h-full object-cover rounded-full"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center text-2xl mb-3">
                                      👤
                                    </div>
                                  )}
                                  <h4 className="font-semibold text-gray-900 mb-1">{prevFriend.name}</h4>
                                  <p className="text-xs text-gray-500">{prevFriend.country}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Current Friend (Main) - Responsive sizing with floating animation */}
                      <div 
                        className={`flex-shrink-0 transform scale-100 transition-all duration-300 ${
                          isMobile ? 'w-full max-w-sm mx-2' : 'w-80'
                        }`}
                      >
                        {(() => {
                          const friend = filteredFriends[carouselIndex];
                          if (!friend) return null;
                          return (
                            <div 
                              className={`group bg-white border-2 border-blue-200 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${
                                isMobile ? 'p-4' : 'p-6'
                              }`}
                            >
                              {/* Sliding content wrapper */}
                              <div 
                                style={isMobile ? {
                                  transform: `translateX(${swipeOffset}px)`,
                                  transition: isDragging || isAnimating ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                } : {}}
                              >
                                {/* Profile Section */}
                                <div className={`text-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                                {friend.profilePicture ? (
                                  <div 
                                    className={`mx-auto rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg ring-4 ring-blue-200 hover:ring-blue-400 cursor-pointer mb-3 md:mb-4 ${
                                      isMobile ? 'w-20 h-20' : 'w-24 h-24'
                                    }`}
                                    onClick={() => friend.profilePicture && setFocusedImage({src: friend.profilePicture, alt: `${friend.name}'s profile picture`})}
                                    onMouseEnter={() => setHoveredFriend(friend.id)}
                                    onMouseLeave={() => setHoveredFriend(null)}
                                  >
                                    <img
                                      src={friend.profilePicture}
                                      alt={friend.name}
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  </div>
                                ) : (
                                  <div 
                                    className={`bg-gray-200 rounded-full mx-auto flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg mb-3 md:mb-4 cursor-pointer ${
                                      isMobile ? 'w-20 h-20 text-2xl' : 'w-24 h-24 text-3xl'
                                    }`}
                                    onMouseEnter={() => setHoveredFriend(friend.id)}
                                    onMouseLeave={() => setHoveredFriend(null)}
                                  >
                                    👤
                                  </div>
                                )}
                                <h3 className={`font-bold text-gray-900 mb-1 ${
                                  isMobile ? 'text-xl' : 'text-2xl'
                                }`}>{friend.name}</h3>
                                
                                {/* Basic info - Show on desktop, hide on mobile unless expanded */}
                                <div className={`space-y-1 ${isMobile ? 'text-sm' : 'text-base'} ${
                                  isMobile ? 'cursor-pointer' : ''
                                }`}
                                onClick={() => {
                                  if (isMobile) {
                                    setExpandedMobileFriend(expandedMobileFriend === friend.id ? null : friend.id);
                                  }
                                }}
                                >
                                  {(!isMobile || expandedMobileFriend === friend.id) && (
                                    <>
                                      <p className="text-gray-600 flex items-center justify-center gap-1">
                                        <span>📍</span>
                                        {friend.country}
                                      </p>
                                      {(friend.gender || friend.ageRange) && (
                                        <p className="text-gray-500 flex items-center justify-center gap-1">
                                          <span>👤</span>
                                          {friend.gender && friend.ageRange 
                                            ? `${friend.gender}, ${friend.ageRange}`
                                            : friend.gender || friend.ageRange
                                          }
                                        </p>
                                      )}
                                      <p className="text-blue-600 font-medium flex items-center justify-center gap-1">
                                        <span>🏷️</span>
                                        {friend.category}
                                      </p>
                                    </>
                                  )}
                                  
                                  {isMobile && (
                                    <p className="text-xs text-gray-400 mt-2">
                                      {expandedMobileFriend === friend.id ? 'Tap to collapse' : 'Tap to expand'}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Hover instruction - Desktop only */}
                                {!isMobile && (
                                  <p className={`text-xs transition-colors duration-200 mt-2 ${
                                    hoveredFriend === friend.id 
                                      ? 'text-blue-600' 
                                      : 'text-gray-400'
                                  }`}>
                                    {hoveredFriend === friend.id ? 'Showing details...' : 'Hover profile to see details'}
                                  </p>
                                )}
                              </div>

                              {/* Expandable Details Section */}
                              <div className={`transition-all duration-300 overflow-hidden ${
                                (!isMobile && hoveredFriend === friend.id) || (isMobile && expandedMobileFriend === friend.id)
                                  ? 'max-h-96 opacity-100' 
                                  : 'max-h-0 opacity-0'
                              }`}>
                                {/* Interests Section */}
                                <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
                                  <h4 className={`font-semibold text-gray-800 mb-2 ${
                                    isMobile ? 'text-base' : 'text-lg'
                                  }`}>🎯 Interests</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {friend.interests.slice(0, isMobile ? 4 : 6).map((interest, idx) => (
                                      <span
                                        key={idx}
                                        className={`bg-blue-100 text-blue-800 px-3 py-1 rounded-full ${
                                          isMobile ? 'text-xs' : 'text-sm'
                                        }`}
                                      >
                                        {interest}
                                      </span>
                                    ))}
                                    {friend.interests.length > (isMobile ? 4 : 6) && (
                                      <span className="text-xs text-gray-500 px-3 py-1">
                                        +{friend.interests.length - (isMobile ? 4 : 6)} more
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Personality Section */}
                                <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
                                  <h4 className={`font-semibold text-gray-800 mb-2 ${
                                    isMobile ? 'text-base' : 'text-lg'
                                  }`}>✨ Personality</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {friend.personalityTraits.slice(0, isMobile ? 3 : 5).map((trait, idx) => (
                                      <span
                                        key={idx}
                                        className={`bg-green-100 text-green-800 px-3 py-1 rounded-full ${
                                          isMobile ? 'text-xs' : 'text-sm'
                                        }`}
                                      >
                                        {trait}
                                      </span>
                                    ))}
                                    {friend.personalityTraits.length > (isMobile ? 3 : 5) && (
                                      <span className="text-xs text-gray-500 px-3 py-1">
                                        +{friend.personalityTraits.length - (isMobile ? 3 : 5)} more
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Notes Section (if exists) */}
                                {friend.notes && (
                                  <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
                                    <h4 className={`font-semibold text-gray-800 mb-2 ${
                                      isMobile ? 'text-base' : 'text-lg'
                                    }`}>📝 Notes</h4>
                                    <p className={`text-gray-600 bg-gray-50 p-3 rounded-lg italic ${
                                      isMobile ? 'text-sm' : 'text-base'
                                    }`}>
                                      "{friend.notes.length > 100 ? friend.notes.substring(0, 100) + '...' : friend.notes}"
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className={`flex gap-2 ${isMobile ? 'mt-4' : 'mt-6'}`}>
                                <button
                                  onClick={() => {
                                    selectFriend(friend);
                                    switchTab("generate");
                                  }}
                                  className={`flex-1 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors ${
                                    isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-4 text-sm'
                                  }`}
                                >
                                  🎁 Generate Gifts
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingFriend(friend);
                                    setShowFriendForm(true);
                                  }}
                                  className={`text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors ${
                                    isMobile ? 'p-2' : 'p-3'
                                  }`}
                                  title="Edit friend"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${friend.name}?`)) {
                                      deleteFriendMutation.mutate(friend.id);
                                      // Reset carousel index if needed
                                      if (carouselIndex >= filteredFriends.length - 1) {
                                        setCarouselIndex(0);
                                      }
                                    }
                                  }}
                                  className={`text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors ${
                                    isMobile ? 'p-2' : 'p-3'
                                  }`}
                                  title="Delete friend"
                                >
                                  🗑️
                                </button>
                              </div>
                              </div> {/* Close sliding content wrapper */}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Next Friend (Preview) - Hidden on mobile */}
                      {!isMobile && (
                        <div 
                          className="flex-shrink-0 w-48 transform scale-75 opacity-60 cursor-pointer transition-all duration-300 hover:scale-80 hover:opacity-80"
                          onClick={() => filteredFriends.length > 0 && setCarouselIndex((carouselIndex + 1) % filteredFriends.length)}
                        >
                          {(() => {
                            const nextIndex = (carouselIndex + 1) % filteredFriends.length;
                            const nextFriend = filteredFriends[nextIndex];
                            if (!nextFriend) return null;
                            return (
                              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md">
                                <div className="text-center">
                                  {nextFriend.profilePicture ? (
                                    <div className="w-16 h-16 mx-auto rounded-full mb-3 ring-2 ring-gray-200">
                                      <img
                                        src={nextFriend.profilePicture}
                                        alt={nextFriend.name}
                                        className="w-full h-full object-cover rounded-full"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center text-2xl mb-3">
                                      👤
                                    </div>
                                  )}
                                  <h4 className="font-semibold text-gray-900 mb-1">{nextFriend.name}</h4>
                                  <p className="text-xs text-gray-500">{nextFriend.country}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    )}
                  </div>

                  {/* Mobile Swipe Indicators */}
                  {isMobile && filteredFriends.length > 1 && (
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                      {/* Left swipe indicator */}
                      <div className={`ml-4 transition-all duration-200 ${
                        swipeOffset > 30 ? 'opacity-70 scale-110' : 'opacity-30'
                      }`}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
                          <span className="text-blue-600">👈</span>
                        </div>
                      </div>
                      
                      {/* Right swipe indicator */}
                      <div className={`mr-4 transition-all duration-200 ${
                        swipeOffset < -30 ? 'opacity-70 scale-110' : 'opacity-30'
                      }`}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
                          <span className="text-blue-600">👉</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dots Indicator - More prominent on mobile */}
                  <div className={`flex justify-center gap-2 ${isMobile ? 'mt-4' : 'mt-6'}`}>
                    {filteredFriends.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCarouselIndex(index)}
                        className={`rounded-full transition-colors ${
                          isMobile 
                            ? 'w-4 h-4' // Larger on mobile
                            : 'w-3 h-3'
                        } ${
                          index === carouselIndex
                            ? 'bg-blue-600'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate Tab */}
          {activeTab === "generate" && (
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-sm">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 md:mb-6">🤖 Generate Gift Recommendations</h2>
              
              <div className="space-y-4 md:space-y-6">
                {/* Friend Selection Section */}
                <div>
                  <label className="block text-sm font-medium mb-2 md:mb-3">Select Friend</label>
                  <select
                    value={selectedFriend?.id || ""}
                    onChange={(e) => {
                      const friend = friends.find(f => f.id === e.target.value);
                      selectFriend(friend || null);
                    }}
                    className="w-full p-3 border rounded-lg text-base"
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
                    <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                      <div className="flex items-start sm:items-center gap-3 md:gap-4">
                        {/* Profile Picture */}
                        {selectedFriend.profilePicture ? (
                          <div 
                            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 ring-2 ring-blue-200 cursor-pointer flex-shrink-0"
                            onClick={() => selectedFriend.profilePicture && setFocusedImage({src: selectedFriend.profilePicture, alt: `${selectedFriend.name}'s profile picture`})}
                          >
                            <img
                              src={selectedFriend.profilePicture}
                              alt={selectedFriend.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold transition-all duration-300 cursor-pointer flex-shrink-0">
                            {selectedFriend.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Friend Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base md:text-lg text-gray-800 truncate">{selectedFriend.name}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm text-gray-600 mt-1 space-y-1 sm:space-y-0">
                                <span className="flex items-center gap-1">
                                  <span>📍</span>
                                  <span className="truncate">{selectedFriend.country}</span>
                                </span>
                                {(selectedFriend.gender || selectedFriend.ageRange) && (
                                  <span className="flex items-center gap-1">
                                    <span>👤</span>
                                    <span className="truncate">
                                      {selectedFriend.gender && selectedFriend.ageRange 
                                        ? `${selectedFriend.gender}, ${selectedFriend.ageRange}`
                                        : selectedFriend.gender || selectedFriend.ageRange
                                      }
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setEditingFriend(selectedFriend);
                                setShowFriendForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1.5 md:p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all flex-shrink-0 ml-2"
                              title="Edit friend"
                            >
                              ✏️
                            </button>
                          </div>
                          
                          {/* Quick Preview of Interests/Traits */}
                          <div className="mt-2 md:mt-3 flex flex-wrap gap-1">
                            {selectedFriend.interests.slice(0, isMobile ? 2 : 3).map((interest, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200"
                              >
                                {interest}
                              </span>
                            ))}
                            {selectedFriend.personalityTraits.slice(0, isMobile ? 1 : 2).map((trait, index) => (
                              <span
                                key={index}
                                className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded border border-green-200"
                              >
                                {trait}
                              </span>
                            ))}
                            {((selectedFriend.interests.length > (isMobile ? 2 : 3)) || (selectedFriend.personalityTraits.length > (isMobile ? 1 : 2))) && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{Math.max(0, selectedFriend.interests.length - (isMobile ? 2 : 3)) + Math.max(0, selectedFriend.personalityTraits.length - (isMobile ? 1 : 2))} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Budget Selection Section */}
                {selectedFriend && (
                  <div>
                    <label className="block text-sm font-medium mb-2 md:mb-3">
                      Budget: {getFormattedBudget()} {currentCurrency !== 'USD' ? `(${currentCurrency})` : ''}
                    </label>
                    
                    {/* Budget Controls in a Card */}
                    <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
                      {/* Quick Budget Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 md:mb-4">
                        {[25, 50, 100, 200].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => updateBudget(amount)}
                            className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              currentBudgetValue === amount
                                ? "bg-green-600 text-white shadow-sm"
                                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                            }`}
                          >
                            {currencySymbol}{amount}
                          </button>
                        ))}
                      </div>

                      {/* Budget Slider */}
                      <div className="mb-3 md:mb-4">
                        <span className="text-xs sm:text-sm text-gray-600 block mb-2">
                          {useCustomBudget && parseInt(customBudget) > 500 
                            ? "Slider disabled - using custom amount above £500" 
                            : "Or drag to adjust budget"
                          }
                        </span>
                        <input
                          type="range"
                          min={10}
                          max={500}
                          step={10}
                          value={currentBudgetValue}
                          onChange={(e) => updateBudget(parseInt(e.target.value))}
                          className={`w-full slider cursor-pointer ${
                            useCustomBudget && parseInt(customBudget) > 500 ? 'opacity-50' : ''
                          }`}
                          disabled={useCustomBudget && parseInt(customBudget) > 500}
                          style={{
                            background: `linear-gradient(to right, #10B981 0%, #10B981 ${((currentBudgetValue - 10) / (500 - 10)) * 100}%, #E5E7EB ${((currentBudgetValue - 10) / (500 - 10)) * 100}%, #E5E7EB 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{currencySymbol}10</span>
                          <span>{currencySymbol}250</span>
                          <span>{currencySymbol}500</span>
                        </div>
                      </div>

                      {/* Custom Budget Input */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Or enter custom budget (for amounts over £500):
                        </label>
                        <input
                          type="text"
                          value={customBudget}
                          onChange={(e) => {
                            const newValue = e.target.value.replace(/[^\d]/g, '');
                            handleCustomBudgetChange(newValue);
                          }}
                          placeholder="e.g., 750"
                          className="w-full p-2 border rounded-md text-sm"
                        />
                        {useCustomBudget && parseInt(customBudget) > 500 && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Using custom budget: {currencySymbol}{customBudget}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                {selectedFriend && (
                  <div className="pt-2">
                    {generateRecommendationsMutation.isPending && (
                      <div className="mb-4 md:mb-6 flex justify-center">
                        <GiftWrappingAnimation />
                      </div>
                    )}
                    
                    <button
                      onClick={handleGenerateRecommendations}
                      disabled={!selectedFriend || !budget || generateRecommendationsMutation.isPending}
                      className={`w-full py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold transition-all duration-300 ${
                        generateRecommendationsMutation.isPending
                          ? "bg-blue-400 text-white cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-[1.02]"
                      }`}
                    >
                      {generateRecommendationsMutation.isPending
                        ? "🎁 Generating Perfect Gifts..."
                        : "🎁 Generate Gift Recommendations"}
                    </button>
                  </div>
                )}

                {/* Help Text */}
                {!selectedFriend && (
                  <div className="text-center py-6 md:py-8 text-gray-500">
                    <div className="text-3xl md:text-4xl mb-3 md:mb-4">👆</div>
                    <h3 className="text-base md:text-lg font-medium mb-2">Select a friend to get started</h3>
                    <p className="text-sm md:text-base">Choose someone from your friends list to generate personalized gift recommendations!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === "recommendations" && (
            <div className="bg-white rounded-lg p-3 lg:p-4 xl:p-6 shadow-sm" style={{overflow: 'visible'}}>
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">💡 Gift Recommendations</h2>
              
              {/* Show who recommendations are for */}
              {recommendationsForFriend && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mb-6 border border-blue-200">
                  <div className="flex items-center gap-4">
                    {recommendationsForFriend.profilePicture ? (
                      <div 
                        className="w-20 h-20 rounded-full border-2 border-white shadow-lg transition-all duration-300 hover:scale-125 hover:shadow-xl ring-2 ring-blue-200 hover:ring-blue-400 cursor-pointer"
                        onClick={() => recommendationsForFriend.profilePicture && setFocusedImage({src: recommendationsForFriend.profilePicture, alt: `${recommendationsForFriend.name}'s profile picture`})}
                      >
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
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6" style={{overflow: 'visible'}}>
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
                  
                  {/* Suggest More Button */}
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleSuggestMore}
                      disabled={isGenerating}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Generating more...
                        </>
                      ) : (
                        <>
                          🎁 Suggest More Gifts
                        </>
                      )}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Get additional gift recommendations for {recommendationsForFriend?.name}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === "saved" && (
            <div className="bg-white rounded-lg p-3 lg:p-4 xl:p-6 shadow-sm" style={{overflow: 'visible'}}>
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">💝 Saved Gifts</h2>
              
              {savedGifts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No saved gifts yet. Save some recommendations to see them here!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
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
                              className="w-6 h-6 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all duration-300"
                              onClick={() => friend.profilePicture && setFocusedImage({src: friend.profilePicture, alt: `${friend.name}'s profile picture`})}
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              © 2025 GiftGenie. Find the perfect gift for everyone.
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Follow us:</span>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/mrlcbrr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-800 transition-colors p-2 rounded-full hover:bg-pink-50"
                  title="Follow us on Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                
                <a
                  href="https://tiktok.com/@giftgenie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-50"
                  title="Follow us on TikTok"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                
                <a
                  href="https://snapchat.com/add/giftgenie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-500 hover:text-yellow-600 transition-colors p-2 rounded-full hover:bg-yellow-50"
                  title="Follow us on Snapchat"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.206 3.803c4.617 0 4.109 6.398 4.109 6.398.308 1.677 1.406 2.193 2.547 2.193.253 0 .486-.035.718-.093l.063 1.746c-2.456.539-3.338 1.748-4.138 3.043-.698 1.121-1.369 2.186-3.815 2.186s-3.117-1.065-3.815-2.186c-.8-1.295-1.682-2.504-4.138-3.043l.063-1.746c.232.058.465.093.718.093 1.141 0 2.239-.516 2.547-2.193 0 0-.508-6.398 4.109-6.398.279 0 .556.021.832.062l-.063-1.753c-.276-.041-.553-.062-.832-.062zm0-3.803c-6.627 0-12 5.373-12 12 0 6.627 5.373 12 12 12 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

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
