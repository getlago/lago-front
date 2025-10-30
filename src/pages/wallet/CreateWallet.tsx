import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, Typography } from '~/components/designSystem'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import {
  deserializeAmount,
  getCurrencyPrecision,
  serializeAmount,
} from '~/core/serializers/serializeAmount'
import {
  CreateCustomerWalletInput,
  CreateRecurringTransactionRuleInput,
  CurrencyEnum,
  GetWalletInfosForWalletFormQuery,
  LagoApiError,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  UpdateCustomerWalletInput,
  UpdateRecurringTransactionRuleInput,
  useCreateCustomerWalletMutation,
  useGetCustomerInfosForWalletFormQuery,
  useGetWalletInfosForWalletFormQuery,
  useUpdateCustomerWalletMutation,
  WalletForScopeSectionFragmentDoc,
  WalletForUpdateFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { ScopeSection } from '~/pages/wallet/components/ScopeSection'
import { SettingsSection } from '~/pages/wallet/components/SettingsSection'
import { TopUpSection } from '~/pages/wallet/components/TopUpSection'
import { walletFormSchema } from '~/pages/wallet/form'
import { TWalletDataForm } from '~/pages/wallet/types'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

const WALLET_DEFAULT_PRIORITY = 50

gql`
  fragment WalletForUpdate on Wallet {
    id
    expirationAt
    name
    rateAmount
    invoiceRequiresSuccessfulPayment
    paidTopUpMinAmountCents
    paidTopUpMaxAmountCents
    priority
    appliesTo {
      feeTypes
      billableMetrics {
        id
      }
    }
    recurringTransactionRules {
      expirationAt
      grantedCredits
      interval
      invoiceRequiresSuccessfulPayment
      lagoId
      method
      paidCredits
      startedAt
      targetOngoingBalance
      thresholdCredits
      transactionName
      trigger
      ignorePaidTopUpLimits
      transactionMetadata {
        key
        value
      }
    }

    ...WalletForScopeSection
  }

  query getCustomerInfosForWalletForm($id: ID!) {
    customer(id: $id) {
      id
      currency
      timezone
    }
  }

  query getWalletInfosForWalletForm($id: ID!) {
    wallet(id: $id) {
      id
      ...WalletForUpdate
    }
  }

  mutation createCustomerWallet($input: CreateCustomerWalletInput!) {
    createCustomerWallet(input: $input) {
      id
      customer {
        id
        hasActiveWallet
      }
    }
  }

  mutation updateCustomerWallet($input: UpdateCustomerWalletInput!) {
    updateCustomerWallet(input: $input) {
      ...WalletForUpdate
    }
  }

  ${WalletForUpdateFragmentDoc}
  ${WalletForScopeSectionFragmentDoc}
`

function hasWalletRecurringTopUpEnabled(
  wallet: GetWalletInfosForWalletFormQuery['wallet'],
): boolean {
  return !!wallet?.recurringTransactionRules?.[0]?.trigger
}

const CreateWallet = () => {
  const navigate = useNavigate()

  const { customerId = '', walletId = '' } = useParams()
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()

  const warningDialogRef = useRef<WarningDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const formType = useMemo(() => {
    if (!!walletId) return FORM_TYPE_ENUM.edition

    return FORM_TYPE_ENUM.creation
  }, [walletId])

  const { data: customerData, loading: customerLoading } = useGetCustomerInfosForWalletFormQuery({
    variables: { id: customerId },
    skip: !customerId,
  })
  const { data: walletData, loading: walletLoading } = useGetWalletInfosForWalletFormQuery({
    variables: { id: walletId },
    skip: !walletId,
  })
  const isLoading = customerLoading || walletLoading
  const wallet = walletData?.wallet

  const [showExpirationDate, setShowExpirationDate] = useState(!!wallet?.expirationAt)
  const [isRecurringTopUpEnabled, setIsRecurringTopUpEnabled] = useState(
    hasWalletRecurringTopUpEnabled(wallet),
  )
  const [showMinTopUp, setShowMinTopUp] = useState(!!wallet?.paidTopUpMinAmountCents)
  const [showMaxTopUp, setShowMaxTopUp] = useState(!!wallet?.paidTopUpMaxAmountCents)

  useEffect(() => {
    if (wallet) {
      setIsRecurringTopUpEnabled(hasWalletRecurringTopUpEnabled(wallet))
      setShowMinTopUp(!!wallet?.paidTopUpMinAmountCents)
      setShowMaxTopUp(!!wallet?.paidTopUpMaxAmountCents)
    }

    if (!!wallet?.expirationAt) {
      setShowExpirationDate(true)
    }
  }, [wallet])

  const currency =
    customerData?.customer?.currency || organization?.defaultCurrency || CurrencyEnum.Usd

  const navigateToCustomerWalletTab = useCallback(
    () =>
      navigate(
        generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
          customerId: customerId,
          tab: CustomerDetailsTabsOptions.wallet,
        }),
      ),
    [customerId, navigate],
  )

  const [createWallet] = useCreateCustomerWalletMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    onCompleted(res) {
      if (res?.createCustomerWallet) {
        addToast({
          severity: 'success',
          translateKey: 'text_656080d120cad1fe708621fe',
        })
      }
    },
  })

  const [updateWallet] = useUpdateCustomerWalletMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    onCompleted(res) {
      if (res?.updateCustomerWallet) {
        addToast({
          severity: 'success',
          translateKey: 'text_6560809d38fb9de88d8a549c',
        })
      }
    },
  })

  const formikProps = useFormik<TWalletDataForm>({
    initialValues: {
      currency,
      expirationAt: wallet?.expirationAt || undefined,
      grantedCredits: '',
      name: wallet?.name || '',
      transactionName: undefined,
      appliesTo: wallet?.appliesTo || {
        feeTypes: [],
        billableMetrics: [],
      },
      paidCredits: '',
      rateAmount: intlFormatNumber(wallet?.rateAmount ?? 1, {
        currency,
        style: 'decimal',
        minimumFractionDigits: getCurrencyPrecision(currency),
      }),
      recurringTransactionRules: wallet?.recurringTransactionRules || undefined,
      invoiceRequiresSuccessfulPayment: wallet?.invoiceRequiresSuccessfulPayment ?? false,
      paidTopUpMinAmountCents: wallet?.paidTopUpMinAmountCents
        ? deserializeAmount(wallet.paidTopUpMinAmountCents, currency)
        : undefined,
      paidTopUpMaxAmountCents: wallet?.paidTopUpMaxAmountCents
        ? deserializeAmount(wallet.paidTopUpMaxAmountCents, currency)
        : undefined,
      ignorePaidTopUpLimitsOnCreation: false,
      priority: wallet?.priority || WALLET_DEFAULT_PRIORITY,
    },
    validationSchema: walletFormSchema(),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async ({
      grantedCredits,
      paidCredits,
      rateAmount,
      currency: valuesCurrency,
      recurringTransactionRules,
      appliesTo,
      priority,
      ...values
    }) => {
      const recurringTransactionRulesFormatted =
        recurringTransactionRules && recurringTransactionRules?.length > 0
          ? recurringTransactionRules.map(
              (rule: CreateRecurringTransactionRuleInput | UpdateRecurringTransactionRuleInput) => {
                const {
                  interval,
                  trigger,
                  thresholdCredits,
                  method,
                  targetOngoingBalance,
                  startedAt,
                  invoiceRequiresSuccessfulPayment,
                  paidCredits: rulePaidCredit,
                  grantedCredits: ruleGrantedCredit,
                  expirationAt,
                  ignorePaidTopUpLimits,
                  ...rest
                } = rule

                let targetedBalance: string | null = null

                if (
                  method === RecurringTransactionMethodEnum.Target &&
                  targetOngoingBalance === ''
                ) {
                  targetedBalance = '0'
                } else if (method === RecurringTransactionMethodEnum.Target) {
                  targetedBalance = String(targetOngoingBalance)
                }

                return {
                  ...rest,
                  lagoId:
                    'lagoId' in rule && formType === FORM_TYPE_ENUM.edition
                      ? rule.lagoId
                      : undefined,
                  method: method as RecurringTransactionMethodEnum,
                  trigger: trigger as RecurringTransactionTriggerEnum,
                  interval: trigger === RecurringTransactionTriggerEnum.Interval ? interval : null,
                  startedAt:
                    trigger === RecurringTransactionTriggerEnum.Interval
                      ? (startedAt ?? DateTime.now().toISO())
                      : null,
                  thresholdCredits:
                    trigger === RecurringTransactionTriggerEnum.Threshold ? thresholdCredits : null,
                  paidCredits: rulePaidCredit === '' ? '0' : String(rulePaidCredit),
                  grantedCredits: ruleGrantedCredit === '' ? '0' : String(ruleGrantedCredit),
                  targetOngoingBalance: targetedBalance,
                  invoiceRequiresSuccessfulPayment,
                  ignorePaidTopUpLimits,
                  expirationAt: expirationAt === '' ? null : expirationAt,
                }
              },
            )
          : []

      const formattedAppliesTo = {
        feeTypes: appliesTo?.feeTypes || [],
        billableMetricIds: appliesTo?.billableMetrics?.map((bm) => bm.id) || [],
      }

      if (formType === FORM_TYPE_ENUM.edition) {
        const input = {
          ...values,
          recurringTransactionRules: recurringTransactionRulesFormatted,
          id: walletId,
          appliesTo: formattedAppliesTo,
          ...(values.paidTopUpMinAmountCents
            ? {
                paidTopUpMinAmountCents: serializeAmount(
                  values.paidTopUpMinAmountCents,
                  valuesCurrency,
                ),
              }
            : {
                paidTopUpMinAmountCents: null,
              }),
          ...(values.paidTopUpMaxAmountCents
            ? {
                paidTopUpMaxAmountCents: serializeAmount(
                  values.paidTopUpMaxAmountCents,
                  valuesCurrency,
                ),
              }
            : {
                paidTopUpMaxAmountCents: null,
              }),
          priority: priority || WALLET_DEFAULT_PRIORITY,
        } satisfies UpdateCustomerWalletInput

        // eslint-disable-next-line
        const { ignorePaidTopUpLimitsOnCreation, ...ignoreMutationInput } = input

        const { errors } = await updateWallet({ variables: { input: ignoreMutationInput } })

        if (!!errors?.length) return
      } else {
        const input = {
          ...values,
          customerId,
          currency: valuesCurrency,
          rateAmount: String(rateAmount),
          grantedCredits: grantedCredits === '' ? '0' : String(grantedCredits),
          paidCredits: paidCredits === '' ? '0' : String(paidCredits),
          recurringTransactionRules: recurringTransactionRulesFormatted,
          appliesTo: formattedAppliesTo,
          ...(values.paidTopUpMinAmountCents
            ? {
                paidTopUpMinAmountCents: serializeAmount(
                  values.paidTopUpMinAmountCents,
                  valuesCurrency,
                ),
              }
            : {}),
          ...(values.paidTopUpMaxAmountCents
            ? {
                paidTopUpMaxAmountCents: serializeAmount(
                  values.paidTopUpMaxAmountCents,
                  valuesCurrency,
                ),
              }
            : {}),
          priority: priority || WALLET_DEFAULT_PRIORITY,
        } satisfies CreateCustomerWalletInput

        const { errors } = await createWallet({ variables: { input } })

        if (!!errors?.length) return
      }

      navigateToCustomerWalletTab()
    },
  })

  const onAbort = useCallback(() => {
    formikProps.dirty ? warningDialogRef.current?.openDialog() : navigateToCustomerWalletTab()
  }, [formikProps.dirty, navigateToCustomerWalletTab])

  return (
    <>
      <CenteredPage.Wrapper>
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate(
              formType === FORM_TYPE_ENUM.edition
                ? 'text_62d9430e8b9fe36851cddd09'
                : 'text_6560809c38fb9de88d8a505e',
            )}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            onClick={onAbort}
            data-test="close-create-wallet-button"
          />
        </CenteredPage.Header>

        {isLoading && !wallet && (
          <CenteredPage.Container>
            <FormLoadingSkeleton id="create-wallet" />
          </CenteredPage.Container>
        )}

        {!isLoading && (
          <CenteredPage.Container>
            <CenteredPage.PageTitle
              title={translate(
                formType === FORM_TYPE_ENUM.edition
                  ? 'text_62d9430e8b9fe36851cddd09'
                  : 'text_6560809c38fb9de88d8a505e',
              )}
              description={translate('text_1748422458559917eelhobh5')}
            />

            <SettingsSection
              formikProps={formikProps}
              formType={formType}
              customerData={customerData}
              showExpirationDate={showExpirationDate}
              setShowExpirationDate={setShowExpirationDate}
              showMinTopUp={showMinTopUp}
              setShowMinTopUp={setShowMinTopUp}
              showMaxTopUp={showMaxTopUp}
              setShowMaxTopUp={setShowMaxTopUp}
            />

            <ScopeSection formikProps={formikProps} />

            <TopUpSection
              formikProps={formikProps}
              formType={formType}
              customerData={customerData}
              isRecurringTopUpEnabled={isRecurringTopUpEnabled}
              setIsRecurringTopUpEnabled={setIsRecurringTopUpEnabled}
              premiumWarningDialogRef={premiumWarningDialogRef}
            />
          </CenteredPage.Container>
        )}

        <CenteredPage.StickyFooter>
          <Button size="large" variant="quaternary" onClick={onAbort}>
            {translate('text_62e79671d23ae6ff149de968')}
          </Button>
          <Button
            size="large"
            variant="primary"
            disabled={!formikProps.isValid}
            onClick={formikProps.submitForm}
            data-test="submit-wallet"
          >
            {translate(
              formType === FORM_TYPE_ENUM.edition
                ? 'text_62e161ceb87c201025388aa2'
                : 'text_6560809c38fb9de88d8a505e',
            )}
          </Button>
        </CenteredPage.StickyFooter>
      </CenteredPage.Wrapper>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_665deda4babaf700d603ea13')}
        description={translate('text_665dedd557dc3c00c62eb83d')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={() => navigateToCustomerWalletTab()}
      />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default CreateWallet
