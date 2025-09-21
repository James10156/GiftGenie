import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertFriend, Friend } from "@shared/schema";

interface FriendFormProps {
  friend?: Friend;
  onClose: () => void;
}

// Predefined options for quick selection
const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands',
  'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal',
  'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'Taiwan', 'China', 'India', 'Thailand', 'Malaysia',
  'Philippines', 'Indonesia', 'Vietnam', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru',
  'South Africa', 'Egypt', 'Morocco', 'Nigeria', 'Kenya', 'Ghana', 'Israel', 'United Arab Emirates',
  'Saudi Arabia', 'Turkey', 'Russia', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Greece',
  'Bulgaria', 'Croatia', 'Slovenia', 'Slovakia', 'Estonia', 'Latvia', 'Lithuania', 'Ukraine',
  'New Zealand', 'Iceland', 'Luxembourg', 'Cyprus', 'Malta', 'Other'
].sort();

const COMMON_PERSONALITY_TRAITS = [
  "Adventurous", "Artistic", "Analytical", "Cheerful", "Creative", "Curious",
  "Determined", "Empathetic", "Energetic", "Funny", "Generous", "Intellectual",
  "Introverted", "Kind", "Logical", "Optimistic", "Organized", "Outgoing",
  "Passionate", "Patient", "Practical", "Quiet", "Reliable", "Romantic",
  "Sensitive", "Social", "Spontaneous", "Thoughtful", "Traditional", "Witty"
];

const COMMON_INTERESTS = [
  "Art", "Books", "Cooking", "Dancing", "Fashion", "Fitness", "Gaming",
  "Gardening", "History", "Movies", "Music", "Nature", "Photography",
  "Reading", "Sports", "Technology", "Travel", "Writing", "Yoga",
  "Animals", "Board Games", "Coffee", "DIY Projects", "Food", "Hiking",
  "Meditation", "Outdoor Activities", "Pets", "Science", "Theater",
  "Volunteering", "Wine", "Crafts", "Cycling", "Fishing", "Golf",
  "Knitting", "Painting", "Podcasts", "Running", "Shopping", "Swimming"
];

// Common category suggestions
const COMMON_CATEGORIES = [
  "Friend", "Family","Boyfriend","Girlfriend","Best Friend","Husband","Wife", "Work Colleagues", "Neighbors", "School Friends", 
  "Online Friends", "Hobby Groups", "Sports Teammates", "Travel Buddies",
  "Book Club", "Gym Friends", "Gaming Friends", "College Friends",
  "Childhood Friends", "Business Associates", "Mentors", "Students"
];

