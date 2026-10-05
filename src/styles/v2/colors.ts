export type ColorMode = 'light' | 'dark'
export type ColorValue = { hex: string; alpha: number }

export const colorPrimitives = {
  'v2-white': {
    hex: '#FFFFFF',
    alpha: 1,
  },
  'v2-alpha-black-04': {
    hex: '#000000',
    alpha: 0.04,
  },
  'v2-alpha-black-08': {
    hex: '#000000',
    alpha: 0.08,
  },
  'v2-alpha-black-40': {
    hex: '#000000',
    alpha: 0.4,
  },
  'v2-alpha-black-64': {
    hex: '#000000',
    alpha: 0.64,
  },
  'v2-alpha-white-06': {
    hex: '#FFFFFF',
    alpha: 0.06,
  },
  'v2-alpha-white-10': {
    hex: '#FFFFFF',
    alpha: 0.1,
  },
  'v2-alpha-white-12': {
    hex: '#FFFFFF',
    alpha: 0.12,
  },
  'v2-amber-50': {
    hex: '#FFFBEB',
    alpha: 1,
  },
  'v2-amber-100': {
    hex: '#FEF3C7',
    alpha: 1,
  },
  'v2-amber-200': {
    hex: '#FDE68A',
    alpha: 1,
  },
  'v2-amber-300': {
    hex: '#FCD34D',
    alpha: 1,
  },
  'v2-amber-400': {
    hex: '#FBBF24',
    alpha: 1,
  },
  'v2-amber-500': {
    hex: '#F59E0B',
    alpha: 1,
  },
  'v2-amber-600': {
    hex: '#D97706',
    alpha: 1,
  },
  'v2-amber-700': {
    hex: '#B45309',
    alpha: 1,
  },
  'v2-amber-800': {
    hex: '#92400E',
    alpha: 1,
  },
  'v2-amber-900': {
    hex: '#78350F',
    alpha: 1,
  },
  'v2-amber-950': {
    hex: '#451A03',
    alpha: 1,
  },
  'v2-brand-50': {
    hex: '#F0F7FF',
    alpha: 1,
  },
  'v2-brand-100': {
    hex: '#E0EFFE',
    alpha: 1,
  },
  'v2-brand-200': {
    hex: '#BDDCFF',
    alpha: 1,
  },
  'v2-brand-300': {
    hex: '#8FC4FF',
    alpha: 1,
  },
  'v2-brand-400': {
    hex: '#58A5F3',
    alpha: 1,
  },
  'v2-brand-500': {
    hex: '#2387E5',
    alpha: 1,
  },
  'v2-brand-600': {
    hex: '#0369CC',
    alpha: 1,
  },
  'v2-brand-700': {
    hex: '#0259AD',
    alpha: 1,
  },
  'v2-brand-800': {
    hex: '#02498F',
    alpha: 1,
  },
  'v2-brand-900': {
    hex: '#023C75',
    alpha: 1,
  },
  'v2-brand-950': {
    hex: '#01264A',
    alpha: 1,
  },
  'v2-green-50': {
    hex: '#F0FDF4',
    alpha: 1,
  },
  'v2-green-100': {
    hex: '#DCFCE7',
    alpha: 1,
  },
  'v2-green-200': {
    hex: '#BBF7D0',
    alpha: 1,
  },
  'v2-green-300': {
    hex: '#86EFAC',
    alpha: 1,
  },
  'v2-green-400': {
    hex: '#4ADE80',
    alpha: 1,
  },
  'v2-green-500': {
    hex: '#22C55E',
    alpha: 1,
  },
  'v2-green-600': {
    hex: '#16A34A',
    alpha: 1,
  },
  'v2-green-700': {
    hex: '#15803D',
    alpha: 1,
  },
  'v2-green-800': {
    hex: '#166534',
    alpha: 1,
  },
  'v2-green-900': {
    hex: '#14532D',
    alpha: 1,
  },
  'v2-green-950': {
    hex: '#052E16',
    alpha: 1,
  },
  'v2-neutral-50': {
    hex: '#FBFBFB',
    alpha: 1,
  },
  'v2-neutral-100': {
    hex: '#ECECEC',
    alpha: 1,
  },
  'v2-neutral-200': {
    hex: '#D9D9D9',
    alpha: 1,
  },
  'v2-neutral-300': {
    hex: '#A5A5A5',
    alpha: 1,
  },
  'v2-neutral-400': {
    hex: '#909090',
    alpha: 1,
  },
  'v2-neutral-500': {
    hex: '#6B6B6B',
    alpha: 1,
  },
  'v2-neutral-600': {
    hex: '#525252',
    alpha: 1,
  },
  'v2-neutral-700': {
    hex: '#3D3D3D',
    alpha: 1,
  },
  'v2-neutral-750': {
    hex: '#2C2C2C',
    alpha: 1,
  },
  'v2-neutral-800': {
    hex: '#232323',
    alpha: 1,
  },
  'v2-neutral-850': {
    hex: '#212121',
    alpha: 1,
  },
  'v2-neutral-900': {
    hex: '#1A1A1A',
    alpha: 1,
  },
  'v2-neutral-950': {
    hex: '#111111',
    alpha: 1,
  },
  'v2-red-50': {
    hex: '#FEF2F2',
    alpha: 1,
  },
  'v2-red-100': {
    hex: '#FEE2E2',
    alpha: 1,
  },
  'v2-red-200': {
    hex: '#FECACA',
    alpha: 1,
  },
  'v2-red-300': {
    hex: '#FCA5A5',
    alpha: 1,
  },
  'v2-red-400': {
    hex: '#F87171',
    alpha: 1,
  },
  'v2-red-500': {
    hex: '#EF4444',
    alpha: 1,
  },
  'v2-red-600': {
    hex: '#DC2626',
    alpha: 1,
  },
  'v2-red-700': {
    hex: '#B91C1C',
    alpha: 1,
  },
  'v2-red-800': {
    hex: '#991B1B',
    alpha: 1,
  },
  'v2-red-900': {
    hex: '#7F1D1D',
    alpha: 1,
  },
  'v2-red-950': {
    hex: '#450A0A',
    alpha: 1,
  },
  'v2-violet-50': {
    hex: '#F5F3FF',
    alpha: 1,
  },
  'v2-violet-100': {
    hex: '#EDE9FE',
    alpha: 1,
  },
  'v2-violet-200': {
    hex: '#DDD6FE',
    alpha: 1,
  },
  'v2-violet-300': {
    hex: '#C4B5FD',
    alpha: 1,
  },
  'v2-violet-400': {
    hex: '#A78BFA',
    alpha: 1,
  },
  'v2-violet-500': {
    hex: '#8B5CF6',
    alpha: 1,
  },
  'v2-violet-600': {
    hex: '#7C3AED',
    alpha: 1,
  },
  'v2-violet-700': {
    hex: '#6D28D9',
    alpha: 1,
  },
  'v2-violet-800': {
    hex: '#5B21B6',
    alpha: 1,
  },
  'v2-violet-900': {
    hex: '#4C1D95',
    alpha: 1,
  },
  'v2-violet-950': {
    hex: '#2E1065',
    alpha: 1,
  },
} as const satisfies Record<string, ColorValue>

