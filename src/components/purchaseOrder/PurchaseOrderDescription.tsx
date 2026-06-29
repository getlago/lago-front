import { Typography, TypographyProps } from '~/components/designSystem/Typography'

import { usePurchaseOrderContext } from './PurchaseOrderContext'

export const PurchaseOrderDescription = ({ children, ...props }: TypographyProps) => {
  const { description } = usePurchaseOrderContext()

  if (!children && !description) {
    return null
  }

  return (
    <Typography variant="caption" color="grey600" {...props}>
      {children || description}
    </Typography>
  )
}
