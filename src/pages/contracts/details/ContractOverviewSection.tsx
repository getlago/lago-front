import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router'

import { BillingEntityLabel } from '~/components/billingEntity/BillingEntityLabel'
import { Status } from '~/components/designSystem/Status'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { SubscriptionPaymentMethodDetails } from '~/components/subscriptions/SubscriptionPaymentMethodDetails'
import { TimezoneDate } from '~/components/TimezoneDate'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import { CatalogPlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CATALOG_PLAN_DETAILS_ROUTE, CUSTOMER_DETAILS_ROUTE, Link } from '~/core/router'
import { intlFormatDateTime } from '~/core/timezone'
import {
  ContractStatusEnum,
  LagoApiError,
  TimezoneEnum,
  useGetContractForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ContractForContractDetailsOverview on Contract {
    id
    externalId
    name
    status
    startedAt
    endedAt
    billingAnchorDate
    canceledAt
    terminatedAt
    billingEntityId
    consolidateInvoice
    purchaseOrderNumber
    paymentMethodType
    paymentMethod {
      id
    }
    customer {
      id
      externalId
      displayName
      applicableTimezone
      billingEntity {
        id
        name
        code
      }
    }
    plan {
      id
      name
    }
  }

  query getContractForDetailsOverview($id: ID!) {
    contract(id: $id) {
      ...ContractForContractDetailsOverview
    }
  }
`

export const ContractOverviewSection = (): JSX.Element => {
  const { id = '' } = useParams()
  const { translate } = useInternationalization()
  const { data, loading } = useGetContractForDetailsOverviewQuery({
    variables: { id },
    skip: !id,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
  const contract = data?.contract

  if (!contract && loading) {
    return <DetailsPage.Skeleton />
  }

  const customerTimezone = contract?.customer.applicableTimezone
  const renderDate = (date?: string | null) =>
    date ? <TimezoneDate date={date} customerTimezone={customerTimezone} /> : '-'

  const plan = contract?.plan
  const planValue = plan ? (
    <Link
      to={generatePath(CATALOG_PLAN_DETAILS_ROUTE, {
        catalogPlanId: plan.id,
        tab: CatalogPlanDetailsTabsOptionsEnum.overview,
      })}
    >
      {plan.name}
    </Link>
  ) : (
    '-'
  )

  const selectedPaymentMethod = contract
    ? {
        paymentMethodId: contract.paymentMethod?.id,
        paymentMethodType: contract.paymentMethodType,
      }
    : undefined

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6 pb-12 shadow-b">
        <SectionHeader
          title={translate('text_1789552637141n7ijvldeali')}
          description={translate('text_1789552637141hh9khhh71bm')}
          contentClassName="gap-2"
        />
        <DetailsPage.InfoGrid
          grid={[
            {
              label: translate('text_1743611497157teaa1zu8l24'),
              value: (
                <BillingEntityLabel
                  ownId={contract?.billingEntityId}
                  customerEntity={contract?.customer.billingEntity}
                />
              ),
            },
            {
              label: translate('text_65201c5a175a4b0238abf29a'),
              value: contract?.customer ? (
                <Link
                  to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                    customerId: contract.customer.id,
                  })}
                >
                  {contract.customer.displayName}
                </Link>
              ) : (
                '-'
              ),
            },
            {
              label: translate('text_1789030049530nkyhqgwxpkt'),
              value: planValue,
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-6 pb-12 shadow-b">
        <SectionHeader
          title={translate('text_1789552637141f58gbx5dew3')}
          description={translate('text_1789724492480cacpzfyknb5')}
          contentClassName="gap-2"
        />

        <div className="flex flex-col gap-4">
          <DetailsPage.InfoGridItem
            label={translate('text_62d7f6178ec94cd09370e5fb')}
            value={<Status {...contractStatusMapping(contract?.status)} />}
          />
          <DetailsPage.InfoGridItem
            label={translate('text_6250304370f0f700a8fdc283')}
            value={
              contract?.externalId ? (
                <TypographyWithCopy compact variant="body" color="grey700">
                  {contract.externalId}
                </TypographyWithCopy>
              ) : (
                '-'
              )
            }
          />
          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_1789552637141273ewsjqx7j'),
                value: contract?.name || '-',
              },
              {
                label: translate('text_17822197712865r9iwe3lgel'),
                value: contract?.purchaseOrderNumber || '-',
              },
            ]}
          />
          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_65201c5a175a4b0238abf29e'),
                value: renderDate(contract?.startedAt),
              },
              {
                label: translate('text_65201c5a175a4b0238abf2a0'),
                value: renderDate(contract?.endedAt),
              },
            ]}
          />
          <DetailsPage.InfoGridItem
            label={translate('text_1781859135627z59hpfpa8pt')}
            value={
              contract?.billingAnchorDate
                ? intlFormatDateTime(contract.billingAnchorDate, {
                    timezone: TimezoneEnum.TzUtc,
                  }).date
                : '-'
            }
          />
          {contract?.status === ContractStatusEnum.Canceled && (
            <DetailsPage.InfoGridItem
              label={translate('text_1789723302114ceqx5k6efdq')}
              value={renderDate(contract.canceledAt)}
            />
          )}
          {contract?.status === ContractStatusEnum.Terminated && (
            <DetailsPage.InfoGridItem
              label={translate('text_17897233021144v1deu5m2s7')}
              value={renderDate(contract.terminatedAt)}
            />
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 pb-12 shadow-b">
        <SectionHeader
          title={translate('text_17423672025282dl7iozy1ru')}
          description={translate('text_1789724492480lc4k8wns9zw')}
          contentClassName="gap-2"
        />
        <DetailsPage.InfoGridItem
          label={translate('text_177874535109128tmqdq682k')}
          value={translate(
            contract?.consolidateInvoice
              ? 'text_1778745351091h7z5baw0ta6'
              : 'text_1778745351091fxaqr5dwok8',
          )}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeader
          title={translate('text_1782825858647rr5zp42t63m')}
          description={translate('text_17897244924802iix6cccw2v')}
          contentClassName="gap-2"
        />
        <SubscriptionPaymentMethodDetails
          selectedPaymentMethod={selectedPaymentMethod}
          externalCustomerId={contract?.customer.externalId}
        />
      </section>
    </div>
  )
}
