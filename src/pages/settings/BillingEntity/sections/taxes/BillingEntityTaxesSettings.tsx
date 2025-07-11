import { gql } from '@apollo/client'
import { Avatar, Icon } from 'lago-design-system'
import { useRef } from 'react'
import { useParams } from 'react-router-dom'

import { Button, Table, Tooltip, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  BillingEntity,
  Tax,
  useGetBillingEntityQuery,
  useGetBillingEntityTaxesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { BillingEntityTab } from '~/pages/settings/BillingEntity/BillingEntity'
import BillingEntityHeader from '~/pages/settings/BillingEntity/components/BillingEntityHeader'
import {
  ApplyTaxDialog,
  ApplyTaxDialogRef,
} from '~/pages/settings/BillingEntity/sections/taxes/ApplyTaxDialog'
import {
  RemoveTaxDialog,
  RemoveTaxDialogRef,
} from '~/pages/settings/BillingEntity/sections/taxes/RemoveTaxDialog'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  query getBillingEntityTaxes($billingEntityId: ID!) {
    billingEntityTaxes(billingEntityId: $billingEntityId) {
      collection {
        id
        name
        code
        rate
      }
    }
  }
`

const BillingEntityTaxesSettings = () => {
  const { hasPermissions } = usePermissions()
  const { translate } = useInternationalization()

  const applyTaxDialogRef = useRef<ApplyTaxDialogRef>(null)
  const removeTaxDialogRef = useRef<RemoveTaxDialogRef>(null)

  const { billingEntityCode } = useParams()

  const { data: billingEntityData } = useGetBillingEntityQuery({
    variables: {
      code: billingEntityCode as string,
    },
    skip: !billingEntityCode,
  })

  const billingEntity = billingEntityData?.billingEntity

  const { data, error, loading } = useGetBillingEntityTaxesQuery({
    variables: {
      billingEntityId: billingEntity?.id as string,
    },
    skip: !billingEntity?.id,
  })

  const { collection } = data?.billingEntityTaxes || {}

  if (!!error && !loading) {
    return (
      <GenericPlaceholder
        title={translate('text_629728388c4d2300e2d380d5')}
        subtitle={translate('text_629728388c4d2300e2d380eb')}
        buttonTitle={translate('text_629728388c4d2300e2d38110')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <BillingEntityHeader
        billingEntity={billingEntity as BillingEntity}
        tab={BillingEntityTab.TAXES}
        loading={loading}
      />

      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_1743241419870gwqt1b54uuq')}</Typography>
          <Typography>{translate('text_17432414198709y2y2ua9zxt')}</Typography>
        </SettingsPageHeaderContainer>

        {!!loading && <SettingsListItemLoadingSkeleton count={2} />}

        {!loading && (
          <>
            <SettingsListWrapper>
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_17432414198707qivkiz8cth')}
                  sublabel={translate('text_17432414198712tgdfmlnxb0')}
                  action={
                    <>
                      {hasPermissions(['billingEntitiesTaxesUpdate']) && (
                        <Button
                          variant="inline"
                          disabled={loading}
                          onClick={() => {
                            if (billingEntity?.id) {
                              applyTaxDialogRef?.current?.openDialog(billingEntity.id)
                            }
                          }}
                          data-test="apply-tax-button"
                        >
                          {translate('text_1743241419871j03yn6wurna')}
                        </Button>
                      )}
                    </>
                  }
                />

                {!collection?.length && (
                  <Typography className="text-grey-500">
                    {translate('text_1743241419871563o61p323b')}
                  </Typography>
                )}

                {!!collection?.length && (
                  <Table
                    name="billing-entity-taxes"
                    containerSize={{ default: 0 }}
                    rowSize={72}
                    isLoading={loading}
                    data={collection}
                    columns={[
                      {
                        key: 'name',
                        title: translate('text_17280312664187sb64qzmyhy'),
                        maxSpace: true,
                        content: ({ name, code }) => (
                          <div className="flex flex-1 items-center gap-3" data-test={code}>
                            <Avatar size="big" variant="connector">
                              <Icon size="medium" name="percentage" color="dark" />
                            </Avatar>
                            <div>
                              <Typography color="textSecondary" variant="bodyHl" noWrap>
                                {name}
                              </Typography>
                              <Typography variant="caption" noWrap>
                                {code}
                              </Typography>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: 'rate',
                        textAlign: 'right',
                        title: translate('text_64de472463e2da6b31737de0'),
                        content: ({ rate }) => (
                          <Typography variant="body" color="grey700">
                            {intlFormatNumber((rate || 0) / 100, {
                              style: 'percent',
                            })}
                          </Typography>
                        ),
                      },
                    ]}
                    actionColumn={(tax) => {
                      if (!hasPermissions(['billingEntitiesTaxesUpdate'])) return null

                      return (
                        <Tooltip placement="top" title={translate('text_1743600025133r2npxfa25sy')}>
                          <Button
                            icon="trash"
                            variant="quaternary"
                            onClick={() => {
                              if (billingEntity?.id && tax) {
                                removeTaxDialogRef?.current?.openDialog(
                                  billingEntity?.id,
                                  tax as Tax,
                                )
                              }
                            }}
                          />
                        </Tooltip>
                      )
                    }}
                  />
                )}
              </SettingsListItem>
            </SettingsListWrapper>
          </>
        )}
      </SettingsPaddedContainer>

      <ApplyTaxDialog ref={applyTaxDialogRef} />
      <RemoveTaxDialog ref={removeTaxDialogRef} />
    </>
  )
}

export default BillingEntityTaxesSettings
