import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Store, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GiftRecommendation } from "@shared/schema";

interface GiftCardProps {
  gift: GiftRecommendation;
  friendId: string;
}

export function GiftCard({ gift, friendId }: GiftCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveGiftMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/saved-gifts", {
        friendId,
        giftData: gift,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ['/api/saved-gifts'] });
      toast({
        title: "Gift saved!",
        description: "Added to your saved gifts collection.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving gift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveToggle = () => {
    if (!isSaved) {
      saveGiftMutation.mutate();
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-blue-100 text-blue-800";
    if (percentage >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow overflow-hidden">
      {/* Image container with hover effect */}
      <div 
        className="relative w-full h-48 cursor-pointer group overflow-hidden"
        onMouseEnter={() => setShowFullImage(true)}
        onMouseLeave={() => setShowFullImage(false)}
      >
        <img 
          src={gift.image} 
          alt={gift.name}
          className={`w-full h-full transition-all duration-500 ease-in-out ${
            showFullImage 
              ? 'object-contain scale-110' 
              : 'object-contain group-hover:scale-105'
          }`}
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250`;
          }}
        />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">{gift.name}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveToggle}
            disabled={saveGiftMutation.isPending}
            className={isSaved ? "text-secondary" : "text-gray-400 hover:text-secondary"}
          >
            <Heart className={isSaved ? "fill-current" : ""} size={20} />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{gift.description}</p>
        
        {/* Personality Match */}
        <div className="flex items-center mb-4">
          <span className={`text-xs px-2 py-1 rounded-full mr-2 ${getMatchColor(gift.matchPercentage)}`}>
            {gift.matchPercentage}% Match
          </span>
          <span className="text-xs text-gray-500">
            {gift.matchingTraits.join(", ")}
          </span>
        </div>

        {/* Price and Shops */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold text-primary">{gift.price}</span>
          <div className="flex items-center text-sm text-gray-500">
            <Store className="mr-1" size={16} />
            <span>{gift.shops.length} shops</span>
          </div>
        </div>

        {/* Shop Options */}
        <div className="space-y-2">
          {gift.shops.slice(0, 2).map((shop, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="font-medium">{shop.name}</span>
                <span className={`ml-2 ${shop.inStock ? "text-green-600" : "text-orange-600"}`}>
                  {shop.inStock ? "In Stock" : "Limited"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold mr-3">{shop.price}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:underline p-0 h-auto"
                  onClick={() => window.open(shop.url, '_blank')}
                >
                  View <ExternalLink className="ml-1" size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
