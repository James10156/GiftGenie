import { useState } from "react";
import { themes, getThemesByCategory, type Theme } from "../lib/themes";

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeSelect: (themeId: string) => void;
  onClose: () => void;
}

export function ThemeSelector({ currentTheme, onThemeSelect, onClose }: ThemeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<Theme['category'] | 'all'>('all');
  
  const categories = [
    { id: 'all', name: 'All Themes', icon: '🎨' },
    { id: 'neutral', name: 'Neutral', icon: '⚪' },
    { id: 'girly', name: 'Girly', icon: '💕' },
    { id: 'boyish', name: 'Boyish', icon: '💙' },
    { id: 'elegant', name: 'Elegant', icon: '✨' },
    { id: 'nature', name: 'Nature', icon: '🌿' }
  ] as const;

  const filteredThemes = selectedCategory === 'all' 
    ? themes 
    : getThemesByCategory(selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Choose Theme</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Close"
            >
              ✕
            </button>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 gap-3">
            {filteredThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeSelect(theme.id);
                  onClose();
                }}
                className={`text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  currentTheme === theme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Theme Preview */}
                <div className={`${theme.background} ${theme.border} border rounded-md p-3 mb-2`}>
                  <div className={`${theme.text} font-medium text-sm`}>
                    Sample Friend
                  </div>
                  <div className={`${theme.textSecondary} text-xs mt-1`}>
                    Loves hiking and cooking
                  </div>
                  <div className={`${theme.accent} text-xs mt-1`}>
                    • Birthday: Dec 15th
                  </div>
                </div>
                
                {/* Theme Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {theme.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {theme.description}
                    </div>
                  </div>
                  {currentTheme === theme.id && (
                    <div className="text-blue-500 text-sm">✓</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}