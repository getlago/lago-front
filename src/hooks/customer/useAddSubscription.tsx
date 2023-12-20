import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import { generatePath, useLocation, useNavigate } from 'react-router-dom'

import { PlanFormInput } from '~/components/plans/types'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { serializePlanInput } from '~/core/serializers'
import {
  BillingTimeEnum,
  CreateSubscriptionInput,
  CustomerDetailsFragment,
  CustomerDetailsFragmentDoc,
  GetSubscriptionForCreateSubscriptionQuery,
  LagoApiError,
  PlanOverridesInput,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation createSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      id
      customer {
        id
        activeSubscriptionsCount
        ...CustomerDetails
      }
    }
  }

  mutation updateSubscription($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      customer {
        id
        activeSubscriptionsCount
        ...CustomerDetails
      }
    }
  }

  ${CustomerDetailsFragmentDoc}
`

type UseAddSubscriptionReturn = {
  billingTimeHelper?: string
  errorCode?: LagoApiError
  formType: keyof typeof FORM_TYPE_ENUM
  onSave: (
    customerId: string,
    values: Omit<CreateSubscriptionInput, 'customerId'>,
    planValues: PlanFormInput,
    hasPlanBeingChangedFromInitial: boolean,
  ) => Promise<string | undefined>
}

type UseAddSubscription = (args: {
  existingSubscription?: GetSubscriptionForCreateSubscriptionQuery['subscription']
  billingTime?: BillingTimeEnum
  subscriptionAt?: string
}) => UseAddSubscriptionReturn

// Clean plan values (non editable fields not accepted by BE / Graph fails if they are sent)
const cleanPlanValues = (planValues: PlanOverridesInput, formType: keyof typeof FORM_TYPE_ENUM) => {
  return {
    ...planValues,
    code: undefined,
    interval: undefined,
    taxCodes: formType === FORM_TYPE_ENUM.edition ? undefined : planValues.taxCodes,
    taxes: undefined,
    payInAdvance: undefined,
    billChargesMonthly: undefined,
    charges: planValues?.charges?.map((charge) => ({
      ...charge,
      taxes: undefined,
      payInAdvance: undefined,
      billableMetric: undefined,
      chargeModel: undefined,
      invoiceable: undefined,
      prorated: undefined,
    })),
  }
}

export const useAddSubscription: UseAddSubscription = ({
  existingSubscription,
}): UseAddSubscriptionReturn => {
  let location = useLocation()
  const navigate = useNavigate()
  const { translate } = useInternationalization()

  const formType = useMemo(() => {
    if (location.pathname.includes('/update/subscription/')) return FORM_TYPE_ENUM.edition
    if (location.pathname.includes('/upgrade-downgrade/subscription/'))
      return FORM_TYPE_ENUM.upgradeDowngrade

    return FORM_TYPE_ENUM.creation
  }, [location.pathname])

  const [create] = useCreateSubscriptionMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    onCompleted: async (res) => {
      if (!!res?.createSubscription) {
        addToast({
          message: translate('text_65118a52df984447c186962f'),
          severity: 'success',
        })

        navigate(
          generatePath(CUSTOMER_DETAILS_ROUTE, {
            customerId: res.createSubscription.customer.id as string,
          }),
        )
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
  const [update] = useUpdateSubscriptionMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    onCompleted: async (res) => {
      if (!!res?.updateSubscription) {
        addToast({
          message: translate(
            formType === FORM_TYPE_ENUM.upgradeDowngrade
              ? 'text_65118a52df984447c18695f9'
              : 'text_65118a52df984447c186962e',
          ),
          severity: 'success',
        })
      }

      navigate(
        generatePath(CUSTOMER_DETAILS_ROUTE, {
          customerId: res?.updateSubscription?.customer.id as string,
        }),
      )
    },
    refetchQueries: ['getCustomerSubscriptionForList'],
  })

  return {
    formType,
    // errorCode: hasDefinedGQLError('CurrenciesDoesNotMatch', error)
    //   ? LagoApiError.CurrenciesDoesNotMatch
    //   : hasDefinedGQLError('ValueAlreadyExist', error)
    //   ? LagoApiError.ValueAlreadyExist
    //   : undefined,
    onSave: async (
      customerId,
      {
        subscriptionAt: subsDate,
        name,
        externalId,
        endingAt: subEndDate,
        planId,
        billingTime,
        ...values
      },
      { ...planValues },
      hasPlanBeingChangedFromInitial,
    ) => {
      const serializedPlanValues = serializePlanInput(planValues)
      const { errors } =
        formType === FORM_TYPE_ENUM.creation || formType === FORM_TYPE_ENUM.upgradeDowngrade
          ? await create({
              variables: {
                input: {
                  customerId,
                  planId,
                  billingTime,
                  ...(!existingSubscription
                    ? {
                        subscriptionAt: DateTime.fromISO(subsDate).toUTC().toISO(),
                        endingAt: !!subEndDate
                          ? DateTime.fromISO(subEndDate).toUTC().toISO()
                          : undefined,
                      } // Format to UTC only if it's a new creation (no upgrade, downgrade, edit)
                    : {
                        subscriptionId: existingSubscription.id,
                        subscriptionAt: !!existingSubscription.startedAt
                          ? DateTime.fromISO(existingSubscription.startedAt).toUTC().toISO()
                          : undefined,
                        endingAt: !!subEndDate
                          ? DateTime.fromISO(subEndDate).toUTC().toISO()
                          : null,
                      }),
                  name: name || undefined,
                  externalId: externalId || undefined,
                  ...values,
                  planOverrides: hasPlanBeingChangedFromInitial
                    ? { ...cleanPlanValues(serializedPlanValues as PlanOverridesInput, formType) }
                    : undefined,
                },
              },
            })
          : await update({
              variables: {
                input: {
                  ...values,
                  id: existingSubscription?.id as string,
                  subscriptionAt: !!existingSubscription?.startedAt
                    ? DateTime.fromISO(existingSubscription?.startedAt)
                        .toUTC()
                        .toISO()
                    : undefined,
                  endingAt: !!subEndDate ? DateTime.fromISO(subEndDate).toUTC().toISO() : null,
                  name: name || undefined,
                  planOverrides: hasPlanBeingChangedFromInitial
                    ? { ...cleanPlanValues(serializedPlanValues as PlanOverridesInput, formType) }
                    : undefined,
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
