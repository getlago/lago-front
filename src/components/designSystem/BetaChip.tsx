import { Chip, ChipSize } from './Chip'

type BetaChipProps = {
  size?: ChipSize
}

export const BetaChip = ({ size = 'small' }: BetaChipProps) => {
  return <Chip type="beta" label="Beta" size={size} />
}