export function FriendForm({ friend, onClose }: FriendFormProps) {
  const [formData, setFormData] = useState<InsertFriend>({
    name: friend?.name || "",
    personalityTraits: friend?.personalityTraits || [],
    interests: friend?.interests || [],
    category: friend?.category || "Friend",
    notes: friend?.notes || "",
    country: friend?.country || "United Kingdom",
    currency: friend?.currency || "GBP",
    profilePicture: friend?.profilePicture || "",
  });

  const [newTrait, setNewTrait] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showTraitOptions, setShowTraitOptions] = useState(false);
  const [showInterestOptions, setShowInterestOptions] = useState(false);
  const [showCommonCategories, setShowCommonCategories] = useState(false);

  // Fetch existing categories for suggestions
  const { data: existingCategories = [] } = useQuery({
    queryKey: ['/api/friends/categories'],
    queryFn: async () => {
      const response = await fetch("/api/friends/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json() as Promise<string[]>;
    },
  });

  const queryClient = useQueryClient();

  const createFriendMutation = useMutation({
    mutationFn: async (data: InsertFriend) => {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create friend");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      onClose();
    },
  });

  const updateFriendMutation = useMutation({
    mutationFn: async (data: InsertFriend) => {
      const response = await fetch(`/api/friends/${friend!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update friend");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (friend) {
      updateFriendMutation.mutate(formData);
    } else {
      createFriendMutation.mutate(formData);
    }
  };

  const addTrait = () => {
    if (newTrait.trim() && !formData.personalityTraits.includes(newTrait.trim())) {
      setFormData({
        ...formData,
        personalityTraits: [...formData.personalityTraits, newTrait.trim()],
      });
      setNewTrait("");
    }
  };

  const addTraitFromOption = (trait: string) => {
    if (!formData.personalityTraits.includes(trait)) {
      setFormData({
        ...formData,
        personalityTraits: [...formData.personalityTraits, trait],
      });
    }
  };

  const removeTrait = (trait: string) => {
    setFormData({
      ...formData,
      personalityTraits: formData.personalityTraits.filter(t => t !== trait),
    });
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()],
      });
      setNewInterest("");
    }
  };

  const addInterestFromOption = (interest: string) => {
    if (!formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest],
      });
    }
  };

  const removeInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest),
    });
  };

  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category: category,
    });
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
    if (value.trim()) {
      setFormData({
        ...formData,
        category: value.trim(),
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a local URL for the image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          profilePicture: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              {friend ? "Edit Friend" : "Add New Friend"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-md"
                placeholder="Friend's name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-3 border rounded-md"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full p-3 border rounded-md"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>

            {/* Category Section */}
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <button
                type="button"
                onClick={() => setShowCommonCategories(!showCommonCategories)}
                className="text-pink-600 hover:text-pink-800 text-sm mb-2 block"
              >
                {showCommonCategories ? 'Hide Common Categories' : 'Show Common Categories'}
              </button>
              <p className="text-sm text-gray-500 mb-3">Choose or create a category for this friend</p>
              
              {/* Current Category Input */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Enter category..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 border rounded-md"
                />
              </div>

              {/* Common Categories */}
              {showCommonCategories && (
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-2">Common categories:</div>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategoryChange(category)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          (formData.category || '').toLowerCase() === category.toLowerCase()
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Existing User Categories */}
              {existingCategories.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-2">Your existing categories:</div>
                  <div className="flex flex-wrap gap-2">
                    {existingCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategoryChange(category)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          (formData.category || '').toLowerCase() === category.toLowerCase()
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Category Display */}
              <div className="mt-2 text-sm text-gray-600">
                Current category: <span className="font-medium capitalize">{formData.category}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Profile Picture</label>
              <div className="space-y-3">
                {formData.profilePicture && (
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.profilePicture}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profilePicture: "" })}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="profile-upload"
                  />
                  <label
                    htmlFor="profile-upload"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
                  >
                    📁 Upload Image
                  </label>
                  <span className="text-gray-500 text-sm flex items-center">or</span>
                </div>
                <input
                  type="url"
                  value={formData.profilePicture || ""}
                  onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                  className="w-full p-3 border rounded-md"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Personality Traits</label>
              
              {/* Common traits selection */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setShowTraitOptions(!showTraitOptions)}
                  className="text-sm text-blue-600 hover:text-blue-800 mb-2"
                >
                  {showTraitOptions ? "Hide" : "Show"} Common Traits
                </button>
                
                {showTraitOptions && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-md max-h-32 overflow-y-auto">
                    {COMMON_PERSONALITY_TRAITS.filter(trait => !formData.personalityTraits.includes(trait)).map((trait) => (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => addTraitFromOption(trait)}
                        className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-blue-50 hover:border-blue-300 text-left"
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom trait input */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTrait}
                  onChange={(e) => setNewTrait(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                  placeholder="Add custom trait..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTrait())}
                />
                <button
                  type="button"
                  onClick={addTrait}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              {/* Selected traits */}
              <div className="flex flex-wrap gap-2">
                {formData.personalityTraits.map((trait, index) => (
                  <span
                    key={`trait-${trait}-${index}`}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {trait}
                    <button
                      type="button"
                      onClick={() => removeTrait(trait)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Remove ${trait} trait`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Interests</label>
              
              {/* Common interests selection */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setShowInterestOptions(!showInterestOptions)}
                  className="text-sm text-green-600 hover:text-green-800 mb-2"
                >
                  {showInterestOptions ? "Hide" : "Show"} Common Interests
                </button>
                
                {showInterestOptions && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-md max-h-32 overflow-y-auto">
                    {COMMON_INTERESTS.filter(interest => !formData.interests.includes(interest)).map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => addInterestFromOption(interest)}
                        className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-green-50 hover:border-green-300 text-left"
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom interest input */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                  placeholder="Add custom interest..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Add
                </button>
              </div>

              {/* Selected interests */}
              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest, index) => (
                  <span
                    key={`interest-${interest}-${index}`}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="text-green-600 hover:text-green-800"
                      aria-label={`Remove ${interest} interest`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 border rounded-md h-24"
                placeholder="Any additional notes about your friend's preferences..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createFriendMutation.isPending || updateFriendMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                {createFriendMutation.isPending || updateFriendMutation.isPending
                  ? "Saving..."
                  : friend
                  ? "Update Friend"
                  : "Add Friend"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