export const colorSemantics = {
  canvas: {
    light: 'v2-white',
    dark: 'v2-neutral-900',
  },
  surface: {
    light: 'canvas',
    dark: 'canvas',
  },
  'surface-raised': {
    light: 'v2-neutral-100',
    dark: 'v2-neutral-800',
  },
  'surface-inset': {
    light: 'v2-neutral-50',
    dark: 'v2-neutral-850',
  },
  'text-default': {
    light: 'v2-neutral-900',
    dark: 'v2-neutral-100',
  },
  'text-muted': {
    light: 'v2-neutral-600',
    dark: 'v2-neutral-200',
  },
  'text-subtle': {
    light: 'v2-neutral-400',
    dark: 'v2-neutral-300',
  },
  'border-subtle': {
    light: 'v2-alpha-black-08',
    dark: 'v2-neutral-800',
  },
  'border-default': {
    light: 'v2-neutral-500',
    dark: 'v2-neutral-750',
  },
  'border-strong': {
    light: 'v2-neutral-600',
    dark: 'v2-neutral-300',
  },
  'action-primary': {
    light: 'v2-brand-600',
    dark: 'v2-brand-600',
  },
  'action-primary-hover': {
    light: 'v2-brand-700',
    dark: 'v2-brand-700',
  },
  'action-primary-pressed': {
    light: 'v2-brand-800',
    dark: 'v2-brand-800',
  },
  'action-primary-foreground': {
    light: 'v2-white',
    dark: 'v2-white',
  },
  'interactive-hover': {
    light: 'v2-alpha-black-04',
    dark: 'v2-alpha-white-06',
  },
  'interactive-pressed': {
    light: 'v2-alpha-black-08',
    dark: 'v2-alpha-white-10',
  },
  selected: {
    light: 'interactive-pressed',
    dark: 'interactive-pressed',
  },
  'selected-foreground': {
    light: 'text-default',
    dark: 'text-default',
  },
  link: {
    light: 'v2-brand-700',
    dark: 'v2-brand-400',
  },
  'link-hover': {
    light: 'v2-brand-800',
    dark: 'v2-brand-300',
  },
  'focus-ring': {
    light: 'v2-brand-200',
    dark: 'v2-brand-200',
  },
  'focus-border': {
    light: 'v2-brand-600',
    dark: 'v2-brand-300',
  },
  disabled: {
    light: 'v2-neutral-100',
    dark: 'v2-neutral-850',
  },
  'disabled-foreground': {
    light: 'v2-neutral-400',
    dark: 'v2-neutral-500',
  },
  'disabled-border': {
    light: 'v2-neutral-200',
    dark: 'v2-neutral-700',
  },
  info: {
    light: 'v2-violet-50',
    dark: 'v2-violet-950',
  },
  'info-foreground': {
    light: 'v2-violet-700',
    dark: 'v2-violet-300',
  },
  'info-border': {
    light: 'v2-violet-700',
    dark: 'v2-violet-400',
  },
  success: {
    light: 'v2-green-50',
    dark: 'v2-green-950',
  },
  'success-foreground': {
    light: 'v2-green-700',
    dark: 'v2-green-300',
  },
  'success-border': {
    light: 'v2-green-700',
    dark: 'v2-green-400',
  },
  warning: {
    light: 'v2-amber-50',
    dark: 'v2-amber-950',
  },
  'warning-foreground': {
    light: 'v2-amber-800',
    dark: 'v2-amber-300',
  },
  'warning-border': {
    light: 'v2-amber-700',
    dark: 'v2-amber-400',
  },
  danger: {
    light: 'v2-red-50',
    dark: 'v2-red-950',
  },
  'danger-foreground': {
    light: 'v2-red-700',
    dark: 'v2-red-300',
  },
  'danger-border': {
    light: 'v2-red-700',
    dark: 'v2-red-400',
  },
  destructive: {
    light: 'v2-red-700',
    dark: 'v2-red-700',
  },
  'destructive-hover': {
    light: 'v2-red-800',
    dark: 'v2-red-800',
  },
  'destructive-pressed': {
    light: 'v2-red-900',
    dark: 'v2-red-900',
  },
  'destructive-foreground': {
    light: 'v2-white',
    dark: 'v2-white',
  },
  overlay: {
    light: 'v2-alpha-black-40',
    dark: 'v2-alpha-black-64',
  },
  inverse: {
    light: 'v2-neutral-900',
    dark: 'v2-neutral-50',
  },
  'inverse-foreground': {
    light: 'v2-white',
    dark: 'v2-neutral-900',
  },
  'icon-default': {
    light: 'text-default',
    dark: 'text-default',
  },
  'icon-muted': {
    light: 'text-muted',
    dark: 'text-muted',
  },
  'icon-subtle': {
    light: 'text-subtle',
    dark: 'text-subtle',
  },
} as const

