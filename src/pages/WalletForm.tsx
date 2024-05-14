import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { array, object, string } from 'yup'

import { Alert, Button, Icon, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import {
  AmountInputField,
  ComboBoxField,
  DatePickerField,
  Switch,
  TextInput,
  TextInputField,
} from '~/components/form'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  getWordingForWalletCreationAlert,
  getWordingForWalletEditionAlert,
} from '~/components/wallets/utils'
import { WalletCodeSnippet } from '~/components/wallets/WalletCodeSnippet'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { dateErrorCodes, FORM_TYPE_ENUM } from '~/core/constants/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import { getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CreateCustomerWalletInput,
  CurrencyEnum,
  GetWalletInfosForWalletFormQuery,
  LagoApiError,
  RecurringTransactionIntervalEnum,
  RecurringTransactionTriggerEnum,
  UpdateCustomerWalletInput,
  UpdateRecurringTransactionRuleInput,
  useCreateCustomerWalletMutation,
  useGetCustomerInfosForWalletFormQuery,
  useGetWalletInfosForWalletFormQuery,
  useUpdateCustomerWalletMutation,
  WalletForUpdateFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { Card, NAV_HEIGHT, PageHeader, theme } from '~/styles'
import { ButtonContainer, Side, SkeletonHeader } from '~/styles/mainObjectsForm'

import { CustomerDetailsTabsOptions } from './CustomerDetails'

export type TWalletDataForm = Omit<CreateCustomerWalletInput, 'customerId'> &
  Omit<UpdateCustomerWalletInput, 'id'>

