import { gql } from '@apollo/client'
import { Icon, IconName, Typography } from 'lago-design-system'

import { Status, StatusType } from '~/components/designSystem'
import { Chip } from '~/components/designSystem/Chip'
import { ActionItem, Table } from '~/components/designSystem/Table'
import { PaymentProviderChip } from '~/components/PaymentProviderChip'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  PaymentMethodsQuery,
  ProviderPaymentMethodsEnum,
  usePaymentMethodsQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

const OBFUSCATED_LAST4_PREFIX = '••••'

const PaymentProviderMethodTranslationsLookup: Record<ProviderPaymentMethodsEnum, IconName> = {
  [ProviderPaymentMethodsEnum.BacsDebit]: 'bank',
  [ProviderPaymentMethodsEnum.Card]: 'card',
  [ProviderPaymentMethodsEnum.Link]: 'bank',
  [ProviderPaymentMethodsEnum.SepaDebit]: 'bank',
  [ProviderPaymentMethodsEnum.UsBankAccount]: 'bank',
  [ProviderPaymentMethodsEnum.Boleto]: 'bank',
  [ProviderPaymentMethodsEnum.Crypto]: 'bank',
  [ProviderPaymentMethodsEnum.CustomerBalance]: 'bank',
}

gql`
  query PaymentMethods($externalCustomerId: ID!) {
    paymentMethods(externalCustomerId: $externalCustomerId) {
      collection {
        id
        isDefault
        paymentProviderCode
        paymentProviderCustomerId
        paymentProviderType
        details {
          brand
          expirationYear
          expirationMonth
          last4
          type
        }
      }
    }
  }
`

interface Props {
  externalCustomerId: string
}

type PaymentMethodItem = PaymentMethodsQuery['paymentMethods']['collection'][number]

const generateActionColumn = ({
  translate,
}: {
  translate: TranslateFunc
}): ActionItem<PaymentMethodItem>[] => {
  const setPaymentMethodAsDefaultAction: ActionItem<PaymentMethodItem> = {
    startIcon: 'star-filled',
    title: translate('text_1728574726495n9jdse2hnrf'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAction: (paymentMethod) => {
      addToast({
        severity: 'success',
        translateKey: translate('text_1762437511802do7br4qjc5p'),
      })
    },
  }

  const copyPaymentMethodAction: ActionItem<PaymentMethodItem> = {
    startIcon: 'duplicate',
    title: translate('text_1762437511802p8qb8qpfy9a'),
    onAction: (paymentMethod) => {
      copyToClipboard(paymentMethod.id)

      addToast({
        severity: 'info',
        translateKey: translate('text_176243751180284tefl8wgpw'),
      })
    },
  }

  const deletePaymentMethodAction: ActionItem<PaymentMethodItem> = {
    startIcon: 'trash',
    title: translate('text_1762437511802sg9jrl46lkb'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAction: (paymentMethod) => {
      addToast({
        severity: 'success',
        translateKey: translate('text_1762437511802g5ysxig14q5'),
      })
    },
  }

  return [setPaymentMethodAsDefaultAction, copyPaymentMethodAction, deletePaymentMethodAction]
}

export const PaymentMethodsList = ({ externalCustomerId }: Props) => {
  const { translate } = useInternationalization()

  const { data, error, loading } = usePaymentMethodsQuery({
    variables: { externalCustomerId },
  })

  const paymentMethods: PaymentMethodsQuery['paymentMethods']['collection'] =
    data?.paymentMethods?.collection || []

  return (
    <Table
      name="payment-methods-list"
      containerSize={0}
      rowSize={72}
      data={paymentMethods}
      placeholder={{
        emptyState: {
          title: translate('text_17624373282988xkhppid3at'),
          subtitle: translate('text_1762437344178ud4kecr8cz9'),
        },
      }}
      actionColumnTooltip={() => translate('text_634687079be251fdb438338f')}
      actionColumn={() => generateActionColumn({ translate })}
      columns={[
        {
          key: 'id',
          title: translate('text_1762437511802dynl0tx20xe'),
          maxSpace: true,
          content: (item) => {
            const paymentDetailType = (item.details?.type || '').toLowerCase()
            const iconName =
              paymentDetailType && paymentDetailType in PaymentProviderMethodTranslationsLookup
                ? PaymentProviderMethodTranslationsLookup[
                    paymentDetailType as ProviderPaymentMethodsEnum
                  ]
                : 'bank'

            return (
              <div className="flex items-center gap-3">
                {/* ICON */}
                <div className="flex size-10 items-center justify-center rounded-xl bg-grey-100">
                  <Icon name={iconName} color="black" />
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-1">
                    {/* PAYMENT METHOD DETAILS */}
                    {item.details?.type && (
                      <Typography variant="body" className="capitalize text-grey-700">
                        {item.details.type}
                      </Typography>
                    )}
                    {item.details?.type && item.details?.brand && (
                      <Typography variant="body" className="text-grey-700">
                        {' - '}
                      </Typography>
                    )}
                    {item.details?.brand && (
                      <Typography variant="body" className="capitalize text-grey-700">
                        {item.details.brand}
                      </Typography>
                    )}
                    {item.details?.last4 && (
                      <Typography variant="body" className="text-grey-700">
                        {OBFUSCATED_LAST4_PREFIX} {item.details.last4}
                      </Typography>
                    )}

                    {/* EXPIRATION DATE */}
                    {item.details?.expirationMonth && item.details?.expirationYear && (
                      <Chip
                        label={`${translate('text_1762437511802zhw5mx0iamd')} ${item.details.expirationMonth}/${item.details.expirationYear}`}
                        type="primary"
                        color="grey700"
                        variant="caption"
                        size="small"
                        className="ml-2"
                      />
                    )}

                    {/* DEFAULT BADGE */}
                    {item.isDefault && (
                      <Chip
                        label={translate('text_17440321235444hcxi31f8j6')}
                        type="secondary"
                        variant="caption"
                        color="info600"
                        size="small"
                        className="ml-2 bg-purple-100"
                      />
                    )}
                  </div>

                  {/* PSP INFO */}
                  <div className="flex items-center gap-1">
                    {item.paymentProviderType && (
                      <PaymentProviderChip
                        paymentProvider={item.paymentProviderType}
                        className="text-xs"
                        textVariant="caption"
                        textColor="grey500"
                      />
                    )}
                    {item.paymentProviderType && item.paymentProviderCode && (
                      <Typography variant="caption" className="text-grey-500">
                        {' • '}
                      </Typography>
                    )}
                    {item.paymentProviderCode && (
                      <Typography variant="caption" className="text-grey-500">
                        {item.paymentProviderCode}
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            )
          },
        },
        {
          key: 'id',
          title: translate('text_63ac86d797f728a87b2f9fa7'),
          content: () => (
            <Typography variant="caption" color="textSecondary">
              {/* <Status type={StatusType.success} label="active" /> */}
              <Status type={StatusType.disabled} label="Inactive" />
            </Typography>
          ),
        },
      ]}
      isLoading={loading}
      hasError={!!error}
    />
  )
}

PaymentMethodsList.displayName = 'PaymentMethodsList'
