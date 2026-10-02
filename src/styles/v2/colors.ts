// Approved Figma palette. Keep semantic aliases separate from primitive values.
export const colorPrimitives = {
  'neutral-50': '#FBFBFB',
  'neutral-100': '#ECECEE',
  'neutral-200': '#D9D9D9',
  'neutral-300': '#A4A5A6',
  'neutral-400': '#909090',
  'neutral-500': '#6B6B6B',
  'neutral-600': '#525254',
  'neutral-700': '#3D3D3F',
  'neutral-800': '#1A1C1F',
  'neutral-900': '#18181A',
  'neutral-950': '#101012',
  'brand-50': '#EFF6FF',
  'brand-100': '#DBEAFF',
  'brand-200': '#B8D7FF',
  'brand-300': '#85BAFF',
  'brand-400': '#4797FF',
  'brand-500': '#1A7BFF',
  'brand-600': '#006CFA',
  'brand-700': '#005BD4',
  'brand-800': '#004BB0',
  'brand-900': '#003C8C',
  'brand-950': '#002354',
  'violet-50': '#F5F3FF',
  'violet-100': '#EDE9FE',
  'violet-200': '#DDD6FE',
  'violet-300': '#C4B5FD',
  'violet-400': '#A78BFA',
  'violet-500': '#8B5CF6',
  'violet-600': '#7C3AED',
  'violet-700': '#6D28D9',
  'violet-800': '#5B21B6',
  'violet-900': '#4C1D95',
  'violet-950': '#2E1065',
  'green-50': '#F0FDF4',
  'green-100': '#DCFCE7',
  'green-200': '#BBF7D0',
  'green-300': '#86EFAC',
  'green-400': '#4ADE80',
  'green-500': '#22C55E',
  'green-600': '#16A34A',
  'green-700': '#15803D',
  'green-800': '#166534',
  'green-900': '#14532D',
  'green-950': '#052E16',
  'amber-50': '#FFFBEB',
  'amber-100': '#FEF3C7',
  'amber-200': '#FDE68A',
  'amber-300': '#FCD34D',
  'amber-400': '#FBBF24',
  'amber-500': '#F59E0B',
  'amber-600': '#D97706',
  'amber-700': '#B45309',
  'amber-800': '#92400E',
  'amber-900': '#78350F',
  'amber-950': '#451A03',
  'red-50': '#FEF2F2',
  'red-100': '#FEE2E2',
  'red-200': '#FECACA',
  'red-300': '#FCA5A5',
  'red-400': '#F87171',
  'red-500': '#EF4444',
  'red-600': '#DC2626',
  'red-700': '#B91C1C',
  'red-800': '#991B1B',
  'red-900': '#7F1D1D',
  'red-950': '#450A0A',
  white: '#FFFFFF',
  'alpha-brand-12': 'rgb(0 108 250 / 12%)',
  'alpha-black-04': 'rgb(0 0 0 / 4%)',
  'alpha-black-08': 'rgb(0 0 0 / 8%)',
  'alpha-black-40': 'rgb(0 0 0 / 40%)',
  'alpha-black-64': 'rgb(0 0 0 / 64%)',
  'alpha-white-06': 'rgb(255 255 255 / 6%)',
  'alpha-white-10': 'rgb(255 255 255 / 10%)',
  'alpha-white-12': 'rgb(255 255 255 / 12%)',
} as const

export const colorSemantics = {
  canvas: {
    light: 'white',
    dark: 'neutral-900',
  },
  surface: {
    light: 'white',
    dark: 'neutral-900',
  },
  'surface-raised': {
    light: 'white',
    dark: 'neutral-900',
  },
  'surface-inset': {
    light: 'neutral-50',
    dark: 'neutral-800',
  },
  'text-default': {
    light: 'neutral-800',
    dark: 'neutral-100',
  },
  'text-muted': {
    light: 'neutral-600',
    dark: 'neutral-200',
  },
  'text-subtle': {
    light: 'neutral-400',
    dark: 'neutral-300',
  },
  'text-button': {
    light: 'white',
    dark: 'white',
  },
  'border-subtle': {
    light: 'alpha-black-08',
    dark: 'alpha-white-12',
  },
  'border-default': {
    light: 'neutral-500',
    dark: 'neutral-400',
  },
  'border-strong': {
    light: 'neutral-600',
    dark: 'neutral-300',
  },
  'action-primary': {
    light: 'brand-600',
    dark: 'brand-600',
  },
  'action-primary-hover': {
    light: 'brand-700',
    dark: 'brand-700',
  },
  'action-primary-pressed': {
    light: 'brand-800',
    dark: 'brand-800',
  },
  'action-primary-foreground': {
    light: 'white',
    dark: 'white',
  },
  'interactive-hover': {
    light: 'alpha-black-04',
    dark: 'alpha-white-06',
  },
  'interactive-pressed': {
    light: 'alpha-black-08',
    dark: 'alpha-white-10',
  },
  selected: {
    light: 'alpha-brand-12',
    dark: 'alpha-brand-12',
  },
  'selected-foreground': {
    light: 'brand-600',
    dark: 'brand-600',
  },
  link: {
    light: 'brand-700',
    dark: 'brand-400',
  },
  'link-hover': {
    light: 'brand-800',
    dark: 'brand-300',
  },
  'focus-ring': {
    light: 'brand-200',
    dark: 'brand-200',
  },
  'focus-border': {
    light: 'brand-600',
    dark: 'brand-300',
  },
  disabled: {
    light: 'neutral-100',
    dark: 'neutral-800',
  },
  'disabled-foreground': {
    light: 'neutral-400',
    dark: 'neutral-500',
  },
  'disabled-border': {
    light: 'neutral-200',
    dark: 'neutral-700',
  },
  info: {
    light: 'violet-50',
    dark: 'violet-950',
  },
  'info-foreground': {
    light: 'violet-700',
    dark: 'violet-300',
  },
  'info-border': {
    light: 'violet-700',
    dark: 'violet-400',
  },
  success: {
    light: 'green-50',
    dark: 'green-950',
  },
  'success-foreground': {
    light: 'green-700',
    dark: 'green-300',
  },
  'success-border': {
    light: 'green-700',
    dark: 'green-400',
  },
  warning: {
    light: 'amber-50',
    dark: 'amber-950',
  },
  'warning-foreground': {
    light: 'amber-800',
    dark: 'amber-300',
  },
  'warning-border': {
    light: 'amber-700',
    dark: 'amber-400',
  },
  danger: {
    light: 'red-50',
    dark: 'red-950',
  },
  'danger-foreground': {
    light: 'red-700',
    dark: 'red-300',
  },
  'danger-border': {
    light: 'red-700',
    dark: 'red-400',
  },
  destructive: {
    light: 'red-700',
    dark: 'red-700',
  },
  'destructive-hover': {
    light: 'red-800',
    dark: 'red-800',
  },
  'destructive-pressed': {
    light: 'red-900',
    dark: 'red-900',
  },
  'destructive-foreground': {
    light: 'white',
    dark: 'white',
  },
  overlay: {
    light: 'alpha-black-40',
    dark: 'alpha-black-64',
  },
  inverse: {
    light: 'neutral-800',
    dark: 'neutral-50',
  },
  'inverse-foreground': {
    light: 'white',
    dark: 'neutral-800',
  },
} as const

export type ColorRole = keyof typeof colorSemantics
export type V2ColorMode = 'light' | 'dark'

export const v2TailwindColors = Object.fromEntries(
  Object.keys(colorSemantics).map((role) => [`v2-${role}`, `var(--v2-color-${role})`]),
)
