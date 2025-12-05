import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Eco-friendly color classes
export const ecoColors = {
  primary: {
    50: '#f1f8e9',
    100: '#dcedc8',
    200: '#c5e1a5',
    300: '#aed581',
    400: '#9ccc65',
    500: '#8bc34a',
    600: '#7cb342',
    700: '#689f38',
    800: '#558b2f',
    900: '#33691e',
  },
  earth: {
    50: '#efebe9',
    100: '#d7ccc8',
    200: '#bcaaa4',
    300: '#a1887f',
    400: '#8d6e63',
    500: '#795548',
    600: '#6d4c41',
    700: '#5d4037',
    800: '#4e342e',
    900: '#3e2723',
  },
  water: {
    50: '#e0f2f1',
    100: '#b2dfdb',
    200: '#80cbc4',
    300: '#4db6ac',
    400: '#26a69a',
    500: '#00897b',
    600: '#00796b',
    700: '#00695c',
    800: '#004d40',
    900: '#00352c',
  }
}

// Role-based eco color mapping
export const getRoleEcoColor = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'adviser':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'panel':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'student':
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

// Eco stat card configurations
export const getEcoStatCards = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'student':
      return [
        { label: 'My Thesis', value: '1', icon: '🌱', color: 'bg-green-50 text-green-600 border-green-200' },
        { label: 'Documents', value: '12', icon: '📄', color: 'bg-blue-50 text-blue-600 border-blue-200' },
        { label: 'Pending Reviews', value: '2', icon: '⏰', color: 'bg-amber-50 text-amber-600 border-amber-200' },
        { label: 'Group Members', value: '4', icon: '👥', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
      ]
    case 'adviser':
      return [
        { label: 'Advised Theses', value: '8', icon: '🌳', color: 'bg-green-50 text-green-600 border-green-200' },
        { label: 'Pending Reviews', value: '5', icon: '⏰', color: 'bg-amber-50 text-amber-600 border-amber-200' },
        { label: 'Approved', value: '12', icon: '✅', color: 'bg-blue-50 text-blue-600 border-blue-200' },
        { label: 'Students', value: '24', icon: '👥', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
      ]
    case 'panel':
      return [
        { label: 'Assigned Theses', value: '6', icon: '🌿', color: 'bg-green-50 text-green-600 border-green-200' },
        { label: 'To Review', value: '3', icon: '⏰', color: 'bg-amber-50 text-amber-600 border-amber-200' },
        { label: 'Upcoming Defenses', value: '2', icon: '📅', color: 'bg-blue-50 text-blue-600 border-blue-200' },
        { label: 'Reviewed', value: '18', icon: '✅', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
      ]
    case 'admin':
    default:
      return [
        { label: 'Total Theses', value: '42', icon: '🌍', color: 'bg-green-50 text-green-600 border-green-200' },
        { label: 'Active Groups', value: '28', icon: '👥', color: 'bg-blue-50 text-blue-600 border-blue-200' },
        { label: 'Total Documents', value: '324', icon: '📄', color: 'bg-amber-50 text-amber-600 border-amber-200' },
        { label: 'This Month', value: '+12', icon: '📈', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
      ]
  }
}
