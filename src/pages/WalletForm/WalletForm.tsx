import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Button, Typography } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WalletCodeSnippet } from '~/components/wallets/WalletCodeSnippet'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
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
import { NAV_HEIGHT, PageHeader, theme } from '~/styles'
import { ButtonContainer, Side } from '~/styles/mainObjectsForm'

import { LoadingView } from './components/LoadingView'
import { SettingsCard } from './components/SettingsCard'
import { TopUpCard } from './components/TopUpCard'
import { walletFormSchema } from './form'
import { TWalletDataForm } from './types'

import { CustomerDetailsTabsOptions } from '../CustomerDetails'

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
      invoiceRequiresSuccessfulPayment: wallet?.invoiceRequiresSuccessfulPayment ?? true,
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
                      ? startedAt ?? DateTime.now().toISO()
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
      <PageHeader>
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
      </PageHeader>

      <Content>
        <Main>
          {isLoading && !wallet ? (
            <LoadingView cardCount={2} />
          ) : (
            <>
              <div>
                <Title variant="headline" color="grey700">
                  {translate(
                    formType === FORM_TYPE_ENUM.edition
                      ? 'text_62d9430e8b9fe36851cddd09'
                      : 'text_6560809c38fb9de88d8a505e',
                  )}
                </Title>
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

              <CustomButtonContainer>
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
              </CustomButtonContainer>
            </>
          )}
        </Main>
        <Side>
          <WalletCodeSnippet
            loading={isLoading}
            wallet={formikProps.values}
            isEdition={formType === FORM_TYPE_ENUM.edition}
          />
        </Side>
      </Content>

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

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - ${NAV_HEIGHT}px);
`

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
  width: 60%;
  box-sizing: border-box;
  padding: ${theme.spacing(12)} ${theme.spacing(12)} 0 ${theme.spacing(12)};

  > div {
    max-width: 720px;
  }

  ${theme.breakpoints.down('md')} {
    width: 100%;
    padding: ${theme.spacing(12)} ${theme.spacing(4)} 0;
  }
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

const CustomButtonContainer = styled(ButtonContainer)`
  max-width: 672px !important;
`
