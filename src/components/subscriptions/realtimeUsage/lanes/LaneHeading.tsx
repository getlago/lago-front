import { Typography } from '~/components/designSystem/Typography'
import { tw } from '~/styles/utils'

type LaneHeadingProps = {
  children: string
  className?: string
}

export const LaneHeading = ({ children, className }: LaneHeadingProps): JSX.Element => (
  <Typography
    variant="note"
    color="grey500"
    className={tw('uppercase tracking-wider', className)}
    noWrap
  >
    {children}
  </Typography>
)
