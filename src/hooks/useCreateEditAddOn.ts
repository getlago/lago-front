import { useMemo } from 'react'
import { gql } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'

import {
  useUpdateAddOnMutation,
  useCreateAddOnMutation,
  useGetSingleAddOnQuery,
  EditAddOnFragment,
  AddOnItemFragmentDoc,
  CreateAddOnInput,
  UpdateAddOnInput,
} from '~/generated/graphql'
import { ERROR_404_ROUTE, ADD_ONS_ROUTE } from '~/core/router'
import { addToast } from '~/core/apolloClient'

gql`
  fragment EditAddOn on AddOnDetails {
    id
    name
    code
    description
    amountCents
    amountCurrency
  }

  query getSingleAddOn($id: ID!) {
    addOn(id: $id) {
      ...EditAddOn
    }
  }

  mutation createAddOn($input: CreateAddOnInput!) {
    createAddOn(input: $input) {
      id
    }
  }

  mutation updateAddOn($input: UpdateAddOnInput!) {
    updateAddOn(input: $input) {
      ...AddOnItem
    }
  }

  ${AddOnItemFragmentDoc}
`

type UseCreateEditAddOnReturn = {
  loading: boolean
  isEdition: boolean
  addOn?: EditAddOnFragment
  onSave: (value: CreateAddOnInput | UpdateAddOnInput) => Promise<void>
}

const formatCouponInput = (values: CreateAddOnInput | UpdateAddOnInput) => {
  const { amountCents, ...others } = values

  return {
    amountCents: Math.round(Number(amountCents) * 100),
    ...others,
  }
}

export const useCreateEditAddOn: () => UseCreateEditAddOnReturn = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, loading, error } = useGetSingleAddOnQuery({
    // @ts-ignore
    variables: { id },
    skip: !id,
  })
  const [create] = useCreateAddOnMutation({
    onCompleted({ createAddOn }) {
      if (!!createAddOn) {
        addToast({
          severity: 'success',
          translateKey: 'text_633336532bdf72cb62dc0692',
        })
        navigate(ADD_ONS_ROUTE)
      }
    },
  })
  const [update] = useUpdateAddOnMutation({
    onCompleted({ updateAddOn }) {
      if (!!updateAddOn) {
        addToast({
          severity: 'success',
          translateKey: 'text_629728388c4d2300e2d3818a',
        })
        navigate(ADD_ONS_ROUTE)
      }
    },
  })

  if (error) {
    navigate(ERROR_404_ROUTE) // TODO on error "not_found"
  }

  return useMemo(
    () => ({
      loading,
      isEdition: !!id,
      addOn: !data?.addOn ? undefined : data?.addOn,
      onSave: !!id
        ? async (values) => {
            await update({
              variables: {
                input: {
                  id,
                  ...formatCouponInput(values),
                },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: formatCouponInput(values),
              },
            })
          },
    }),
    [id, data, loading, create, update]
  )
}
