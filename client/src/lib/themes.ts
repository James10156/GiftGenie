export interface Theme {
  id: string;
  name: string;
  description: string;
  background: string;
  border: string;
  text: string;
  textSecondary: string;
  accent: string;
  category: 'neutral' | 'girly' | 'boyish' | 'elegant' | 'nature';
}

export const themes: Theme[] = [
  // Neutral themes
  {
    id: 'default',
    name: 'Classic White',
    description: 'Clean and minimalist',
    background: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    accent: 'text-blue-600',
    category: 'neutral'
  },
  {
    id: 'soft-gray',
    name: 'Soft Gray',
    description: 'Subtle and professional',
    background: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    accent: 'text-slate-600',
    category: 'neutral'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark and sophisticated',
    background: 'bg-gray-900',
    border: 'border-gray-700',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    accent: 'text-blue-400',
    category: 'neutral'
  },

  // Girly themes
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    description: 'Elegant and feminine',
    background: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    textSecondary: 'text-rose-700',
    accent: 'text-rose-600',
    category: 'girly'
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Soft and dreamy',
    background: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    textSecondary: 'text-purple-700',
    accent: 'text-purple-600',
    category: 'girly'
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: 'Sweet and delicate',
    background: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-900',
    textSecondary: 'text-pink-700',
    accent: 'text-pink-600',
    category: 'girly'
  },

  // Boyish themes
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Deep and confident',
    background: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
    textSecondary: 'text-blue-700',
    accent: 'text-blue-600',
    category: 'boyish'
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Strong and natural',
    background: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-900',
    textSecondary: 'text-green-700',
    accent: 'text-green-600',
    category: 'boyish'
  },
  {
    id: 'steel-gray',
    name: 'Steel Gray',
    description: 'Industrial and modern',
    background: 'bg-slate-100',
    border: 'border-slate-400',
    text: 'text-slate-900',
    textSecondary: 'text-slate-700',
    accent: 'text-slate-600',
    category: 'boyish'
  },

  // Elegant themes
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Warm and luxurious',
    background: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    textSecondary: 'text-amber-700',
    accent: 'text-amber-600',
    category: 'elegant'
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Regal and sophisticated',
    background: 'bg-violet-100',
    border: 'border-violet-400',
    text: 'text-violet-900',
    textSecondary: 'text-violet-700',
    accent: 'text-violet-600',
    category: 'elegant'
  },

  // Nature themes
  {
    id: 'jungle-vibes',
    name: 'Jungle Vibes',
    description: 'Tropical and vibrant',
    background: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    textSecondary: 'text-emerald-700',
    accent: 'text-emerald-600',
    category: 'nature'
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Warm and energetic',
    background: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-900',
    textSecondary: 'text-orange-700',
    accent: 'text-orange-600',
    category: 'nature'
  },
  {
    id: 'earth-tone',
    name: 'Earth Tone',
    description: 'Natural and grounding',
    background: 'bg-stone-100',
    border: 'border-stone-400',
    text: 'text-stone-900',
    textSecondary: 'text-stone-700',
    accent: 'text-stone-600',
    category: 'nature'
  }
];

export const getThemeById = (themeId: string): Theme => {
  return themes.find(theme => theme.id === themeId) || themes[0];
};

export const getThemesByCategory = (category: Theme['category']): Theme[] => {
  return themes.filter(theme => theme.category === category);
};