import { gql, LazyQueryExecFunction } from '@apollo/client'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { ComboBoxProps } from '~/components/form'
import { addToast, hasDefinedGQLError, SubscriptionUpdateInfo } from '~/core/apolloClient'
import {
  AddSubscriptionPlanFragment,
  BillingTimeEnum,
  CreateSubscriptionInput,
  CustomerDetailsFragment,
  CustomerDetailsFragmentDoc,
  LagoApiError,
  PlanInterval,
  useCreateSubscriptionMutation,
  useGetPlansLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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
        activeSubscriptionsCount
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
  ) => Promise<string | undefined>
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
    onCompleted: async (res) => {
      if (!!res?.createSubscription) {
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
          activeSubscriptionsCount:
            updatedData.createSubscription.customer.activeSubscriptionsCount,
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

        case PlanInterval.Quarterly:
          if (billingTime === BillingTimeEnum.Calendar)
            return translate('text_64d6357b00dea100ad1cba34')

          if (currentDay <= 28) {
            return translate('text_64d6357b00dea100ad1cba36', { day: currentDay })
          } else if (currentDay === 29) {
            return translate('text_64d63ec2f6bd3f41a6e353ac')
          } else if (currentDay === 30) {
            return translate('text_64d63ec2f6bd3f41a6e353b0')
          }
          return translate('text_64d63ec2f6bd3f41a6e353b4')

        case PlanInterval.Weekly:
        default:
          return billingTime === BillingTimeEnum.Calendar
            ? translate('text_62ea7cd44cd4b14bb9ac1d9e')
            : translate('text_62ea7cd44cd4b14bb9ac1da2', { day: currentDate.weekdayLong })
      }
    }, [selectedPlan, billingTime, subscriptionAt, translate]),
    errorCode: hasDefinedGQLError('CurrenciesDoesNotMatch', error)
      ? LagoApiError.CurrenciesDoesNotMatch
      : hasDefinedGQLError('ValueAlreadyExist', error)
      ? LagoApiError.ValueAlreadyExist
      : undefined,
    onOpenDrawer: () => {
      !loading && getPlans()
    },
    onCreate: async (
      customerId,
      { subscriptionAt: subsDate, name, externalId, endingAt: subEndDate, ...values }
    ) => {
      const { errors } = await create({
        variables: {
          input: {
            customerId,
            ...(!existingSubscription
              ? {
                  subscriptionAt: DateTime.fromISO(subsDate).toUTC().toISO(),
                  endingAt: !!subEndDate ? DateTime.fromISO(subEndDate).toUTC().toISO() : undefined,
                } // Format to UTC only if it's a new creation (no upgrade, downgrade, edit)
              : {
                  subscriptionId: existingSubscription.subscriptionId,
                  subscriptionAt: !!existingSubscription.startDate
                    ? DateTime.fromISO(existingSubscription.startDate).toUTC().toISO()
                    : undefined,
                  endingAt: !!subEndDate ? DateTime.fromISO(subEndDate).toUTC().toISO() : null,
                }),
            name: name || undefined,
            externalId: externalId || undefined,
            ...values,
          },
        },
      })

      if (hasDefinedGQLError('CurrenciesDoesNotMatch', errors)) {
        return 'CurrenciesDoesNotMatch'
      } else if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        return 'ValueAlreadyExist'
      }

      return
    },
  }
}

const PlanItem = styled.span`
  display: flex;
  white-space: pre;
`
