import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  CLOSE_CREATE_WALLET_BUTTON_DATA_TEST,
  SUBMIT_WALLET_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { CUSTOMER_DETAILS_TAB_ROUTE, useNavigate, WALLET_DETAILS_ROUTE } from '~/core/router'
import {
  CurrencyEnum,
  GetWalletInfosForWalletFormQuery,
  LagoApiError,
  useCreateCustomerWalletMutation,
  useGetCustomerInfosForWalletFormQuery,
  useGetWalletInfosForWalletFormQuery,
  useUpdateCustomerWalletMutation,
  WalletForScopeSectionFragmentDoc,
  WalletForUpdateFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { ScopeSection } from '~/pages/wallet/components/ScopeSection'
import { SettingsSection } from '~/pages/wallet/components/SettingsSection'
import { TopUpSection } from '~/pages/wallet/components/TopUpSection'
import { walletFormValidationSchema } from '~/pages/wallet/formInitialization/validationSchema'
import { mapFromApiToForm } from '~/pages/wallet/mappers/mapFromApiToForm'
import { mapFormToCreateInput, mapFormToUpdateInput } from '~/pages/wallet/mappers/mapFromFormToApi'
import { WalletDetailsTabsOptionsEnum } from '~/pages/wallet/WalletDetails'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

gql`
  fragment WalletForUpdate on Wallet {
    id
    billingEntityId
    code
    currency
    expirationAt
    name
    rateAmount
    invoiceRequiresSuccessfulPayment
    paidTopUpMinAmountCents
    paidTopUpMaxAmountCents
    priority
    paymentMethodType
    paymentMethod {
      id
    }
    skipInvoiceCustomSections
    selectedInvoiceCustomSections {
      id
      name
    }
    appliesTo {
      feeTypes
      billableMetrics {
        id
      }
    }
    recurringTransactionRules {
      expirationAt
      grantedCredits
      grantsTargetTopUp
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
      paymentMethodType
      paymentMethod {
        id
      }
      skipInvoiceCustomSections
      selectedInvoiceCustomSections {
        id
        name
      }
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
      externalId
      currency
      timezone
      billingEntity {
        id
      }
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

  const centralizedDialog = useCentralizedDialog()

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
    wallet?.currency ||
    customerData?.customer?.currency ||
    organization?.defaultCurrency ||
    CurrencyEnum.Usd

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

  const form = useAppForm({
    defaultValues: mapFromApiToForm({ wallet, customerData, currency }),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: walletFormValidationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      // Both mutations silence UnprocessableEntity: a duplicate code
      // (ValueAlreadyExist) is mapped back onto the code field, any other
      // failure surfaces via toast only and simply aborts the navigation.
      const { errors } =
        formType === FORM_TYPE_ENUM.edition
          ? await updateWallet({
              variables: { input: mapFormToUpdateInput(value, walletId) },
            })
          : await createWallet({
              variables: { input: mapFormToCreateInput(value, customerId) },
            })

      if (!!errors?.length) {
        if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
          const codeError = { code: { message: 'text_632a2d437e341dcc76817556', path: ['code'] } }

          formApi.setErrorMap({ onDynamic: { fields: codeError } })
          scrollToFirstInputError('create-wallet', codeError)
        }

        return
      }

      navigateToCustomerWalletTab(walletId)
    },
  })

  const isDirty = useStore(form.store, (state) => state.isDirty)

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
    isDirty ? openDirtyAttributesWarning() : navigateToCustomerWalletTab(walletId)
  }, [isDirty, navigateToCustomerWalletTab, openDirtyAttributesWarning, walletId])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <CenteredPage.Wrapper>
      <form
        id="create-wallet"
        className="flex size-full min-h-full flex-col overflow-auto"
        onSubmit={handleSubmit}
      >
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
            data-test={CLOSE_CREATE_WALLET_BUTTON_DATA_TEST}
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
              form={form}
              formType={formType}
              customerData={customerData}
              showExpirationDate={showExpirationDate}
              setShowExpirationDate={setShowExpirationDate}
              showMinTopUp={showMinTopUp}
              setShowMinTopUp={setShowMinTopUp}
              showMaxTopUp={showMaxTopUp}
              setShowMaxTopUp={setShowMaxTopUp}
            />

            <ScopeSection form={form} />

            <TopUpSection
              form={form}
              formType={formType}
              customerData={customerData}
              isRecurringTopUpEnabled={isRecurringTopUpEnabled}
              setIsRecurringTopUpEnabled={setIsRecurringTopUpEnabled}
            />
          </CenteredPage.Container>
        )}

        <CenteredPage.StickyFooter>
          <Button variant="quaternary" onClick={onAbort}>
            {translate('text_62e79671d23ae6ff149de968')}
          </Button>
          <form.AppForm>
            <form.SubmitButton variant="primary" dataTest={SUBMIT_WALLET_DATA_TEST}>
              {translate(
                formType === FORM_TYPE_ENUM.edition
                  ? 'text_62e161ceb87c201025388aa2'
                  : 'text_6560809c38fb9de88d8a505e',
              )}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  )
}

export default CreateWallet
