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

// Country to currency mapping
const COUNTRY_CURRENCY_MAP: { [key: string]: string } = {
  'United Kingdom': 'GBP',
  'United States': 'USD',
  'Canada': 'CAD',
  'Australia': 'AUD',
  'Germany': 'EUR',
  'France': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'Netherlands': 'EUR',
  'Belgium': 'EUR',
  'Switzerland': 'CHF',
  'Austria': 'EUR',
  'Sweden': 'SEK',
  'Norway': 'NOK',
  'Denmark': 'DKK',
  'Finland': 'EUR',
  'Ireland': 'EUR',
  'Portugal': 'EUR',
  'Japan': 'JPY',
  'South Korea': 'KRW',
  'Singapore': 'SGD',
  'Hong Kong': 'HKD',
  'Taiwan': 'TWD',
  'China': 'CNY',
  'India': 'INR',
  'Thailand': 'THB',
  'Malaysia': 'MYR',
  'Philippines': 'PHP',
  'Indonesia': 'IDR',
  'Vietnam': 'VND',
  'Brazil': 'BRL',
  'Mexico': 'MXN',
  'Argentina': 'ARS',
  'Chile': 'CLP',
  'Colombia': 'COP',
  'Peru': 'PEN',
  'South Africa': 'ZAR',
  'Egypt': 'EGP',
  'Morocco': 'MAD',
  'Nigeria': 'NGN',
  'Kenya': 'KES',
  'Ghana': 'GHS',
  'Israel': 'ILS',
  'United Arab Emirates': 'AED',
  'Saudi Arabia': 'SAR',
  'Turkey': 'TRY',
  'Russia': 'RUB',
  'Poland': 'PLN',
  'Czech Republic': 'CZK',
  'Hungary': 'HUF',
  'Romania': 'RON',
  'Greece': 'EUR',
  'Bulgaria': 'BGN',
  'Croatia': 'EUR',
  'Slovenia': 'EUR',
  'Slovakia': 'EUR',
  'Estonia': 'EUR',
  'Latvia': 'EUR',
  'Lithuania': 'EUR',
  'Ukraine': 'UAH',
  'New Zealand': 'NZD',
  'Iceland': 'ISK',
  'Luxembourg': 'EUR',
  'Cyprus': 'EUR',
  'Malta': 'EUR',
  'Other': 'USD'
};

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
  "Friend", "Family", "Boyfriend", "Girlfriend", "Best Friend", "Husband", "Wife", "Work Colleagues", "Neighbors", "School Friends", 
  "Online Friends", "Hobby Groups", "Sports Teammates", "Travel Buddies",
  "Book Club", "Gym Friends", "Gaming Friends", "College Friends",
  "Childhood Friends", "Business Associates", "Mentors", "Students"
];

