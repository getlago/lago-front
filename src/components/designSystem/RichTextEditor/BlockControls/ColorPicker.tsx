import tailwindConfig from 'lago-configs/tailwind'
import { Icon } from 'lago-design-system'
import resolveConfig from 'tailwindcss/resolveConfig'

const fullConfig = resolveConfig(tailwindConfig)
const themeColors = fullConfig.theme.colors

const getColor = (name: string, shade: number): string => {
  const color = themeColors[name as keyof typeof themeColors]

  if (typeof color === 'object' && color !== null && shade in color) {
    return (color as Record<number, string>)[shade]
  }

  return '#000000'
}

// Background colors — light shades from the Tailwind theme
const COLORS = [
  { label: 'Red', value: getColor('red', 100) },
  { label: 'Yellow', value: getColor('yellow', 100) },
  { label: 'Green', value: getColor('green', 100) },
  { label: 'Blue', value: getColor('blue', 100) },
  { label: 'Purple', value: getColor('purple', 100) },
  { label: 'Grey', value: getColor('grey', 100) },
]

// Text colors — dark shades from the Tailwind theme
const TEXT_COLORS = [
  { label: 'Red', value: getColor('red', 600) },
  { label: 'Yellow', value: getColor('yellow', 600) },
  { label: 'Green', value: getColor('green', 600) },
  { label: 'Blue', value: getColor('blue', 600) },
  { label: 'Purple', value: getColor('purple', 600) },
  { label: 'Grey', value: getColor('grey', 600) },
]

type ColorPickerProps = {
  variant: 'background' | 'text'
  activeColor: string | null
  onSelect: (color: string | null) => void
}

const ColorPicker = ({ variant, activeColor, onSelect }: ColorPickerProps) => {
  const colors = variant === 'background' ? COLORS : TEXT_COLORS

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="grid grid-cols-4 gap-1">
        <button
          className="flex size-7 items-center justify-center rounded border border-grey-300 hover:border-grey-500"
          title="Clear"
          aria-label="Clear color"
          onClick={() => onSelect(null)}
        >
          <Icon name="close-circle-unfilled" size="small" />
        </button>
        {colors.map((color) => (
          <button
            key={color.value}
            className="relative size-7 rounded border border-grey-300 hover:border-grey-500"
            style={
              variant === 'background'
                ? { backgroundColor: color.value }
                : { backgroundColor: 'white' }
            }
            title={color.label}
            aria-label={`${color.label} ${variant === 'background' ? 'background' : 'text'} color`}
            onClick={() => onSelect(color.value)}
          >
            {variant === 'text' && (
              <span className="text-sm font-bold" style={{ color: color.value }}>
                A
              </span>
            )}
            {activeColor === color.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="checkmark" size="small" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ColorPicker
