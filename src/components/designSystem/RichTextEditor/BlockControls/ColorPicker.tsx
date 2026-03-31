import { Icon } from 'lago-design-system'

const COLORS = [
  { label: 'Red', value: '#fee2e2' },
  { label: 'Orange', value: '#ffedd5' },
  { label: 'Yellow', value: '#fef9c3' },
  { label: 'Green', value: '#dcfce7' },
  { label: 'Blue', value: '#dbeafe' },
  { label: 'Purple', value: '#f3e8ff' },
  { label: 'Pink', value: '#fce7f3' },
  { label: 'Grey', value: '#f3f4f6' },
]

const TEXT_COLORS = [
  { label: 'Red', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Yellow', value: '#ca8a04' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Grey', value: '#6b7280' },
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
