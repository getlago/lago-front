import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { WarningDialog, WarningDialogRef } from '~/components/designSystem/WarningDialog'
import { ComboboxItem } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { QUOTES_LIST_ROUTE } from '~/core/router'
import {
  OrderTypeEnum,
  StatusTypeEnum,
  useGetCustomersForCreateQuoteLazyQuery,
  useGetCustomerSubscriptionsForCreateQuoteLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { getQuoteOrderTypeTranslationKey } from './common/getQuoteOrderTypeTranslationKey'
import { type CreateQuoteFormValues, createQuoteSchema } from './createQuote/validationSchema'
import { useCreateQuote } from './hooks/useCreateQuote'

export const CREATE_QUOTE_CUSTOMER_COMBOBOX_TEST_ID = 'create-quote-customer-combobox'
export const CREATE_QUOTE_ORDER_TYPE_TEST_ID = 'create-quote-order-type'
export const CREATE_QUOTE_SUBSCRIPTION_COMBOBOX_TEST_ID = 'create-quote-subscription-combobox'
export const CREATE_QUOTE_SUBMIT_BUTTON_TEST_ID = 'create-quote-submit-button'

gql`
  query getCustomersForCreateQuote($page: Int, $limit: Int, $searchTerm: String) {
    customers(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        displayName
        externalId
      }
    }
  }

  query getCustomerSubscriptionsForCreateQuote($customerId: ID!) {
    customer(id: $customerId) {
      id
      subscriptions {
        id
        name
        externalId
        status
        plan {
          id
          name
          code
        }
      }
    }
  }
`

const defaultValues: CreateQuoteFormValues = {
  customerId: '',
  orderType: OrderTypeEnum.SubscriptionCreation,
  subscriptionId: '',
}

const CreateQuote = (): JSX.Element => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const { onSave, loading: mutationLoading } = useCreateQuote()

  const [getCustomers, { data: customersData, loading: customersLoading }] =
    useGetCustomersForCreateQuoteLazyQuery({
      variables: { page: 1, limit: 50 },
    })

  const [getCustomerSubscriptions, { data: subscriptionsData, loading: subscriptionsLoading }] =
    useGetCustomerSubscriptionsForCreateQuoteLazyQuery()

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: createQuoteSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        customerId: value.customerId,
        orderType: value.orderType,
        subscriptionId: value.subscriptionId || undefined,
      })
    },
  })

  const customerId = useStore(form.store, (state) => state.values.customerId)
  const orderType = useStore(form.store, (state) => state.values.orderType)
  const isDirty = useStore(form.store, (state) => state.isDirty)

  const comboboxCustomersData = useMemo(() => {
    if (!customersData?.customers?.collection) return []

    return customersData.customers.collection.map((customer) => ({
      label: customer.displayName || customer.externalId || '',
      labelNode: (
        <ComboboxItem>
          <Typography variant="body" color="grey700" noWrap>
            {customer.displayName || customer.externalId || ''}
          </Typography>
          {customer.externalId && (
            <Typography variant="caption" color="grey600" noWrap>
              {customer.externalId}
            </Typography>
          )}
        </ComboboxItem>
      ),
      value: customer.id,
    }))
  }, [customersData?.customers?.collection])

  const comboboxSubscriptionsData = useMemo(() => {
    if (!subscriptionsData?.customer?.subscriptions) return []

    return subscriptionsData.customer.subscriptions
      .filter((sub) => sub.status === StatusTypeEnum.Active)
      .map((subscription) => ({
        label: subscription.name || subscription.plan.name,
        labelNode: (
          <ComboboxItem>
            <Typography variant="body" color="grey700" noWrap>
              {subscription.name || subscription.plan.name}
            </Typography>
            <Typography variant="caption" color="grey600" noWrap>
              {subscription.externalId}
            </Typography>
          </ComboboxItem>
        ),
        value: subscription.id,
      }))
  }, [subscriptionsData?.customer?.subscriptions])

  const handleClose = useCallback(() => {
    if (isDirty) {
      warningDialogRef.current?.openDialog()
    } else {
      navigate(QUOTES_LIST_ROUTE)
    }
  }, [isDirty, navigate])

  const orderTypeOptions = useMemo(
    () => [
      {
        label: translate(getQuoteOrderTypeTranslationKey(OrderTypeEnum.SubscriptionCreation)),
        value: OrderTypeEnum.SubscriptionCreation,
      },
      {
        label: translate(getQuoteOrderTypeTranslationKey(OrderTypeEnum.SubscriptionAmendment)),
        value: OrderTypeEnum.SubscriptionAmendment,
      },
      {
        label: translate(getQuoteOrderTypeTranslationKey(OrderTypeEnum.OneOff)),
        value: OrderTypeEnum.OneOff,
      },
    ],
    [translate],
  )

  return (
    <>
      <CenteredPage.Wrapper>
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate('text_1776238919927a1b2c3d4e5f')}
          </Typography>
          <Button variant="quaternary" icon="close" onClick={handleClose} />
        </CenteredPage.Header>

        <CenteredPage.Container>
          <CenteredPage.SectionWrapper>
            <CenteredPage.PageTitle
              title={translate('text_1776238919927a1b2c3d4e5f')}
              description={translate('text_1776238919927f6g7h8i9j0k')}
            />

            <div className="flex flex-col gap-6">
              <form.AppField
                name="customerId"
                listeners={{
                  onChange: ({ value }) => {
                    form.setFieldValue('subscriptionId', '')

                    if (value) {
                      getCustomerSubscriptions({ variables: { customerId: value } })
                    }
                  },
                }}
              >
                {(field) => (
                  <field.ComboBoxField
                    dataTest={CREATE_QUOTE_CUSTOMER_COMBOBOX_TEST_ID}
                    label={translate('text_1776238919927l1m2n3o4p5q')}
                    placeholder={translate('text_1776238919927r6s7t8u9v0w')}
                    data={comboboxCustomersData}
                    loading={customersLoading}
                    searchQuery={getCustomers}
                  />
                )}
              </form.AppField>

              <form.AppField
                name="orderType"
                listeners={{
                  onChange: ({ value }) => {
                    form.setFieldValue('subscriptionId', '')

                    if (value === OrderTypeEnum.SubscriptionAmendment && customerId) {
                      getCustomerSubscriptions({ variables: { customerId } })
                    }
                  },
                }}
              >
                {(field) => (
                  <field.ComboBoxField
                    dataTest={CREATE_QUOTE_ORDER_TYPE_TEST_ID}
                    disableClearable
                    label={translate('text_1776238919927x1y2z3a4b5c')}
                    data={orderTypeOptions}
                  />
                )}
              </form.AppField>

              {orderType === OrderTypeEnum.SubscriptionAmendment && (
                <form.AppField name="subscriptionId">
                  {(field) => (
                    <field.ComboBoxField
                      dataTest={CREATE_QUOTE_SUBSCRIPTION_COMBOBOX_TEST_ID}
                      label={translate('text_1776238919927d6e7f8g9h0i')}
                      placeholder={translate('text_1776238919927j1k2l3m4n5o')}
                      data={comboboxSubscriptionsData}
                      loading={subscriptionsLoading}
                      emptyText={translate('text_1776238919927b6c7d8e9f0g')}
                    />
                  )}
                </form.AppField>
              )}
            </div>
          </CenteredPage.SectionWrapper>
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button variant="quaternary" onClick={handleClose}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.AppForm>
            <form.SubmitButton
              size="large"
              disabled={mutationLoading}
              dataTest={CREATE_QUOTE_SUBMIT_BUTTON_TEST_ID}
            >
              {translate('text_1776238919927p6q7r8s9t0u')}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </CenteredPage.Wrapper>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_665deda4babaf700d603ea13')}
        description={translate('text_665dedd557dc3c00c62eb83d')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={() => navigate(QUOTES_LIST_ROUTE)}
      />
    </>
  )
}

export default CreateQuote
