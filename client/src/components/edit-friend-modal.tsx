import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertFriendSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Friend, InsertFriend } from "@shared/schema";

interface EditFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend;
}

const personalityTraits = [
  "Creative", "Sporty", "Intellectual", "Outdoorsy", "Social", "Tech-savvy",
  "Artistic", "Practical", "Adventurous", "Thoughtful", "Energetic", "Innovative"
];

const interests = [
  "Art & Crafts", "Sports", "Technology", "Reading", "Music", "Cooking",
  "Travel", "Photography", "Gaming", "Fitness", "Fashion", "Movies"
];

const countries = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France",
  "Japan", "South Korea", "Brazil", "Mexico", "India", "China", "Italy", "Spain"
];

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" }
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" }
];

const ageRangeOptions = [
  { value: "18-25", label: "18-25" },
  { value: "26-30", label: "26-30" },
  { value: "31-35", label: "31-35" },
  { value: "36-40", label: "36-40" },
  { value: "41-45", label: "41-45" },
  { value: "46-50", label: "46-50" },
  { value: "51-55", label: "51-55" },
  { value: "56-60", label: "56-60" },
  { value: "61-65", label: "61-65" },
  { value: "66-70", label: "66-70" },
  { value: "70+", label: "70+" }
];

export function EditFriendModal({ isOpen, onClose, friend }: EditFriendModalProps) {
  const [selectedTraits, setSelectedTraits] = useState<string[]>(friend.personalityTraits);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(friend.interests);
  const [selectedCategory, setSelectedCategory] = useState<string>(friend.category || "friend");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [profilePreview, setProfilePreview] = useState<string | null>(friend.profilePicture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing categories for suggestions
  const { data: existingCategories = [] } = useQuery({
    queryKey: ['/api/friends/categories'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/friends/categories");
      return response.json() as Promise<string[]>;
    },
  });

  const form = useForm<InsertFriend>({
    resolver: zodResolver(insertFriendSchema),
    defaultValues: {
      name: friend.name,
      personalityTraits: friend.personalityTraits,
      interests: friend.interests,
      category: friend.category || "friend",
      notes: friend.notes || "",
      country: friend.country || "United States",
      currency: friend.currency || "USD",
      profilePicture: friend.profilePicture || "",
      gender: friend.gender || "",
      ageRange: friend.ageRange || "",
    },
  });

  const updateFriendMutation = useMutation({
    mutationFn: async (data: InsertFriend) => {
      const response = await apiRequest("PUT", `/api/friends/${friend.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Friend updated successfully!",
        description: "The changes have been saved.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error updating friend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setSelectedTraits(friend.personalityTraits);
    setSelectedInterests(friend.interests);
    setSelectedCategory(friend.category || "friend");
    setCustomCategory("");
    setProfilePreview(friend.profilePicture || null);
    onClose();
  };

  const handleTraitChange = (trait: string, checked: boolean) => {
    if (checked && selectedTraits.length >= 5) {
      toast({
        title: "Maximum traits selected",
        description: "You can select up to 5 personality traits.",
        variant: "destructive",
      });
      return;
    }

    const newTraits = checked 
      ? [...selectedTraits, trait]
      : selectedTraits.filter(t => t !== trait);
    
    setSelectedTraits(newTraits);
    form.setValue("personalityTraits", newTraits);
  };

  const handleInterestChange = (interest: string, checked: boolean) => {
    const newInterests = checked 
      ? [...selectedInterests, interest]
      : selectedInterests.filter(i => i !== interest);
    
    setSelectedInterests(newInterests);
    form.setValue("interests", newInterests);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const finalCategory = customCategory || category;
    if (checked && !selectedCategory) {
      setSelectedCategory(finalCategory);
      form.setValue("category", finalCategory);
    } else if (!checked && selectedCategory === finalCategory) {
      setSelectedCategory("friend");
      form.setValue("category", "friend");
    }
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
    if (value.trim()) {
      setSelectedCategory(value.trim());
      form.setValue("category", value.trim());
    } else if (selectedCategory && !existingCategories.includes(selectedCategory)) {
      setSelectedCategory("friend");
      form.setValue("category", "friend");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePreview(result);
        form.setValue("profilePicture", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setProfilePreview(null);
    form.setValue("profilePicture", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: InsertFriend) => {
    if (selectedTraits.length === 0) {
      toast({
        title: "Personality traits required",
        description: "Please select at least one personality trait.",
        variant: "destructive",
      });
      return;
    }

    if (selectedInterests.length === 0) {
      toast({
        title: "Interests required",
        description: "Please select at least one interest.",
        variant: "destructive",
      });
      return;
    }

    updateFriendMutation.mutate({
      ...data,
      personalityTraits: selectedTraits,
      interests: selectedInterests,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Edit Friend</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Profile Picture */}
            <div>
              <FormLabel className="text-sm font-medium text-gray-700">Profile Picture (Optional)</FormLabel>
              <div className="mt-2 flex items-center space-x-4">
                {profilePreview ? (
                  <div className="relative">
                    <img 
                      src={profilePreview} 
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeProfilePicture}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <Upload className="text-gray-400" size={24} />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2" size={16} />
                    Upload Photo
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/GIF</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Friend's Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your friend's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gender and Age Range (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Gender (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Not specified</SelectItem>
                        {genderOptions.map((gender) => (
                          <SelectItem key={gender.value} value={gender.value}>
                            {gender.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ageRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Age Range (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Not specified</SelectItem>
                        {ageRangeOptions.map((ageRange) => (
                          <SelectItem key={ageRange.value} value={ageRange.value}>
                            {ageRange.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Country and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Country *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Currency *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category */}
            <div>
              <FormLabel className="text-sm font-medium text-gray-700">Category</FormLabel>
              <p className="text-sm text-gray-500 mb-4">Choose or create a category for this friend</p>
              
              {/* Suggested Categories */}
              {existingCategories.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-600 mb-2">Suggested categories:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {existingCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategory === category}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategory(category);
                              setCustomCategory("");
                              form.setValue("category", category);
                            }
                          }}
                        />
                        <label htmlFor={`category-${category}`} className="text-sm cursor-pointer capitalize">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Category Input */}
              <div className="mt-3">
                <Input
                  placeholder="Or create a new category..."
                  value={customCategory}
                  onChange={(e) => handleCustomCategoryChange(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Selected Category Display */}
              <div className="mt-2 text-sm text-gray-600">
                Current category: <span className="font-medium capitalize">{selectedCategory}</span>
              </div>
            </div>

            {/* Personality Traits */}
            <div>
              <FormLabel className="text-sm font-medium text-gray-700">Personality Traits *</FormLabel>
              <p className="text-sm text-gray-500 mb-4">Select traits that best describe your friend (choose up to 5)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {personalityTraits.map((trait) => (
                  <div key={trait} className="flex items-center space-x-2">
                    <Checkbox
                      id={trait}
                      checked={selectedTraits.includes(trait)}
                      onCheckedChange={(checked) => handleTraitChange(trait, checked as boolean)}
                    />
                    <label htmlFor={trait} className="text-sm cursor-pointer">
                      {trait}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <FormLabel className="text-sm font-medium text-gray-700">Interests & Hobbies *</FormLabel>
              <p className="text-sm text-gray-500 mb-4">What does your friend enjoy? (select multiple)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interests.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={selectedInterests.includes(interest)}
                      onCheckedChange={(checked) => handleInterestChange(interest, checked as boolean)}
                    />
                    <label htmlFor={interest} className="text-sm cursor-pointer">
                      {interest}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any other details that might help with gift suggestions..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-indigo-700 text-white"
                disabled={updateFriendMutation.isPending}
              >
                {updateFriendMutation.isPending ? "Updating..." : "Update Friend"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}