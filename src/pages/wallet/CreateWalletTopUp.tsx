import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useCallback, useMemo, useState } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Accordion } from '~/components/designSystem/Accordion'
import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentMethodsInvoiceSettings } from '~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings'
import { PaymentMethodsForm, ViewTypeEnum } from '~/components/paymentMethodsInvoiceSettings/types'
import {
  ADD_METADATA_DATA_TEST,
  CLOSE_CREATE_TOPUP_BUTTON_DATA_TEST,
  CREATE_WALLET_TOP_UP_FORM_TEST_ID,
  IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST,
  INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST,
  SUBMIT_WALLET_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { addToast } from '~/core/apolloClient'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_TAB_ROUTE, useNavigate, WALLET_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  METADATA_VALUE_MAX_LENGTH_DEFAULT,
  MetadataErrorsEnum,
} from '~/formValidation/metadataSchema'
import {
  CurrencyEnum,
  useCreateCustomerWalletTransactionMutation,
  useGetCustomerInfosForWalletFormQuery,
  useGetCustomerWalletListQuery,
  useGetInvoiceStatusQuery,
  useGetWalletForTopUpQuery,
  useVoidInvoiceMutation,
  WalletDetailsFragmentDoc,
  WalletStatusEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissionsInvoiceActions } from '~/hooks/usePermissionsInvoiceActions'
import TopUpTypeSelector, {
  WalletTransactionType,
} from '~/pages/wallet/components/TopUpTypeSelector'
import { topUpAmountError } from '~/pages/wallet/form'
import {
  getTopUpFormValidationSchema,
  topUpFormErrorLabels,
} from '~/pages/wallet/topUp/formInitialization/validationSchema'
import {
  mapFromApiToForm,
  WALLET_TOP_UP_DEFAULT_PRIORITY,
} from '~/pages/wallet/topUp/mappers/mapFromApiToForm'
import { mapFormToCreateInput } from '~/pages/wallet/topUp/mappers/mapFromFormToApi'
import { WalletDetailsTabsOptionsEnum } from '~/pages/wallet/WalletDetails'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

gql`
  query getWalletForTopUp($walletId: ID!) {
    wallet(id: $walletId) {
      id
      ...WalletForTopUp
    }
  }

  mutation createCustomerWalletTransaction($input: CreateCustomerWalletTransactionInput!) {
    createCustomerWalletTransaction(input: $input) {
      collection {
        id
        wallet {
          id
          ...WalletDetails
        }
      }
    }
  }

  fragment WalletForTopUp on Wallet {
    id
    name
    currency
    rateAmount
    invoiceRequiresSuccessfulPayment
    paidTopUpMinAmountCents
    paidTopUpMaxAmountCents
    priority
  }

  ${WalletDetailsFragmentDoc}
`

export const CREATE_ACTIVE_WALLET_TOP_UP_ID = 'active-wallet'