export type ColorPrimitiveName = keyof typeof colorPrimitives
export type ColorSemanticName = keyof typeof colorSemantics
export type ColorTokenName = ColorPrimitiveName | ColorSemanticName
export type ColorAliases = Record<string, Record<ColorMode, string>>

export const colorVariable = (name: string): string =>
  name.startsWith('v2-') ? `--${name}` : `--color-${name}`

export const colorToCss = ({ hex, alpha }: ColorValue): string => {
  if (alpha === 1) return hex
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16))

  return `rgb(${channels.join(' ')} / ${alpha})`
}

export const resolveColor = (
  name: string,
  mode: ColorMode,
  aliases: ColorAliases = colorSemantics,
  visited: string[] = [],
): ColorValue & { primitive: ColorPrimitiveName } => {
  if (Object.prototype.hasOwnProperty.call(colorPrimitives, name)) {
    const primitive = name as ColorPrimitiveName

    return { ...colorPrimitives[primitive], primitive }
  }
  if (visited.includes(name))
    throw new Error(`Color alias cycle: ${[...visited, name].join(' → ')}`)
  if (!Object.prototype.hasOwnProperty.call(aliases, name)) {
    throw new Error(`Unknown color token: ${name}`)
  }

  return resolveColor(aliases[name][mode], mode, aliases, [...visited, name])
}

export const generateColorCss = (): string => {
  const primitives = Object.entries(colorPrimitives).map(
    ([name, value]) => `  ${colorVariable(name)}: ${colorToCss(value)};`,
  )
  const modeBlock = (mode: ColorMode): string => {
    const declarations = Object.entries(colorSemantics).map(([name, aliases]) => {
      resolveColor(name, mode)

      return `  ${colorVariable(name)}: var(${colorVariable(aliases[mode])});`
    })
    const selector =
      mode === 'light' ? ":root,\n[data-color-theme='light']" : "[data-color-theme='dark']"

    return `${selector} {\n${declarations.join('\n')}\n}`
  }

  return `/* Generated by scripts/generate-v2-colors.mjs. */\n:root {\n${primitives.join('\n')}\n}\n\n${modeBlock('light')}\n\n${modeBlock('dark')}\n`
}
