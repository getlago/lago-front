import { Typography, TypographyProps } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PURCHASE_ORDER_TRANSLATIONS } from './constants'

export const PurchaseOrderTitle = ({ children, ...props }: TypographyProps) => {
  const { translate } = useInternationalization()

  return (
    <Typography variant="captionHl" color="grey700" {...props}>
      {children || translate(PURCHASE_ORDER_TRANSLATIONS.title)}
    </Typography>
  )
}