const CreateWalletTopUp = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { goBack } = useLocationHistory()
  const actions = usePermissionsInvoiceActions()

  const { organization: { defaultCurrency } = {} } = useOrganizationInfos()
  const { customerId = '', walletId = '', voidedInvoiceId = '' } = useParams()
  const centralizedDialog = useCentralizedDialog()

  const [transactionType, setTransactionType] = useState(WalletTransactionType.PrepaidCredits)

  const { data: voidedInvoice } = useGetInvoiceStatusQuery({
    variables: {
      id: voidedInvoiceId as string,
    },
    skip: !voidedInvoiceId,
  })

  const { data: customerWalletData } = useGetCustomerWalletListQuery({
    variables: { customerId, page: 0, limit: 20 },
    skip: walletId !== CREATE_ACTIVE_WALLET_TOP_UP_ID,
  })

  const list = customerWalletData?.wallets?.collection || []
  const activeWallet = list.find((wallet) => wallet.status === WalletStatusEnum.Active)

  const fetchedWalletId = walletId === CREATE_ACTIVE_WALLET_TOP_UP_ID ? activeWallet?.id : walletId

  const { data, loading } = useGetWalletForTopUpQuery({
    variables: {
      walletId: fetchedWalletId as string,
    },
    skip: !fetchedWalletId,
  })

  const wallet = data?.wallet

  const { data: customerData } = useGetCustomerInfosForWalletFormQuery({
    variables: { id: customerId },
    skip: !customerId,
  })

  const currency = wallet?.currency || defaultCurrency || CurrencyEnum.Usd

  const [createWallet] = useCreateCustomerWalletTransactionMutation({
    onCompleted(res) {
      if (res?.createCustomerWalletTransaction) {
        addToast({
          severity: 'success',
          translateKey: 'text_62e79671d23ae6ff149dea26',
        })
      }
    },
  })

  const [voidInvoice] = useVoidInvoiceMutation({})

  const paidTopUpMinAmountCents = wallet?.paidTopUpMinAmountCents
    ? deserializeAmount(wallet?.paidTopUpMinAmountCents, currency)?.toString()
    : undefined

  const paidTopUpMaxAmountCents = wallet?.paidTopUpMaxAmountCents
    ? deserializeAmount(wallet?.paidTopUpMaxAmountCents, currency)?.toString()
    : undefined

  // The bounds live on the target wallet, not in the form values — rebuild
  // the schema when the wallet resolves.
  const validationSchema = useMemo(
    () =>
      getTopUpFormValidationSchema({
        rateAmount: wallet?.rateAmount?.toString(),
        paidTopUpMinAmountCents,
        paidTopUpMaxAmountCents,
        currency: wallet?.currency,
      }),
    [wallet?.rateAmount, wallet?.currency, paidTopUpMinAmountCents, paidTopUpMaxAmountCents],
  )

  const form = useAppForm({
    // Recomputed inline on every render: TanStack re-seeds an untouched form
    // when defaults deep-change as the wallet query resolves.
    defaultValues: mapFromApiToForm({ wallet }),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      if (!wallet) return

      if (
        voidedInvoiceId &&
        voidedInvoice?.invoice?.id &&
        actions.canVoid(voidedInvoice?.invoice)
      ) {
        const res = await voidInvoice({
          variables: {
            input: {
              id: voidedInvoiceId,
              generateCreditNote: false,
            },
          },
        })

        if (!res?.data?.voidInvoice?.id) {
          return
        }
      }

      await createWallet({
        variables: {
          input: mapFormToCreateInput(value, { walletId: wallet.id }),
        },
        refetchQueries: ['getCustomerWalletList', 'getWalletTransactions'],
        notifyOnNetworkStatusChange: true,
      })

      navigateToCustomerWalletTab(wallet.id)
    },
  })

  const formValues = useStore(form.store, (state) => state.values)
  const isDirty = useStore(form.store, (state) => state.isDirty)
  // Validator-produced errors live DIRECTLY on errorMap.onDynamic, keyed by
  // field path (the `.fields` sub-shape only exists for manual setErrorMap).
  const dynamicFieldErrors = useStore(
    form.store,
    (state) => (state.errorMap as { onDynamic?: Record<string, unknown> })?.onDynamic ?? {},
  )

  const creditsRequiredError = (fieldName: 'paidCredits' | 'grantedCredits') =>
    (dynamicFieldErrors[fieldName] as { message?: string }[] | undefined)?.[0]?.message ===
    topUpFormErrorLabels.required

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  const paymentMethodsFormAdapter: PaymentMethodsForm<ViewTypeEnum.WalletTransactionTopUp> = {
    values: formValues,
    setFieldValue: (field, value) =>
      form.setFieldValue(field as Parameters<typeof form.setFieldValue>[0], value as never),
  }

  const updateTransactionType = (type: WalletTransactionType) => {
    setTransactionType(type)

    form.setFieldValue('grantedCredits', '')
    form.setFieldValue('paidCredits', '')
  }

  const navigateBack = useCallback(
    () =>
      goBack(
        generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
          customerId: customerId,
          tab: CustomerDetailsTabsOptions.wallet,
        }),
      ),
    [customerId, goBack],
  )

  const navigateToCustomerWalletTab = useCallback(
    (id?: string) => {
      if (id) {
        return navigate(
          generatePath(WALLET_DETAILS_ROUTE, {
            walletId: id,
            customerId: customerId,
            tab: WalletDetailsTabsOptionsEnum.overview,
          }),
        )
      }

      return navigate(
        generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
          customerId: customerId,
          tab: CustomerDetailsTabsOptions.wallet,
        }),
      )
    },
    [customerId, navigate],
  )

  const openDirtyAttributesWarning = useCallback(() => {
    centralizedDialog.open({
      title: translate('text_665deda4babaf700d603ea13'),
      description: translate('text_665dedd557dc3c00c62eb83d'),
      actionText: translate('text_645388d5bdbd7b00abffa033'),
      colorVariant: 'danger',
      onAction: () => navigateToCustomerWalletTab(wallet?.id),
    })
  }, [centralizedDialog, navigateToCustomerWalletTab, translate, wallet?.id])

  const onAbort = useCallback(() => {
    isDirty ? openDirtyAttributesWarning() : navigateBack()
  }, [isDirty, navigateBack, openDirtyAttributesWarning])

  const hasMinMax =
    (wallet?.paidTopUpMinAmountCents !== null && wallet?.paidTopUpMinAmountCents !== undefined) ||
    (wallet?.paidTopUpMaxAmountCents !== null && wallet?.paidTopUpMaxAmountCents !== undefined)

  const paidCreditsError = topUpAmountError({
    rateAmount: wallet?.rateAmount?.toString(),
    paidCredits: formValues.paidCredits?.toString(),
    paidTopUpMinAmountCents,
    paidTopUpMaxAmountCents,
    currency: wallet?.currency,
    skip: !!formValues.ignorePaidTopUpLimits,
    translate,
  })

  return (
    <CenteredPage.Wrapper>
      <form
        id="create-wallet-top-up"
        className="flex size-full min-h-full flex-col overflow-auto"
        onSubmit={handleSubmit}
      >
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate('text_62e161ceb87c201025388ada')}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            onClick={onAbort}
            data-test={CLOSE_CREATE_TOPUP_BUTTON_DATA_TEST}
          />
        </CenteredPage.Header>

        {loading && !wallet && (
          <CenteredPage.Container>
            <FormLoadingSkeleton id="create-wallet" />
          </CenteredPage.Container>
        )}

        {!loading && wallet && (
          <CenteredPage.Container>
            <CenteredPage.PageTitle
              title={translate('text_62e79671d23ae6ff149de924')}
              description={translate('text_1741103892833sy9e4va0pvb')}
            />

            <section className="flex flex-col gap-6 pb-12 shadow-b">
              <div className="flex flex-col gap-1">
                <Typography variant="subhead1">
                  {translate('text_6560809c38fb9de88d8a5090')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_17411038928332xzx1hb4wjx')}
                </Typography>
              </div>

              <WalletSettingsInfosDisplay
                infos={[
                  { label: translate('text_6419c64eace749372fc72b0f'), value: wallet.name },
                  {
                    label: translate('text_1755695821678c8hkgkxkh73'),
                    value: wallet.priority,
                  },
                  {
                    label: translate('text_1750411499858su5b7bbp5t9'),
                    value: translate('text_62da6ec24a8e24e44f812872', {
                      rateAmount: intlFormatNumber(wallet.rateAmount, {
                        currency,
                        minimumFractionDigits: getCurrencyPrecision(currency),
                        currencyDisplay: 'symbol',
                      }),
                    }),
                  },
                  {
                    label: translate('text_1759387047166vuoep9t72ny'),
                    value: intlFormatNumber(
                      deserializeAmount(wallet?.paidTopUpMinAmountCents, currency),
                      {
                        currency,
                      },
                    ),
                    hide: !wallet?.paidTopUpMinAmountCents,
                  },
                  {
                    label: translate('text_1759387047167hwbqm5hx7ye'),
                    value: intlFormatNumber(
                      deserializeAmount(wallet?.paidTopUpMaxAmountCents, currency),
                      {
                        currency,
                      },
                    ),
                    hide: !wallet?.paidTopUpMaxAmountCents,
                  },
                ]}
              />
            </section>

            <section
              data-test={CREATE_WALLET_TOP_UP_FORM_TEST_ID}
              className="flex flex-col gap-6 pb-12 shadow-b"
            >
              <div className="flex flex-col gap-1">
                <Typography variant="subhead1">
                  {translate('text_6657be42151661006d2f3b89')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_1741103892833plsi99wvuop')}
                </Typography>
              </div>
              <form.AppField name="name">
                {(field) => (
                  <field.TextInputField
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    label={translate('text_17580145853389xkffv9cs1d')}
                    placeholder={translate('text_17580145853390n3v83gao69')}
                    helperText={translate('text_1758014585339ly8tof8ub3r')}
                  />
                )}
              </form.AppField>
              <TopUpTypeSelector
                selectedType={transactionType}
                setSelectedType={updateTransactionType}
              />
              {transactionType === WalletTransactionType.PrepaidCredits && (
                <>
                  <form.AppField name="paidCredits">
                    {(field) => (
                      <field.AmountInputField
                        currency={wallet.currency}
                        beforeChangeFormatter={['positiveNumber']}
                        label={translate('text_62e79671d23ae6ff149de944')}
                        // the visible bounds label is computed live at component
                        // level; the at-least-one error surfaces after a submit
                        // attempt. false suppresses the raw schema markers.
                        errorOverride={
                          paidCreditsError?.label ||
                          (creditsRequiredError('paidCredits')
                            ? translate(topUpFormErrorLabels.required)
                            : false)
                        }
                        helperText={translate('text_62d18855b22699e5cf55f88b', {
                          paidCredits: intlFormatNumber(
                            isNaN(Number(formValues.paidCredits))
                              ? 0
                              : Number(formValues.paidCredits) * Number(wallet.rateAmount),

                            {
                              currencyDisplay: 'symbol',
                              currency: wallet.currency,
                            },
                          ),
                        })}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {translate('text_62e79671d23ae6ff149de94c')}
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </form.AppField>
                  {formValues.paidCredits && (
                    <>
                      {hasMinMax && (
                        <form.AppField name="ignorePaidTopUpLimits">
                          {(field) => (
                            <field.SwitchField
                              label={translate('text_17587075291282to3nmogezj')}
                              data-test={IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}
                            />
                          )}
                        </form.AppField>
                      )}

                      <form.AppField name="invoiceRequiresSuccessfulPayment">
                        {(field) => (
                          <field.SwitchField
                            label={translate('text_66a8aed1c3e07b277ec3990d')}
                            subLabel={translate('text_66a8aed1c3e07b277ec3990f')}
                            data-test={INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}
                          />
                        )}
                      </form.AppField>
                    </>
                  )}
                </>
              )}
              {transactionType === WalletTransactionType.FreeCredits && (
                <form.AppField name="grantedCredits">
                  {(field) => (
                    <field.AmountInputField
                      currency={wallet.currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_62d18855b22699e5cf55f88d')}
                      errorOverride={
                        creditsRequiredError('grantedCredits')
                          ? translate(topUpFormErrorLabels.required)
                          : false
                      }
                      helperText={translate('text_62d18855b22699e5cf55f893', {
                        grantedCredits: intlFormatNumber(
                          isNaN(Number(formValues.grantedCredits))
                            ? 0
                            : Number(formValues.grantedCredits) * Number(wallet.rateAmount),
                          {
                            currencyDisplay: 'symbol',
                            currency: wallet.currency,
                          },
                        ),
                      })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {translate('text_62e79671d23ae6ff149de95c')}
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                </form.AppField>
              )}
              <Alert type="info">
                <Typography color="textSecondary">
                  {translate('text_17411038928333ksu96fbmam', {
                    totalCreditCount:
                      Math.round(
                        Number(formValues.paidCredits || 0) * 100 +
                          Number(formValues.grantedCredits || 0) * 100,
                      ) / 100,
                  })}
                </Typography>
              </Alert>

              <form.AppField name="priority">
                {(field) => (
                  <field.TextInputField
                    type="number"
                    beforeChangeFormatter={['positiveNumber', 'int']}
                    label={translate('text_17708227222843peys0u3ywu')}
                    description={translate('text_17708227222846t71arrz7dn')}
                    placeholder={WALLET_TOP_UP_DEFAULT_PRIORITY}
                  />
                )}
              </form.AppField>
            </section>

            {(customerData?.customer?.externalId || customerData?.customer?.id) && (
              <section className="flex flex-col gap-6 pb-12 shadow-b">
                <div className="flex flex-col gap-1">
                  <Typography variant="subhead1">
                    {translate('text_17634566456760qoj7hs7jrh')}
                  </Typography>
                </div>
                <PaymentMethodsInvoiceSettings
                  customer={customerData?.customer}
                  form={paymentMethodsFormAdapter}
                  viewType={ViewTypeEnum.WalletTransactionTopUp}
                />
              </section>
            )}

            <section className="flex flex-col gap-6">
              <Accordion
                variant="borderless"
                summary={
                  <div className="flex flex-col gap-2">
                    <Typography variant="subhead1">
                      {translate('text_63fcc3218d35b9377840f59b')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1741706729331emiq4h111k8')}
                    </Typography>
                  </div>
                }
              >
                <div className="flex flex-col gap-6">
                  {(formValues.metadata ?? []).map((_metadata, index) => {
                    return (
                      <div
                        className="flex w-full flex-row items-center gap-3"
                        key={`metadata-item-${index}`}
                      >
                        <div className="basis-[200px]">
                          <form.AppField name={`metadata[${index}].key`}>
                            {(field) => {
                              const keyError = (
                                field.state.meta.errors as unknown as { message?: string }[]
                              ).find((error) =>
                                Object.keys(MetadataErrorsEnum).includes(error?.message ?? ''),
                              )?.message

                              return (
                                <Tooltip
                                  placement="top-end"
                                  title={
                                    (keyError === MetadataErrorsEnum.uniqueness &&
                                      translate('text_63fcc3218d35b9377840f5dd')) ||
                                    (keyError === MetadataErrorsEnum.maxLength &&
                                      translate('text_63fcc3218d35b9377840f5d9', { max: 20 }))
                                  }
                                  disableHoverListener={!keyError}
                                >
                                  <field.TextInputField
                                    label={translate('text_63fcc3218d35b9377840f5a3')}
                                    silentError={!keyError}
                                    placeholder={translate('text_63fcc3218d35b9377840f5a7')}
                                    displayErrorText={false}
                                  />
                                </Tooltip>
                              )
                            }}
                          </form.AppField>
                        </div>
                        <div className="grow">
                          <form.AppField name={`metadata[${index}].value`}>
                            {(field) => {
                              const valueError = (
                                field.state.meta.errors as unknown as { message?: string }[]
                              ).find((error) =>
                                Object.keys(MetadataErrorsEnum).includes(error?.message ?? ''),
                              )?.message

                              return (
                                <Tooltip
                                  placement="top-end"
                                  title={
                                    valueError === MetadataErrorsEnum.maxLength
                                      ? translate('text_63fcc3218d35b9377840f5e5', {
                                          max: METADATA_VALUE_MAX_LENGTH_DEFAULT,
                                        })
                                      : undefined
                                  }
                                  disableHoverListener={!valueError}
                                >
                                  <field.TextInputField
                                    label={translate('text_63fcc3218d35b9377840f5ab')}
                                    silentError={!valueError}
                                    placeholder={translate('text_63fcc3218d35b9377840f5af')}
                                    displayErrorText={false}
                                  />
                                </Tooltip>
                              )
                            }}
                          </form.AppField>
                        </div>
                        <Tooltip
                          className="flex items-center"
                          placement="top-end"
                          title={translate('text_63fcc3218d35b9377840f5e1')}
                        >
                          <Button
                            className="mt-7"
                            variant="quaternary"
                            size="medium"
                            icon="trash"
                            onClick={() => {
                              form.setFieldValue(
                                'metadata',
                                (form.state.values.metadata ?? []).filter((_, i) => i !== index),
                              )
                            }}
                          />
                        </Tooltip>
                      </div>
                    )
                  })}

                  <Button
                    className="self-start"
                    startIcon="plus"
                    variant="inline"
                    onClick={() =>
                      form.setFieldValue('metadata', [
                        ...(form.state.values.metadata ?? []),
                        { key: '', value: '' },
                      ])
                    }
                    data-test={ADD_METADATA_DATA_TEST}
                  >
                    {translate('text_63fcc3218d35b9377840f5bb')}
                  </Button>
                </div>
              </Accordion>
            </section>
          </CenteredPage.Container>
        )}

        <CenteredPage.StickyFooter>
          <Button variant="quaternary" onClick={onAbort}>
            {translate('text_62e79671d23ae6ff149de968')}
          </Button>
          <form.AppForm>
            <form.SubmitButton variant="primary" dataTest={SUBMIT_WALLET_DATA_TEST}>
              {translate('text_1741103892833yi7redcuhoc')}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  )
}

const WalletSettingsInfosDisplay = ({
  infos,
}: {
  infos?: {
    label: string
    value?: string | number | null
    hide?: boolean
  }[]
}) => {
  if (!infos?.length) return null

  return (
    <div className="flex flex-col gap-1">
      {infos
        .filter((info) => !info.hide)
        .map((info, infoIndex) => (
          <div key={infoIndex} className="flex min-h-10 items-center">
            <Typography variant="body" color="grey600" className="w-55 shrink-0">
              {info.label}
            </Typography>
            <Typography variant="body" color="grey700" className="grow">
              {info.value || '-'}
            </Typography>
          </div>
        ))}
    </div>
  )
}

export default CreateWalletTopUp
