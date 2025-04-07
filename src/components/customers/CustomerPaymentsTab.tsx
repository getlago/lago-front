import { FC } from 'react'
import { generatePath } from 'react-router-dom'

import { CustomerPaymentsList } from '~/components/customers/CustomerPaymentsList'
import { ButtonLink, Skeleton, Typography } from '~/components/designSystem'
import { CREATE_PAYMENT_ROUTE } from '~/core/router'
import { useGetPaymentListQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

interface CustomerPaymentsTabProps {
  externalCustomerId: string
}

export const CustomerPaymentsTab: FC<CustomerPaymentsTabProps> = ({ externalCustomerId }) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()

  const { data, loading, fetchMore } = useGetPaymentListQuery({
    variables: { externalCustomerId: externalCustomerId as string, limit: 20 },
    skip: !externalCustomerId,
  })

  const payments = data?.payments.collection || []

  const urlSearchParams = new URLSearchParams({ externalId: externalCustomerId })

  const canRecordPayment = hasPermissions(['paymentsCreate']) && isPremium

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {loading ? (
          <Skeleton variant="text" className="w-56" />
        ) : (
          <div className="flex flex-1 items-center gap-4">
            <Typography variant="subhead" color="grey700" className="flex-1">
              {translate('text_6672ebb8b1b50be550eccbed')}
            </Typography>
            {canRecordPayment && (
              <ButtonLink
                type="button"
                to={generatePath(`${CREATE_PAYMENT_ROUTE}?${urlSearchParams.toString()}`)}
                buttonProps={{
                  variant: 'quaternary',
                }}
              >
                {translate('text_1737471851634wpeojigr27w')}
              </ButtonLink>
            )}
          </div>
        )}
      </div>

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