export function FriendForm({ friend, onClose }: FriendFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InsertFriend>({
    name: friend?.name || "",
    personalityTraits: (friend?.personalityTraits as string[]) || [],
    interests: (friend?.interests as string[]) || [],
    category: friend?.category || "Friend",
    notes: friend?.notes || "",
    country: friend?.country || "United Kingdom",
    currency: friend?.currency || "GBP",
    profilePicture: friend?.profilePicture || "",
  });

  const [newTrait, setNewTrait] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch existing categories for suggestions
  const { data: existingCategories = [] } = useQuery({
    queryKey: ['/api/friends/categories'],
    queryFn: async () => {
      const response = await fetch("/api/friends/categories", {
        credentials: 'include'
      });
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
        credentials: 'include'
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
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to update friend");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      onClose();
    },
  });

  const handleCountryChange = (country: string) => {
    const currency = COUNTRY_CURRENCY_MAP[country] || 'USD';
    setFormData({ ...formData, country, currency });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include session cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setFormData(prev => ({ ...prev, profilePicture: result.imageUrl }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleSubmit = () => {
    if (friend) {
      updateFriendMutation.mutate(formData);
    } else {
      createFriendMutation.mutate(formData);
    }
  };

  const addPersonalityTrait = (trait: string) => {
    if (trait && !formData.personalityTraits.includes(trait)) {
      setFormData({
        ...formData,
        personalityTraits: [...formData.personalityTraits, trait]
      });
    }
    setNewTrait("");
  };

  const removePersonalityTrait = (trait: string) => {
    setFormData({
      ...formData,
      personalityTraits: (formData.personalityTraits as string[]).filter(t => t !== trait)
    });
  };

  const addInterest = (interest: string) => {
    if (interest && !formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
    setNewInterest("");
  };

  const removeInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: (formData.interests as string[]).filter(i => i !== interest)
    });
  };

  const handleCategorySelect = (category: string) => {
    setFormData({ ...formData, category });
    setCustomCategory("");
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== "" && formData.country !== "";
      case 2:
        return formData.category?.trim() !== "";
      case 3:
        return true; // Personality traits are optional
      case 4:
        return true; // Interests are optional
      case 5:
        return true; // Notes are optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stepTitles = [
    "Basic Information",
    "Relationship",
    "Personality",
    "Interests",
    "Additional Notes"
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Let's start with the basics</h3>
              <p className="text-gray-600">Tell us about your friend</p>
            </div>

            {/* Profile Picture */}
            <div className="text-center">
              <label className="block text-sm font-medium mb-3">Profile Picture (Optional)</label>
              
              {/* Profile Picture Display */}
              <div className="mb-4">
                {formData.profilePicture ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.profilePicture}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profilePicture: "" })}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center text-3xl text-gray-400">
                    👤
                  </div>
                )}
              </div>

              {/* Upload Options */}
              <div className="space-y-3">
                {/* File Upload */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Upload from your device</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-sm text-gray-600">Choose file to upload</span>
                        </div>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-xs text-gray-500 bg-white px-2">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Enter image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.profilePicture || ""}
                    onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Friend's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your friend's name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Currency: {COUNTRY_CURRENCY_MAP[formData.country || 'Other'] || 'USD'}
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do you know {formData.name}?</h3>
              <p className="text-gray-600">This helps us understand your relationship</p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Relationship Category</label>
              
              {/* Common Categories - Expanded by Default */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Common Categories</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {COMMON_CATEGORIES.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`p-3 text-sm border rounded-lg transition-colors ${
                        formData.category === category
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Existing Categories */}
              {existingCategories.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Your Existing Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {existingCategories.filter(cat => !COMMON_CATEGORIES.includes(cat)).map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                          formData.category === category
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Category Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Or create a custom category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCategory.trim()) {
                        handleCategorySelect(customCategory.trim());
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={!customCategory.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>

              {formData.category && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Selected: <strong>{formData.category}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What's {formData.name} like?</h3>
              <p className="text-gray-600">Select personality traits that describe them</p>
            </div>

            {/* Selected Traits */}
            {formData.personalityTraits.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {(formData.personalityTraits as string[]).map((trait: string) => (
                    <span
                      key={trait}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {trait}
                      <button
                        type="button"
                        onClick={() => removePersonalityTrait(trait)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Common Traits - Expanded by Default */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Common Personality Traits</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                {COMMON_PERSONALITY_TRAITS.map(trait => (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => addPersonalityTrait(trait)}
                    disabled={formData.personalityTraits.includes(trait)}
                    className={`p-2 text-sm border rounded-lg transition-colors ${
                      formData.personalityTraits.includes(trait)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                    }`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Trait Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Add Custom Trait</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a custom personality trait"
                  value={newTrait}
                  onChange={(e) => setNewTrait(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPersonalityTrait(newTrait)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => addPersonalityTrait(newTrait)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={!newTrait.trim() || formData.personalityTraits.includes(newTrait.trim())}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What does {formData.name} enjoy?</h3>
              <p className="text-gray-600">Select their interests and hobbies</p>
            </div>

            {/* Selected Interests */}
            {formData.interests.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {(formData.interests as string[]).map((interest: string) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Common Interests - Expanded by Default */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Common Interests</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                {COMMON_INTERESTS.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => addInterest(interest)}
                    disabled={formData.interests.includes(interest)}
                    className={`p-2 text-sm border rounded-lg transition-colors ${
                      formData.interests.includes(interest)
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Interest Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Add Custom Interest</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a custom interest or hobby"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInterest(newInterest)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => addInterest(newInterest)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={!newInterest.trim() || formData.interests.includes(newInterest.trim())}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Anything else about {formData.name}?</h3>
              <p className="text-gray-600">Add any additional information that might help with gift suggestions</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
              <textarea
                placeholder="Any other details about your friend that might be helpful for gift recommendations? For example: recent life events, current interests, things they've mentioned wanting, etc."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.notes || "").length}/1000 characters
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Country:</strong> {formData.country} ({COUNTRY_CURRENCY_MAP[formData.country || 'Other'] || 'USD'})</p>
                <p><strong>Relationship:</strong> {formData.category}</p>
                {formData.personalityTraits.length > 0 && (
                  <p><strong>Personality:</strong> {formData.personalityTraits.join(', ')}</p>
                )}
                {formData.interests.length > 0 && (
                  <p><strong>Interests:</strong> {formData.interests.join(', ')}</p>
                )}
                {formData.notes && (
                  <p><strong>Notes:</strong> {formData.notes.substring(0, 100)}{formData.notes.length > 100 ? '...' : ''}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {friend ? 'Edit Friend' : 'Add New Friend'}
            </h2>
            <div className="text-sm text-gray-500">
              Step {currentStep} of 5: {stepTitles[currentStep - 1]}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < currentStep
                      ? 'bg-green-600 text-white'
                      : step === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex space-x-2">
            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createFriendMutation.isPending || updateFriendMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {createFriendMutation.isPending || updateFriendMutation.isPending
                  ? 'Saving...'
                  : friend
                  ? 'Update Friend'
                  : 'Add Friend'
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}