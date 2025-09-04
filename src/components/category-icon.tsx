import React, { type FC } from 'react';
import { Utensils, BookOpen, Car, Clapperboard, Zap, Home, Landmark, PiggyBank, ShoppingCart, HelpCircle } from 'lucide-react';

interface CategoryIconProps {
  category: string;
  className?: string;
}

const iconMap: Record<string, React.ReactElement> = {
  'Food': <Utensils />,
  'Textbooks': <BookOpen />,
  'Transportation': <Car />,
  'Entertainment': <Clapperboard />,
  'Utilities': <Zap />,
  'Rent': <Home />,
  'Salary': <Landmark />,
  'Other': <ShoppingCart />,
  'Savings Goal': <PiggyBank />,
};

export const CategoryIcon: FC<CategoryIconProps> = ({ category, className = 'h-6 w-6' }) => {
  const icon = iconMap[category] || <HelpCircle />;
  return React.cloneElement(icon, { className });
};
