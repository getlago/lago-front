import { forwardRef, useState, useMemo } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Dialog, Button, DialogRef, Alert } from '~/components/designSystem'
import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/useInternationalization'
import { addToast } from '~/core/apolloClient'
import { theme } from '~/styles'
import {
  useCreateSubscriptionMutation,
  CustomerSubscriptionListFragmentDoc,
  useGetPlansLazyQuery,
} from '~/generated/graphql'

export interface AddPlanToCustomerDialogRef extends DialogRef {}

gql`
  query getPlans($page: Int, $limit: Int) {
    plans(page: $page, limit: $limit) {
      collection {
        id
        name
        code
      }
    }
  }

  mutation createSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      ...CustomerSubscriptionList
    }
  }

  ${CustomerSubscriptionListFragmentDoc}
`

interface AddPlanToCustomerDialogProps {
  customerName: string
  customerId: string
  existingPlanIds?: string[]
  refetchCustomer: () => void
}

export const AddPlanToCustomerDialog = forwardRef<DialogRef, AddPlanToCustomerDialogProps>(
  (
    { customerId, customerName, existingPlanIds, refetchCustomer }: AddPlanToCustomerDialogProps,
    ref
  ) => {
    const { translate } = useInternationalization()
    const [planId, setPlanId] = useState<string>()
    const [getPlans, { loading, data }] = useGetPlansLazyQuery()
    const [create] = useCreateSubscriptionMutation({
      onCompleted: async ({ createSubscription }) => {
        if (!!createSubscription) {
          await refetchCustomer()
          addToast({
            message: translate('text_62544f170d205200f09d5938'),
            severity: 'success',
          })
        }
      },
    })

    const plans = useMemo(() => {
      if (!data || !data?.plans || !data?.plans?.collection) return []

      return data?.plans?.collection.map(({ id, name }) => {
        return {
          label: name,
          value: id,
          disabled: existingPlanIds && existingPlanIds.includes(id),
        }
      })
    }, [data, existingPlanIds])

    return (
      <Dialog
        ref={ref}
        title={translate(
          existingPlanIds?.length
            ? 'text_62559eef7b0ccc015127e38b'
            : 'text_625434c7bb2cb40124c81a19',
          { customerName }
        )}
        description={translate(
          existingPlanIds?.length
            ? 'text_62559eef7b0ccc015127e38d'
            : 'text_625434c7bb2cb40124c81a21'
        )}
        onOpen={() => {
          if (!loading && !data) {
            getPlans()
          }
        }}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                setPlanId(undefined)
              }}
            >
              {translate('text_6244277fe0975300fe3fb94a')}
            </Button>
            <Button
              disabled={!planId}
              onClick={async () => {
                await create({
                  variables: {
                    input: {
                      customerId,
                      planId: planId as string,
                    },
                  },
                  refetchQueries: ['getCustomer'],
                })
                setPlanId(undefined)
                closeDialog()
              }}
            >
              {translate(
                existingPlanIds?.length
                  ? 'text_62559eef7b0ccc015127e3a1'
                  : 'text_625434c7bb2cb40124c81a41'
              )}
            </Button>
          </>
        )}
      >
        <StyledComboBox
          label={translate('text_625434c7bb2cb40124c81a29')}
          value={planId}
          data={plans}
          loading={loading}
          loadingText={translate('text_625434c7bb2cb40124c81a35')}
          placeholder={translate('text_625434c7bb2cb40124c81a31')}
          emptyText={translate('text_625434c7bb2cb40124c81a37')}
          PopperProps={{ displayInDialog: true }}
          onChange={(value) => setPlanId(value)}
        />

        {!!existingPlanIds?.length && (
          <StyledAlert type="info">{translate('text_62559eef7b0ccc015127e39d')}</StyledAlert>
        )}
      </Dialog>
    )
  }
)

const StyledComboBox = styled(ComboBox)`
  margin-bottom: ${theme.spacing(8)};
`

const StyledAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`

AddPlanToCustomerDialog.displayName = 'AddPlanToCustomerDialog'
