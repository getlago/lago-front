import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, Typography } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WalletCodeSnippet } from '~/components/wallets/WalletCodeSnippet'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import { getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CreateRecurringTransactionRuleInput,
  CurrencyEnum,
  GetWalletInfosForWalletFormQuery,
  LagoApiError,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  UpdateRecurringTransactionRuleInput,
  useCreateCustomerWalletMutation,
  useGetCustomerInfosForWalletFormQuery,
  useGetWalletInfosForWalletFormQuery,
  useUpdateCustomerWalletMutation,
  WalletForUpdateFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { LoadingView } from '~/pages/WalletForm/components/LoadingView'
import { SettingsCard } from '~/pages/WalletForm/components/SettingsCard'
import { TopUpCard } from '~/pages/WalletForm/components/TopUpCard'
import { walletFormSchema } from '~/pages/WalletForm/form'
import { TWalletDataForm } from '~/pages/WalletForm/types'
import { PageHeader } from '~/styles'
import { ButtonContainer, Side } from '~/styles/mainObjectsForm'

gql`
  fragment WalletForUpdate on Wallet {
    id
    expirationAt
    name
    rateAmount
    invoiceRequiresSuccessfulPayment
    recurringTransactionRules {
      lagoId
      method
      trigger
      interval
      targetOngoingBalance
      paidCredits
      grantedCredits
      thresholdCredits
      startedAt
      invoiceRequiresSuccessfulPayment
    }
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
`

function hasWalletRecurringTopUpEnabled(
  wallet: GetWalletInfosForWalletFormQuery['wallet'],
): boolean {
  return !!wallet?.recurringTransactionRules?.[0]?.trigger
}

const WalletForm = () => {
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

  useEffect(() => {
    if (wallet) {
      setIsRecurringTopUpEnabled(hasWalletRecurringTopUpEnabled(wallet))
    }

    if (!!wallet?.expirationAt) {
      setShowExpirationDate(true)
    }
  }, [wallet])

  const currency =
    customerData?.customer?.currency || organization?.defaultCurrency || CurrencyEnum.Usd
  const currencyPrecision = getCurrencyPrecision(currency)
  const navigateToCustomerWalletTab = () =>
    navigate(
      generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId,
        tab: CustomerDetailsTabsOptions.wallet,
      }),
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
      paidCredits: '',
      rateAmount: wallet?.rateAmount
        ? String(wallet?.rateAmount)
        : `1${currencyPrecision === 3 ? '.000' : currencyPrecision === 4 ? '.0000' : '.00'}`,
      recurringTransactionRules: wallet?.recurringTransactionRules || undefined,
      invoiceRequiresSuccessfulPayment: wallet?.invoiceRequiresSuccessfulPayment ?? false,
    },
    validationSchema: walletFormSchema(formType),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async ({
      grantedCredits,
      paidCredits,
      rateAmount,
      currency: valuesCurrency,
      recurringTransactionRules,
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
                } = rule

                return {
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
                  targetOngoingBalance:
                    method === RecurringTransactionMethodEnum.Target
                      ? targetOngoingBalance === ''
                        ? '0'
                        : String(targetOngoingBalance)
                      : null,
                  invoiceRequiresSuccessfulPayment,
                }
              },
            )
          : []

      if (formType === FORM_TYPE_ENUM.edition) {
        const { errors } = await updateWallet({
          variables: {
            input: {
              ...values,
              recurringTransactionRules: recurringTransactionRulesFormatted,
              id: walletId,
            },
          },
        })

        if (!!errors?.length) return
      } else {
        const { errors } = await createWallet({
          variables: {
            input: {
              ...values,
              customerId,
              currency: valuesCurrency,
              rateAmount: String(rateAmount),
              grantedCredits: grantedCredits === '' ? '0' : String(grantedCredits),
              paidCredits: paidCredits === '' ? '0' : String(paidCredits),
              recurringTransactionRules: recurringTransactionRulesFormatted,
            },
          },
        })

        if (!!errors?.length) return
      }

      navigateToCustomerWalletTab()
    },
  })

  return (
    <>
      <PageHeader.Wrapper>
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
          onClick={() =>
            formikProps.dirty
              ? warningDialogRef.current?.openDialog()
              : navigateToCustomerWalletTab()
          }
          data-test="close-create-plan-button"
        />
      </PageHeader.Wrapper>

      <div className="flex min-h-[calc(100vh-theme(space.nav))]">
        <div className="w-full px-4 pb-0 pt-12 md:w-3/5 md:px-12">
          <div className="flex flex-col gap-8 md:max-w-168">
            {isLoading && !wallet ? (
              <LoadingView cardCount={2} />
            ) : (
              <>
                <div>
                  <Typography className="mb-1" variant="headline" color="grey700">
                    {translate(
                      formType === FORM_TYPE_ENUM.edition
                        ? 'text_62d9430e8b9fe36851cddd09'
                        : 'text_6560809c38fb9de88d8a505e',
                    )}
                  </Typography>
                  <Typography variant="body" color="grey600">
                    {translate(
                      formType === FORM_TYPE_ENUM.edition
                        ? 'text_6657c2b9cf6b9200aa3d1c89'
                        : 'text_62d18855b22699e5cf55f873',
                    )}
                  </Typography>
                </div>

                <SettingsCard
                  formikProps={formikProps}
                  formType={formType}
                  customerData={customerData}
                  showExpirationDate={showExpirationDate}
                  setShowExpirationDate={setShowExpirationDate}
                />

                <TopUpCard
                  formikProps={formikProps}
                  formType={formType}
                  customerData={customerData}
                  isRecurringTopUpEnabled={isRecurringTopUpEnabled}
                  setIsRecurringTopUpEnabled={setIsRecurringTopUpEnabled}
                  premiumWarningDialogRef={premiumWarningDialogRef}
                />

                <ButtonContainer className="!max-w-168">
                  <Button
                    disabled={
                      !formikProps.isValid ||
                      (formType === FORM_TYPE_ENUM.edition && !formikProps.dirty)
                    }
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                    data-test="submit"
                  >
                    {translate(
                      formType === FORM_TYPE_ENUM.edition
                        ? 'text_62e161ceb87c201025388aa2'
                        : 'text_6560809c38fb9de88d8a505e',
                    )}
                  </Button>
                </ButtonContainer>
              </>
            )}
          </div>
        </div>
        <Side>
          <WalletCodeSnippet
            loading={isLoading}
            wallet={formikProps.values}
            isEdition={formType === FORM_TYPE_ENUM.edition}
            lagoId={wallet?.id}
          />
        </Side>
      </div>

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

export default WalletForm
