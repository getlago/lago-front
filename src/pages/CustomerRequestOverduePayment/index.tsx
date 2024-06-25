import { FC } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, Typography } from '~/components/designSystem'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PageHeader } from '~/styles'

interface CustomerRequestOverduePaymentProps {}

const CustomerRequestOverduePayment: FC<CustomerRequestOverduePaymentProps> = () => {
  const { translate } = useInternationalization()
  const { customerId } = useParams()
  const navigate = useNavigate()

  return (
    <>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(
            'Request a payment of {{amount}} for {{count}} invoice|Request a payment of {{amount}} for {{count}} invoices',
          )}
        </Typography>

        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
          }
        />
      </PageHeader>
      Test
    </>
  )
}

export default CustomerRequestOverduePayment
