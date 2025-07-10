import { FC } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { CustomerPaymentsList } from '~/components/customers/CustomerPaymentsList'
import { Skeleton, Typography } from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import { CREATE_PAYMENT_ROUTE } from '~/core/router'
import { useGetPaymentsListQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

interface CustomerPaymentsTabProps {
  externalCustomerId: string
}

export const CustomerPaymentsTab: FC<CustomerPaymentsTabProps> = ({ externalCustomerId }) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()

  const { data, loading, fetchMore } = useGetPaymentsListQuery({
    variables: { externalCustomerId: externalCustomerId as string, limit: 20 },
    skip: !externalCustomerId,
  })

  const payments = data?.payments.collection || []

  const urlSearchParams = new URLSearchParams({ externalId: externalCustomerId })

  const canRecordPayment = hasPermissions(['paymentsCreate']) && isPremium

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <Skeleton variant="text" className="w-56" />
      ) : (
        <PageSectionTitle
          title={translate('text_6672ebb8b1b50be550eccbed')}
          action={
            canRecordPayment
              ? {
                  title: translate('text_1737471851634wpeojigr27w'),
                  onClick: () => {
                    navigate(generatePath(`${CREATE_PAYMENT_ROUTE}?${urlSearchParams.toString()}`))
                  },
                }
              : undefined
          }
        />
      )}

      {!loading && !payments.length && (
        <Typography variant="body" color="grey500">
          {translate('text_17380560401786gmefzvw1rl')}
        </Typography>
      )}

      {payments.length > 0 && (
        <CustomerPaymentsList
          payments={payments}
          loading={loading}
          fetchMore={fetchMore}
          metadata={data?.payments?.metadata}
        />
      )}
    </div>
  )
}
