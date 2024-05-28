import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { array, object, string } from 'yup'

import { Button, Typography } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WalletCodeSnippet } from '~/components/wallets/WalletCodeSnippet'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { dateErrorCodes, FORM_TYPE_ENUM } from '~/core/constants/form'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import { getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  GetWalletInfosForWalletFormQuery,
  LagoApiError,
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
import { NAV_HEIGHT, PageHeader, theme } from '~/styles'
import { ButtonContainer, Side } from '~/styles/mainObjectsForm'

import { TWalletDataForm } from './types'

import { CustomerDetailsTabsOptions } from '../CustomerDetails'

gql`
  fragment WalletForUpdate on Wallet {
    id
    expirationAt
    name
    rateAmount
    recurringTransactionRules {
      lagoId
      trigger
      interval
      thresholdCredits
      paidCredits
      grantedCredits
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
    },
    validationSchema: object().shape({
      name: string(),
      expirationAt: string()
        .test({
          test: function (value, { path }) {
            // Value can be undefined
            if (!value) {
              return true
            }

            // Make sure value has correct format
            if (!DateTime.fromISO(value).isValid) {
              return this.createError({
                path,
                message: dateErrorCodes.wrongFormat,
              })
            }

            const endingAt = DateTime.fromISO(value)

            // Make sure endingAt is in the future
            if (DateTime.now().diff(endingAt, 'days').days >= 0) {
              return this.createError({
                path,
                message: dateErrorCodes.shouldBeInFuture,
              })
            }

            return true
          },
        })
        .nullable(),
      paidCredits: string().test({
        test: function (paidCredits) {
          if (formType === FORM_TYPE_ENUM.edition) return true

          const { grantedCredits } = this?.parent

          return !isNaN(Number(paidCredits)) || !isNaN(Number(grantedCredits))
        },
      }),
      grantedCredits: string().test({
        test: function (grantedCredits) {
          if (formType === FORM_TYPE_ENUM.edition) return true

          const { paidCredits } = this?.parent

          return !isNaN(Number(grantedCredits)) || !isNaN(Number(paidCredits))
        },
      }),
      rateAmount: string().required(''),

      recurringTransactionRules: array()
        .of(
          object().shape({
            trigger: string().required(''),
            interval: string()
              .test({
                test: function (interval) {
                  const { trigger } = this?.parent

                  if (!!trigger && trigger !== RecurringTransactionTriggerEnum.Interval) {
                    return true
                  }
                  return !!interval
                },
              })
              .nullable(),
            thresholdCredits: string()
              .test({
                test: function (thresholdCredits) {
                  const { trigger } = this?.parent

                  if (!!trigger && trigger !== RecurringTransactionTriggerEnum.Threshold) {
                    return true
                  }
                  return !!thresholdCredits
                },
              })
              .nullable(),
            paidCredits: string().test({
              test: function (paidCredits) {
                if (formType === FORM_TYPE_ENUM.creation) return true

                const { grantedCredits: ruleGrantedCredit } = this?.parent

                return !isNaN(Number(paidCredits)) || !isNaN(Number(ruleGrantedCredit))
              },
            }),
            grantedCredits: string().test({
              test: function (grantedCredits) {
                if (formType === FORM_TYPE_ENUM.creation) return true

                const { paidCredits: rulePaidCredit } = this?.parent

                return !isNaN(Number(grantedCredits)) || !isNaN(Number(rulePaidCredit))
              },
            }),
          }),
        )
        .nullable(),
    }),
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
      const recurringTransactionRulesFormatted = !!recurringTransactionRules?.length
        ? recurringTransactionRules?.map((rule: UpdateRecurringTransactionRuleInput) => {
            const {
              lagoId,
              interval,
              trigger,
              thresholdCredits,
              paidCredits: rulePaidCredit,
              grantedCredits: ruleGrantedCredit,
            } = rule

            if (formType === FORM_TYPE_ENUM.creation) {
              return {
                trigger: trigger as RecurringTransactionTriggerEnum,
                interval: trigger === RecurringTransactionTriggerEnum.Interval ? interval : null,
                thresholdCredits:
                  trigger === RecurringTransactionTriggerEnum.Threshold ? thresholdCredits : null,
              }
            }

            return {
              lagoId,
              trigger: trigger as RecurringTransactionTriggerEnum,
              interval: trigger === RecurringTransactionTriggerEnum.Interval ? interval : null,
              thresholdCredits:
                trigger === RecurringTransactionTriggerEnum.Threshold ? thresholdCredits : null,
              paidCredits: rulePaidCredit === '' ? '0' : String(rulePaidCredit),
              grantedCredits: ruleGrantedCredit === '' ? '0' : String(ruleGrantedCredit),
            }
          })
        : formType === FORM_TYPE_ENUM.edition
          ? []
          : null

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
              ? 'text_62e161ceb87c201025388aa2'
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
                  {translate('text_62d18855b22699e5cf55f873')}
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
        title={translate('text_6560809c38fb9de88d8a50e8')}
        description={translate(
          formType === FORM_TYPE_ENUM.edition
            ? 'text_6560809c38fb9de88d8a5026'
            : 'text_6560809c38fb9de88d8a5102',
        )}
        continueText={translate(
          formType === FORM_TYPE_ENUM.edition
            ? 'text_6287a9bdac160c00b2e0fbfd'
            : 'text_624454dd67656e00c534bc41',
        )}
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
