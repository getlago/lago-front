import { useMemo } from 'react'
import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import styled from 'styled-components'

import {
  SubscriptionItemFragmentDoc,
  useGetPlansLazyQuery,
  AddSubscriptionPlanFragment,
  BillingTimeEnum,
  PlanInterval,
  useCreateSubscriptionMutation,
  LagoApiError,
  CreateSubscriptionInput,
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

  query getPlans($page: Int, $limit: Int) {
    plans(page: $page, limit: $limit) {
      collection {
        ...AddSubscriptionPlan
      }
    }
  }

  mutation createSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      ...SubscriptionItem
    }
  }

  ${SubscriptionItemFragmentDoc}
`

interface UseAddSubscriptionReturn {
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
  subscriptionDate?: string
}) => UseAddSubscriptionReturn

export const useAddSubscription: UseAddSubscription = ({
  planId,
  billingTime,
  existingSubscription,
  subscriptionDate,
}) => {
  const [getPlans, { loading, data }] = useGetPlansLazyQuery({
    variables: { limit: 500 },
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
  })

  const selectedPlan = useMemo(() => {
    if (!data?.plans?.collection || !planId) return undefined

    return (data?.plans?.collection || []).find((plan) => plan.id === planId)
  }, [data?.plans, planId])

  return {
    loading,
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
      const currentDate = subscriptionDate
        ? DateTime.fromISO(subscriptionDate)
        : DateTime.now().setLocale('en-gb')
      const formattedCurrentDate = currentDate.toFormat('LL/dd/yyyy')
      const february29 = '02/29/2020'
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
    }, [selectedPlan, billingTime, subscriptionDate, translate]),
    errorCode: hasDefinedGQLError('CurrenciesDoesNotMatch', error)
      ? LagoApiError.CurrenciesDoesNotMatch
      : undefined,
    onOpenDrawer: () => {
      !loading && getPlans()
    },
    onCreate: async (customerId, { subscriptionDate: subsDate, ...values }) => {
      const { errors } = await create({
        variables: {
          input: {
            customerId,
            ...(!existingSubscription
              ? { subscriptionDate: subsDate }
              : { subscriptionId: existingSubscription.subscriptionId }),
            ...values,
          },
        },
        refetchQueries: ['getCustomer'],
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
