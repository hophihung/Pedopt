/**
 * Icon Fallback Utility
 * Temporary replacement for Lucide icons to fix "Invalid view returned from registry" error
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
  fill?: string;
}

// Map Lucide icon names to Ionicons equivalents
const iconMap: { [key: string]: string } = {
  // Navigation
  'ArrowLeft': 'arrow-back',
  'ArrowRight': 'arrow-forward',
  'Home': 'home',
  'User': 'person',
  
  // Actions
  'Heart': 'heart',
  'X': 'close',
  'Check': 'checkmark',
  'Plus': 'add',
  'Edit': 'pencil',
  'Edit2': 'create',
  'Trash2': 'trash',
  'Send': 'send',
  'Search': 'search',
  
  // Communication
  'MessageCircle': 'chatbubble',
  'MessageSquare': 'chatbox',
  'Mail': 'mail',
  'Phone': 'call',
  
  // Media
  'Camera': 'camera',
  'Image': 'image',
  'ImageIcon': 'image',
  'Video': 'videocam',
  'Play': 'play',
  'Music': 'musical-notes',
  
  // Shopping
  'ShoppingBag': 'bag',
  'ShoppingCart': 'cart',
  'DollarSign': 'cash',
  'Package': 'cube',
  'Truck': 'car',
  
  // Location
  'MapPin': 'location',
  
  // Status
  'Star': 'star',
  'AlertCircle': 'alert-circle',
  'CheckCircle': 'checkmark-circle',
  'XCircle': 'close-circle',
  'Clock': 'time',
  'Eye': 'eye',
  'EyeOff': 'eye-off',
  
  // Animals
  'PawPrint': 'paw',
  
  // Social
  'Users': 'people',
  'ThumbsUp': 'thumbs-up',
  'Flag': 'flag',
  
  // Misc
  'Grid3x3': 'grid',
  'RotateCcw': 'refresh',
  'Lock': 'lock-closed',
  'Gift': 'gift',
  'Coins': 'wallet',
  'TrendingUp': 'trending-up',
  'History': 'time',
  'Sparkles': 'sparkles',
  'Scale': 'scale',
  'Palette': 'color-palette',
  'Activity': 'pulse',
  'Shield': 'shield',
  'Syringe': 'medical',
  'Baby': 'person',
  'Zap': 'flash',
  'FileText': 'document-text',
};

// Generic icon component that falls back to Ionicons
export function IconFallback({ 
  name, 
  size = 24, 
  color = '#000', 
  strokeWidth,
  style,
  fill
}: IconProps & { name: string }) {
  const ioniconsName = iconMap[name] || 'help-circle';
  
  return (
    <Ionicons 
      name={ioniconsName as any} 
      size={size} 
      color={fill || color}
      style={style}
    />
  );
}

// Export individual icon components for easy replacement
export const Heart = (props: IconProps) => <IconFallback name="Heart" {...props} />;
export const X = (props: IconProps) => <IconFallback name="X" {...props} />;
export const ArrowLeft = (props: IconProps) => <IconFallback name="ArrowLeft" {...props} />;
export const ArrowRight = (props: IconProps) => <IconFallback name="ArrowRight" {...props} />;
export const Home = (props: IconProps) => <IconFallback name="Home" {...props} />;
export const User = (props: IconProps) => <IconFallback name="User" {...props} />;
export const MessageCircle = (props: IconProps) => <IconFallback name="MessageCircle" {...props} />;
export const PawPrint = (props: IconProps) => <IconFallback name="PawPrint" {...props} />;
export const Search = (props: IconProps) => <IconFallback name="Search" {...props} />;
export const Star = (props: IconProps) => <IconFallback name="Star" {...props} />;
export const Send = (props: IconProps) => <IconFallback name="Send" {...props} />;
export const MapPin = (props: IconProps) => <IconFallback name="MapPin" {...props} />;
export const RotateCcw = (props: IconProps) => <IconFallback name="RotateCcw" {...props} />;
export const Grid3x3 = (props: IconProps) => <IconFallback name="Grid3x3" {...props} />;
export const Users = (props: IconProps) => <IconFallback name="Users" {...props} />;
export const Check = (props: IconProps) => <IconFallback name="Check" {...props} />;
export const ShoppingBag = (props: IconProps) => <IconFallback name="ShoppingBag" {...props} />;
export const Eye = (props: IconProps) => <IconFallback name="Eye" {...props} />;
export const EyeOff = (props: IconProps) => <IconFallback name="EyeOff" {...props} />;
export const Mail = (props: IconProps) => <IconFallback name="Mail" {...props} />;
export const Lock = (props: IconProps) => <IconFallback name="Lock" {...props} />;
export const Sparkles = (props: IconProps) => <IconFallback name="Sparkles" {...props} />;

// Add more exports as needed...