const DEFAULT_RULES = {
  grantedCredits: undefined,
  interval: undefined,
  lagoId: undefined,
  paidCredits: undefined,
  trigger: RecurringTransactionTriggerEnum.Threshold,
  thresholdCredits: undefined,
}

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
  const { isPremium } = useCurrentUser()
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

  const recurringTransactionRules = formikProps.values?.recurringTransactionRules?.[0]

  const canDisplayEditionAlert =
    (!!recurringTransactionRules?.paidCredits || !!recurringTransactionRules?.grantedCredits) &&
    ((recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Interval &&
      !!recurringTransactionRules?.interval) ||
      recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Threshold)

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
            <>
              <SkeletonHeader>
                <Skeleton variant="text" width={280} height={12} marginBottom={theme.spacing(5)} />
                <Skeleton
                  variant="text"
                  width="inherit"
                  height={12}
                  marginBottom={theme.spacing(4)}
                />
                <Skeleton variant="text" width={120} height={12} />
              </SkeletonHeader>

              {[0, 1, 2].map((skeletonCard) => (
                <Card key={`skeleton-${skeletonCard}`}>
                  <Skeleton
                    variant="text"
                    width={280}
                    height={12}
                    marginBottom={theme.spacing(9)}
                  />
                  <Skeleton
                    variant="text"
                    width={280}
                    height={12}
                    marginBottom={theme.spacing(9)}
                  />
                  <Skeleton
                    variant="text"
                    width={280}
                    height={12}
                    marginBottom={theme.spacing(9)}
                  />
                  <Skeleton
                    variant="text"
                    width="inherit"
                    height={12}
                    marginBottom={theme.spacing(4)}
                  />
                  <Skeleton variant="text" width={120} height={12} />
                </Card>
              ))}
            </>
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
              <Card>
                <Typography variant="subhead">
                  {translate('text_6560809c38fb9de88d8a5090')}
                </Typography>
                <TextInputField
                  name="name"
                  label={translate('text_62d18855b22699e5cf55f875')}
                  placeholder={translate('text_62d18855b22699e5cf55f877')}
                  formikProps={formikProps}
                />
                <Inlineinputs $hasOnlyThreeColumn={!!customerData?.customer?.currency}>
                  <TextInput
                    value="1"
                    label={translate('text_62d18855b22699e5cf55f879')}
                    disabled={true}
                  />
                  <TextInput value="=" disabled={true} />
                  <AmountInputField
                    name="rateAmount"
                    disabled={formType === FORM_TYPE_ENUM.edition}
                    currency={formikProps.values.currency}
                    beforeChangeFormatter={['positiveNumber']}
                    label={translate('text_62d18855b22699e5cf55f87d')}
                    formikProps={formikProps}
                    InputProps={{
                      endAdornment: !!customerData?.customer?.currency && (
                        <InputAdornment position="end">
                          {getCurrencySymbol(customerData?.customer?.currency)}
                        </InputAdornment>
                      ),
                    }}
                  />
                  {!customerData?.customer?.currency && (
                    <ComboBoxField
                      disableClearable
                      name="currency"
                      data={Object.values(CurrencyEnum).map((currencyType) => ({
                        value: currencyType,
                      }))}
                      formikProps={formikProps}
                      PopperProps={{ displayInDialog: true }}
                    />
                  )}
                </Inlineinputs>

                {showExpirationDate ? (
                  <InlineExpirationInput>
                    <DatePickerField
                      disablePast
                      name="expirationAt"
                      placement="top-end"
                      label={translate('text_62d18855b22699e5cf55f897')}
                      placeholder={translate('text_62d18855b22699e5cf55f899')}
                      formikProps={formikProps}
                      error={
                        formikProps.errors.expirationAt === dateErrorCodes.shouldBeInFuture
                          ? translate('text_630ccd87b251590eaa5f9831', {
                              date: DateTime.now().toFormat('LLL. dd, yyyy'),
                            })
                          : undefined
                      }
                    />
                    <CloseExpirationTooltip
                      placement="top-end"
                      title={translate('text_63aa085d28b8510cd46443ff')}
                    >
                      <Button
                        icon="trash"
                        variant="quaternary"
                        onClick={() => {
                          formikProps.setFieldValue('expirationAt', null)
                          setShowExpirationDate(false)
                        }}
                      />
                    </CloseExpirationTooltip>
                  </InlineExpirationInput>
                ) : (
                  <Button
                    startIcon="plus"
                    variant="quaternary"
                    onClick={() => setShowExpirationDate(true)}
                    data-test="show-expiration-at"
                  >
                    {translate('text_6560809c38fb9de88d8a517e')}
                  </Button>
                )}
              </Card>

              <Card>
                <Typography variant="subhead">
                  {translate('text_6560809c38fb9de88d8a5198')}
                </Typography>

                {formType === FORM_TYPE_ENUM.creation && (
                  <>
                    <AmountInputField
                      name="paidCredits"
                      currency={formikProps.values.currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_62d18855b22699e5cf55f885')}
                      formikProps={formikProps}
                      silentError={true}
                      helperText={translate('text_62d18855b22699e5cf55f88b', {
                        paidCredits: intlFormatNumber(
                          isNaN(Number(formikProps.values.paidCredits))
                            ? 0
                            : Number(formikProps.values.paidCredits) *
                                Number(formikProps.values.rateAmount),
                          {
                            currencyDisplay: 'symbol',
                            currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                          },
                        ),
                      })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {translate('text_62d18855b22699e5cf55f889')}
                          </InputAdornment>
                        ),
                      }}
                    />

                    <AmountInputField
                      name="grantedCredits"
                      currency={formikProps.values.currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_62d18855b22699e5cf55f88d')}
                      formikProps={formikProps}
                      silentError={true}
                      helperText={translate('text_62d18855b22699e5cf55f893', {
                        grantedCredits: intlFormatNumber(
                          isNaN(Number(formikProps.values.grantedCredits))
                            ? 0
                            : Number(formikProps.values.grantedCredits) *
                                Number(formikProps.values.rateAmount),
                          {
                            currencyDisplay: 'symbol',
                            currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                          },
                        ),
                      })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {translate('text_62d18855b22699e5cf55f891')}
                          </InputAdornment>
                        ),
                      }}
                    />
                  </>
                )}

                <InlineElements>
                  <Switch
                    name="isRecurringTopUpEnabled"
                    checked={isRecurringTopUpEnabled}
                    label={translate('text_6560809c38fb9de88d8a52ad')}
                    subLabel={translate('text_6560809c38fb9de88d8a52c7')}
                    onChange={(value) => {
                      if (isPremium) {
                        if (value) {
                          formikProps.setFieldValue('recurringTransactionRules.0', DEFAULT_RULES)
                        } else {
                          formikProps.setFieldValue('recurringTransactionRules', [])
                        }

                        setIsRecurringTopUpEnabled(value)
                      } else {
                        premiumWarningDialogRef.current?.openDialog()
                      }
                    }}
                  />
                  {!isPremium && <Icon name="sparkles" />}
                </InlineElements>

                {formType === FORM_TYPE_ENUM.edition && isRecurringTopUpEnabled && (
                  <>
                    <AmountInputField
                      name="recurringTransactionRules.0.paidCredits"
                      currency={formikProps.values.currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_62d18855b22699e5cf55f885')}
                      formikProps={formikProps}
                      silentError={true}
                      helperText={translate('text_62d18855b22699e5cf55f88b', {
                        paidCredits: intlFormatNumber(
                          isNaN(Number(recurringTransactionRules?.paidCredits))
                            ? 0
                            : Number(recurringTransactionRules?.paidCredits) *
                                Number(formikProps.values.rateAmount),
                          {
                            currencyDisplay: 'symbol',
                            currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                          },
                        ),
                      })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {translate('text_62d18855b22699e5cf55f889')}
                          </InputAdornment>
                        ),
                      }}
                    />

                    <AmountInputField
                      name="recurringTransactionRules.0.grantedCredits"
                      currency={formikProps.values.currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_62d18855b22699e5cf55f88d')}
                      formikProps={formikProps}
                      silentError={true}
                      helperText={translate('text_62d18855b22699e5cf55f893', {
                        grantedCredits: intlFormatNumber(
                          isNaN(Number(recurringTransactionRules?.grantedCredits))
                            ? 0
                            : Number(recurringTransactionRules?.grantedCredits) *
                                Number(formikProps.values.rateAmount),
                          {
                            currencyDisplay: 'symbol',
                            currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                          },
                        ),
                      })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {translate('text_62d18855b22699e5cf55f891')}
                          </InputAdornment>
                        ),
                      }}
                    />
                  </>
                )}

                {isRecurringTopUpEnabled && (
                  <InlineTopUpElements>
                    <ComboBoxField
                      disableClearable
                      label={translate('text_6560809c38fb9de88d8a52fb')}
                      name="recurringTransactionRules.0.trigger"
                      data={[
                        {
                          label: translate('text_65201b8216455901fe273dc1'),
                          value: RecurringTransactionTriggerEnum.Interval,
                        },
                        {
                          label: translate('text_6560809c38fb9de88d8a5315'),
                          value: RecurringTransactionTriggerEnum.Threshold,
                        },
                      ]}
                      formikProps={formikProps}
                    />

                    {recurringTransactionRules?.trigger ===
                      RecurringTransactionTriggerEnum.Interval && (
                      <ComboBoxField
                        disableClearable
                        sortValues={false}
                        label={translate('text_65201b8216455901fe273dc1')}
                        placeholder={translate('text_6560c252c4f33631aff1ab27')}
                        name="recurringTransactionRules.0.interval"
                        data={[
                          {
                            label: translate('text_62b32ec6b0434070791c2d4c'),
                            value: RecurringTransactionIntervalEnum.Weekly,
                          },
                          {
                            label: translate('text_624453d52e945301380e49aa'),
                            value: RecurringTransactionIntervalEnum.Monthly,
                          },
                          {
                            label: translate('text_64d6357b00dea100ad1cb9e9'),
                            value: RecurringTransactionIntervalEnum.Quarterly,
                          },
                          {
                            label: translate('text_624453d52e945301380e49ac'),
                            value: RecurringTransactionIntervalEnum.Yearly,
                          },
                        ]}
                        formikProps={formikProps}
                      />
                    )}
                    {recurringTransactionRules?.trigger ===
                      RecurringTransactionTriggerEnum.Threshold && (
                      <AmountInputField
                        name="recurringTransactionRules.0.thresholdCredits"
                        currency={formikProps.values.currency}
                        beforeChangeFormatter={['positiveNumber']}
                        label={translate('text_6560809c38fb9de88d8a5315')}
                        formikProps={formikProps}
                        silentError={true}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {translate('text_62d18855b22699e5cf55f891')}
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </InlineTopUpElements>
                )}

                {formType === FORM_TYPE_ENUM.creation && (
                  <Alert type="info">
                    {getWordingForWalletCreationAlert({
                      translate,
                      currency: formikProps.values?.currency,
                      customerTimezone: customerData?.customer?.timezone,
                      rulesValues: recurringTransactionRules,
                      walletValues: formikProps.values,
                    })}
                  </Alert>
                )}
                {isRecurringTopUpEnabled &&
                  canDisplayEditionAlert &&
                  formType === FORM_TYPE_ENUM.edition && (
                    <Alert type="info">
                      {getWordingForWalletEditionAlert({
                        translate,
                        currency: formikProps.values?.currency,
                        customerTimezone: customerData?.customer?.timezone,
                        rulesValues: recurringTransactionRules,
                      })}
                    </Alert>
                  )}
              </Card>
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

const Inlineinputs = styled.div<{ $hasOnlyThreeColumn?: boolean }>`
  display: grid;
  grid-template-columns: 48px 48px 1fr 120px;
  gap: ${theme.spacing(3)};
  align-items: flex-end;

  ${({ $hasOnlyThreeColumn }) =>
    $hasOnlyThreeColumn &&
    css`
      grid-template-columns: minmax(48px, 120px) 48px minmax(160px, 1fr);
    `}
`

const InlineExpirationInput = styled.div`
  display: flex;
  gap: ${theme.spacing(4)};
  align-items: center;

  > *:first-child {
    flex-grow: 1;
  }
`

const CloseExpirationTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(6)};
`

const InlineElements = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const InlineTopUpElements = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: ${theme.spacing(3)};
`

const CustomButtonContainer = styled(ButtonContainer)`
  max-width: 672px !important;
`
