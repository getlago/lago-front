import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useCallback, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import {
  Alert,
  Button,
  ChargeTable,
  Chip,
  Typography,
  WarningDialog,
  WarningDialogRef,
} from '~/components/designSystem'
import { AmountInput, Switch, TextInput } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast } from '~/core/apolloClient'
import { PROGRESSIVE_BILLING_DOC_URL } from '~/core/constants/externalUrls'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, PLAN_SUBSCRIPTION_DETAILS_ROUTE } from '~/core/router'
import {
  CurrencyEnum,
  useGetSubscriptionForProgressiveBillingFormQuery,
  useUpdateSubscriptionProgressiveBillingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

gql`
  query getSubscriptionForProgressiveBillingForm($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      name
      progressiveBillingDisabled
      usageThresholds {
        amountCents
        recurring
        thresholdDisplayName
      }
      plan {
        id
        name
        amountCurrency
        usageThresholds {
          amountCents
          recurring
          thresholdDisplayName
        }
      }
    }
  }

  mutation updateSubscriptionProgressiveBilling($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      progressiveBillingDisabled
      usageThresholds {
        amountCents
        recurring
        thresholdDisplayName
      }
    }
  }
`

interface ThresholdInput {
  amountCents: string
  thresholdDisplayName: string
  recurring: boolean
  [key: string]: unknown
}

interface FormValues {
  progressiveBillingDisabled: boolean
  nonRecurringThresholds: ThresholdInput[]
  hasRecurring: boolean
  recurringThreshold: ThresholdInput
}

const SubscriptionProgressiveBillingForm = () => {
  const { customerId = '', planId = '', subscriptionId = '' } = useParams()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const warningDirtyAttributesDialogRef = useRef<WarningDialogRef>(null)

  const { data, loading } = useGetSubscriptionForProgressiveBillingFormQuery({
    variables: { subscriptionId },
    skip: !subscriptionId,
  })

  const subscription = data?.subscription
  const currency = subscription?.plan?.amountCurrency || CurrencyEnum.Usd

  const [updateSubscription] = useUpdateSubscriptionProgressiveBillingMutation({
    onCompleted({ updateSubscription: result }) {
      if (result?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_1738071730498pqk8rj3l2sm',
        })
        onLeave()
      }
    },
  })

  const onLeave = useCallback(() => {
    const tab = CustomerSubscriptionDetailsTabsOptionsEnum.progressiveBilling

    if (customerId) {
      navigate(
        generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
          customerId,
          subscriptionId,
          tab,
        }),
      )
    } else if (planId) {
      navigate(
        generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
          planId,
          subscriptionId,
          tab,
        }),
      )
    }
  }, [customerId, navigate, planId, subscriptionId])

  const initialValues = useMemo((): FormValues => {
    const thresholds = subscription?.usageThresholds || []
    const nonRecurring = thresholds.filter((t) => !t.recurring)
    const recurring = thresholds.find((t) => t.recurring)

    return {
      progressiveBillingDisabled: subscription?.progressiveBillingDisabled ?? false,
      nonRecurringThresholds:
        nonRecurring.length > 0
          ? nonRecurring.map((t) => ({
              amountCents: t.amountCents || '',
              thresholdDisplayName: t.thresholdDisplayName || '',
              recurring: false,
            }))
          : [{ amountCents: '', thresholdDisplayName: '', recurring: false }],
      hasRecurring: !!recurring,
      recurringThreshold: recurring
        ? {
            amountCents: recurring.amountCents || '',
            thresholdDisplayName: recurring.thresholdDisplayName || '',
            recurring: true,
          }
        : { amountCents: '', thresholdDisplayName: '', recurring: true },
    }
  }, [subscription])

  const validationSchema = z.object({
    progressiveBillingDisabled: z.boolean(),
    nonRecurringThresholds: z.array(
      z.object({
        amountCents: z.string(),
        thresholdDisplayName: z.string(),
        recurring: z.boolean(),
      }),
    ),
    hasRecurring: z.boolean(),
    recurringThreshold: z.object({
      amountCents: z.string(),
      thresholdDisplayName: z.string(),
      recurring: z.boolean(),
    }),
  })

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      const thresholds: Array<{
        amountCents: string
        thresholdDisplayName?: string
        recurring: boolean
      }> = []

      if (!value.progressiveBillingDisabled) {
        // Add non-recurring thresholds
        value.nonRecurringThresholds.forEach((t) => {
          if (t.amountCents) {
            thresholds.push({
              amountCents: t.amountCents,
              thresholdDisplayName: t.thresholdDisplayName || undefined,
              recurring: false,
            })
          }
        })

        // Add recurring threshold if enabled
        if (value.hasRecurring && value.recurringThreshold.amountCents) {
          thresholds.push({
            amountCents: value.recurringThreshold.amountCents,
            thresholdDisplayName: value.recurringThreshold.thresholdDisplayName || undefined,
            recurring: true,
          })
        }
      }

      await updateSubscription({
        variables: {
          input: {
            id: subscriptionId,
            progressiveBillingDisabled: value.progressiveBillingDisabled,
            usageThresholds: thresholds,
          },
        },
      })
    },
  })

  const {
    progressiveBillingDisabled,
    nonRecurringThresholds,
    hasRecurring,
    recurringThreshold,
    isDirty,
  } = useStore(form.store, (state) => ({
    progressiveBillingDisabled: state.values.progressiveBillingDisabled,
    nonRecurringThresholds: state.values.nonRecurringThresholds,
    hasRecurring: state.values.hasRecurring,
    recurringThreshold: state.values.recurringThreshold,
    isDirty: state.isDirty,
  }))

  const handleAddThreshold = useCallback(() => {
    form.setFieldValue('nonRecurringThresholds', [
      ...nonRecurringThresholds,
      { amountCents: '', thresholdDisplayName: '', recurring: false },
    ])
  }, [form, nonRecurringThresholds])

  const handleDeleteThreshold = useCallback(
    (index: number) => {
      const newThresholds = nonRecurringThresholds.filter((_, i) => i !== index)

      form.setFieldValue(
        'nonRecurringThresholds',
        newThresholds.length > 0
          ? newThresholds
          : [{ amountCents: '', thresholdDisplayName: '', recurring: false }],
      )
    },
    [form, nonRecurringThresholds],
  )

  const handleUpdateThreshold = useCallback(
    (index: number, field: 'amountCents' | 'thresholdDisplayName', value: string) => {
      const newThresholds = [...nonRecurringThresholds]

      newThresholds[index] = { ...newThresholds[index], [field]: value }
      form.setFieldValue('nonRecurringThresholds', newThresholds)
    },
    [form, nonRecurringThresholds],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <>
      <CenteredPage.Wrapper>
        <CenteredPage.Header>
          <div className="flex gap-2">
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {translate('text_1738071730498edit4pb8hzw')}
            </Typography>
            <Chip size="small" label={translate('text_65d8d71a640c5400917f8a13')} />
          </div>
          <Button
            variant="quaternary"
            icon="close"
            onClick={() =>
              isDirty ? warningDirtyAttributesDialogRef.current?.openDialog() : onLeave()
            }
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          {loading && <FormLoadingSkeleton id="progressive-billing-form" />}
          {!loading && (
            <form onSubmit={handleSubmit}>
              <div className="not-last-child:mb-1">
                <Typography variant="headline" color="grey700">
                  {translate('text_1724179887722baucvj7bvc1')}
                </Typography>
                <Typography
                  variant="body"
                  color="grey600"
                  html={translate('text_1724179887723kdf3nisf6hp', {
                    href: PROGRESSIVE_BILLING_DOC_URL,
                  })}
                />
              </div>

              <div className="flex flex-col gap-12">
                <section className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <Typography variant="subhead1">
                      {translate('text_1738071730498settingshdr')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1738071730498settingsdesc')}
                    </Typography>
                  </div>

                  <Switch
                    name="progressiveBillingDisabled"
                    checked={progressiveBillingDisabled}
                    onChange={(value) => form.setFieldValue('progressiveBillingDisabled', value)}
                    label={translate('text_1738071730498disabletoggle')}
                    subLabel={translate('text_1738071730498disabletoggledesc')}
                  />

                  {!progressiveBillingDisabled && (
                    <>
                      <div className="flex flex-col gap-4">
                        <Button
                          className="mb-2 ml-auto"
                          startIcon="plus"
                          variant="inline"
                          onClick={handleAddThreshold}
                        >
                          {translate('text_1724233213997l2ksi40t8q6')}
                        </Button>
                        <div className="-mx-4 -mb-1 overflow-auto px-4 pb-1">
                          <ChargeTable
                            name="progressive-billing-thresholds"
                            data={nonRecurringThresholds.map((t, i) => ({
                              ...t,
                              index: i,
                              disabledDelete: nonRecurringThresholds.length === 1,
                            }))}
                            onDeleteRow={(_, i) => handleDeleteThreshold(i)}
                            deleteTooltipContent={translate('text_17242522324608198c2vblmw')}
                            columns={[
                              {
                                size: 224,
                                content: (_, i) => (
                                  <Typography className="px-4" variant="captionHl" noWrap>
                                    {translate(
                                      i === 0
                                        ? 'text_1724234174944p8zi54j192m'
                                        : 'text_1724179887723917j8ezkd9v',
                                    )}
                                  </Typography>
                                ),
                              },
                              {
                                size: 197,
                                title: (
                                  <Typography className="px-4" variant="captionHl">
                                    {translate('text_1724179887723eh12a0kqbdw')}
                                  </Typography>
                                ),
                                content: (row, i) => (
                                  <AmountInput
                                    variant="outlined"
                                    beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                                    currency={currency}
                                    value={row.amountCents}
                                    onChange={(value) =>
                                      handleUpdateThreshold(i, 'amountCents', value || '')
                                    }
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          {getCurrencySymbol(currency)}
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                ),
                              },
                              {
                                size: 197,
                                title: (
                                  <Typography className="px-4" variant="captionHl">
                                    {translate('text_17241798877234jhvoho4ci9')}
                                  </Typography>
                                ),
                                content: (row, i) => (
                                  <TextInput
                                    variant="outlined"
                                    placeholder={translate('text_645bb193927b375079d28ace')}
                                    value={row.thresholdDisplayName}
                                    onChange={(value) =>
                                      handleUpdateThreshold(i, 'thresholdDisplayName', value)
                                    }
                                  />
                                ),
                              },
                            ]}
                          />
                        </div>
                      </div>

                      <Switch
                        name="hasRecurring"
                        checked={hasRecurring}
                        onChange={(value) => form.setFieldValue('hasRecurring', value)}
                        label={translate('text_1724234174945ztq15pvmty3')}
                        subLabel={translate('text_172423417494563qf45qet2d')}
                      />

                      {hasRecurring && (
                        <div className="-mx-4 -mb-1 overflow-auto px-4 pb-1">
                          <ChargeTable
                            name="progressive-billing-recurring"
                            columns={[
                              {
                                size: 224,
                                content: () => (
                                  <Typography className="px-4" variant="captionHl" noWrap>
                                    {translate('text_17241798877230y851fdxzqu')}
                                  </Typography>
                                ),
                              },
                              {
                                size: 197,
                                content: () => (
                                  <AmountInput
                                    variant="outlined"
                                    beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                                    currency={currency}
                                    value={recurringThreshold.amountCents}
                                    onChange={(value) =>
                                      form.setFieldValue('recurringThreshold', {
                                        ...recurringThreshold,
                                        amountCents: value || '',
                                      })
                                    }
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          {getCurrencySymbol(currency)}
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                ),
                              },
                              {
                                size: 197,
                                content: () => (
                                  <TextInput
                                    variant="outlined"
                                    placeholder={translate('text_645bb193927b375079d28ace')}
                                    value={recurringThreshold.thresholdDisplayName}
                                    onChange={(value) =>
                                      form.setFieldValue('recurringThreshold', {
                                        ...recurringThreshold,
                                        thresholdDisplayName: value,
                                      })
                                    }
                                  />
                                ),
                              },
                            ]}
                            data={[recurringThreshold]}
                          />
                        </div>
                      )}

                      <Alert type="info">{translate('text_1724252232460iqofvwnpgnx')}</Alert>
                    </>
                  )}
                </section>
              </div>
            </form>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button
            variant="quaternary"
            size="large"
            onClick={() =>
              isDirty ? warningDirtyAttributesDialogRef.current?.openDialog() : onLeave()
            }
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button
            variant="primary"
            size="large"
            disabled={!isDirty || loading}
            onClick={() => form.handleSubmit()}
          >
            {translate('text_17432414198706rdwf76ek3u')}
          </Button>
        </CenteredPage.StickyFooter>
      </CenteredPage.Wrapper>

      <WarningDialog
        ref={warningDirtyAttributesDialogRef}
        title={translate('text_6244277fe0975300fe3fb940')}
        description={translate('text_6244277fe0975300fe3fb946')}
        continueText={translate('text_6244277fe0975300fe3fb94c')}
        onContinue={onLeave}
      />
    </>
  )
}

export default SubscriptionProgressiveBillingForm
