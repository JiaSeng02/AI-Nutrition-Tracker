import { MealType } from './food';

export interface MacroNutrient {
  label: string;
  amount: number;
  unit: string;
  color: string;
  target?: number;
}

export interface MealTypeMeta {
  type: MealType;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const MEAL_TYPES: MealTypeMeta[] = [
  {
    type: 'breakfast',
    title: 'Breakfast',
    icon: 'sunny-outline',
    color: '#EA580C', // orange-600
    bgColor: '#FFF7ED', // orange-50
  },
  {
    type: 'lunch',
    title: 'Lunch',
    icon: 'restaurant-outline',
    color: '#059669', // emerald-600
    bgColor: '#ECFDF5', // emerald-50
  },
  {
    type: 'dinner',
    title: 'Dinner',
    icon: 'moon-outline',
    color: '#4F46E5', // indigo-600
    bgColor: '#EEF2FF', // indigo-50
  },
  {
    type: 'snack',
    title: 'Snack',
    icon: 'nutrition-outline',
    color: '#DB2777', // pink-600
    bgColor: '#FDF2F8', // pink-50
  },
];
