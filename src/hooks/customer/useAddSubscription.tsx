import { useMemo } from 'react'
import { gql, LazyQueryExecFunction } from '@apollo/client'
import { DateTime } from 'luxon'
import styled from 'styled-components'

import {
  useGetPlansLazyQuery,
  AddSubscriptionPlanFragment,
  BillingTimeEnum,
  PlanInterval,
  useCreateSubscriptionMutation,
  LagoApiError,
  CreateSubscriptionInput,
  CustomerDetailsFragment,
  CustomerDetailsFragmentDoc,
} from '~/generated/graphql'
import { SubscriptionUpdateInfo, addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ComboBoxProps } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography } from '~/components/designSystem'

gql`
  fragment AddSubscriptionPlan on Plan {
    id
    name
    code
    interval
  }

  query getPlans($page: Int, $limit: Int, $searchTerm: String) {
    plans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        ...AddSubscriptionPlan
      }
    }
  }

  mutation createSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      id
      customer {
        id
        activeSubscriptionCount
      }
    }
  }
`

interface UseAddSubscriptionReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPlans: LazyQueryExecFunction<any, any>
  loading: boolean
  comboboxPlansData: ComboBoxProps['data']
  selectedPlan?: AddSubscriptionPlanFragment
  billingTimeHelper?: string
  errorCode?: LagoApiError
  onOpenDrawer: () => void
  onCreate: (
    customerId: string,
    values: Omit<CreateSubscriptionInput, 'customerId'>
  ) => Promise<boolean>
}

type UseAddSubscription = (args: {
  existingSubscription?: SubscriptionUpdateInfo
  planId?: string
  billingTime?: BillingTimeEnum
  subscriptionAt?: string
}) => UseAddSubscriptionReturn

export const useAddSubscription: UseAddSubscription = ({
  planId,
  billingTime,
  existingSubscription,
  subscriptionAt,
}) => {
  const [getPlans, { loading, data }] = useGetPlansLazyQuery({
    variables: { limit: 1000 },
  })
  const { translate } = useInternationalization()
  const [create, { error }] = useCreateSubscriptionMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    onCompleted: async ({ createSubscription }) => {
      if (!!createSubscription) {
        addToast({
          message: existingSubscription
            ? translate('text_62d7f6178ec94cd09370e69a')
            : translate('text_62544f170d205200f09d5938'),
          severity: 'success',
        })
      }
    },
    update(cache, { data: updatedData }) {
      if (!updatedData?.createSubscription) return

      const cachedCustomerId = `Customer:${updatedData?.createSubscription.customer.id}`

      const previousData: CustomerDetailsFragment | null = cache.readFragment({
        id: cachedCustomerId,
        fragment: CustomerDetailsFragmentDoc,
        fragmentName: 'CustomerDetails',
      })

      cache.writeFragment({
        id: cachedCustomerId,
        fragment: CustomerDetailsFragmentDoc,
        fragmentName: 'CustomerDetails',
        data: {
          ...previousData,
          activeSubscriptionCount: updatedData.createSubscription.customer.activeSubscriptionCount,
        },
      })
    },
    refetchQueries: ['getCustomerSubscriptionForList'],
  })

  const selectedPlan = useMemo(() => {
    if (!data?.plans?.collection || !planId) return undefined

    return (data?.plans?.collection || []).find((plan) => plan.id === planId)
  }, [data?.plans, planId])

  return {
    loading,
    getPlans,
    comboboxPlansData: useMemo(() => {
      if (!data || !data?.plans || !data?.plans?.collection) return []

      return data?.plans?.collection.map(({ id, name, code }) => {
        return {
          label: `${name} - (${code})`,
          labelNode: (
            <PlanItem>
              {name} <Typography color="textPrimary">({code})</Typography>
            </PlanItem>
          ),
          value: id,
          disabled:
            !!existingSubscription?.existingPlanId && existingSubscription?.existingPlanId === id,
        }
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, existingSubscription?.existingPlanId]),
    selectedPlan,
    billingTimeHelper: useMemo(() => {
      const currentDate = subscriptionAt
        ? DateTime.fromISO(subscriptionAt)
        : DateTime.now().setLocale('en-gb')
      const formattedCurrentDate = currentDate.toFormat('LL/dd/yyyy')
      const february29 = `02/29/${DateTime.now().year}`
      const currentDay = currentDate.get('day')

      if (!selectedPlan) return undefined

      switch (selectedPlan?.interval) {
        case PlanInterval.Monthly:
          if (billingTime === BillingTimeEnum.Calendar)
            return translate('text_62ea7cd44cd4b14bb9ac1d7e')

          if (currentDay <= 28) {
            return translate('text_62ea7cd44cd4b14bb9ac1d82', { day: currentDay })
          } else if (currentDay === 29) {
            return translate('text_62ea7cd44cd4b14bb9ac1d86')
          } else if (currentDay === 30) {
            return translate('text_62ea7cd44cd4b14bb9ac1d8a')
          }
          return translate('text_62ea7cd44cd4b14bb9ac1d8e')

        case PlanInterval.Yearly:
          return billingTime === BillingTimeEnum.Calendar
            ? translate('text_62ea7cd44cd4b14bb9ac1d92')
            : formattedCurrentDate === february29
            ? translate('text_62ea7cd44cd4b14bb9ac1d9a')
            : translate('text_62ea7cd44cd4b14bb9ac1d96', { date: currentDate.toFormat('LLL. dd') })

        case PlanInterval.Weekly:
        default:
          return billingTime === BillingTimeEnum.Calendar
            ? translate('text_62ea7cd44cd4b14bb9ac1d9e')
            : translate('text_62ea7cd44cd4b14bb9ac1da2', { day: currentDate.weekdayLong })
      }
    }, [selectedPlan, billingTime, subscriptionAt, translate]),
    errorCode: hasDefinedGQLError('CurrenciesDoesNotMatch', error)
      ? LagoApiError.CurrenciesDoesNotMatch
      : undefined,
    onOpenDrawer: () => {
      !loading && getPlans()
    },
    onCreate: async (customerId, { subscriptionAt: subsDate, name, externalId, ...values }) => {
      const { errors } = await create({
        variables: {
          input: {
            customerId,
            ...(!existingSubscription
              ? { subscriptionAt: DateTime.fromISO(subsDate).startOf('day').toUTC().toISO() }
              : { subscriptionId: existingSubscription.subscriptionId }),
            name: name || undefined,
            externalId: externalId || undefined,
            ...values,
          },
        },
      })

      if (!hasDefinedGQLError('CurrenciesDoesNotMatch', errors)) {
        return true
      }

      return false
    },
  }
}

const PlanItem = styled.span`
  display: flex;
  white-space: pre;
`
