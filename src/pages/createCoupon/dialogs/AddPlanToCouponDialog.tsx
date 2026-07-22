import { gql } from '@apollo/client'
import { useEffect, useMemo, useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { ComboboxItem } from '~/components/form'
import {
  SelectablePlanForCouponsFragment,
  SelectablePlanForCouponsFragmentDoc,
  useGetPlansForCouponsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { DialogActionButton, useSetDisabledRef } from './DialogActionButton'

gql`
  fragment SelectablePlanForCoupons on SelectablePlan {
    id
    name
    code
  }

  query getPlansForCoupons($page: Int, $limit: Int, $searchTerm: String) {
    selectablePlans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        ...SelectablePlanForCoupons
      }
    }
  }

  ${SelectablePlanForCouponsFragmentDoc}
`

export const ADD_PLAN_FORM_ID = 'add-plan-to-coupon-form'
const SUBMIT_ADD_PLAN_DIALOG_TEST_ID = 'submit-add-plan-to-coupon-dialog'

interface AddPlanContentProps {
  attachedPlansIds?: string[]
  onSelect: (plan: SelectablePlanForCouponsFragment | undefined) => void
}

const AddPlanContent = ({ attachedPlansIds, onSelect }: AddPlanContentProps) => {
  const { translate } = useInternationalization()
  const [getPlans, { loading, data }] = useGetPlansForCouponsLazyQuery({
    variables: { limit: 50 },
  })

  const form = useAppForm({
    defaultValues: {
      selectedPlan: '',
    },
  })

  useEffect(() => {
    getPlans()
  }, [getPlans])

  const comboboxPlansData = useMemo(() => {
    if (!data || !data?.selectablePlans || !data?.selectablePlans?.collection) return []

    return data?.selectablePlans?.collection.map((plan) => {
      const { id, name, code } = plan

      return {
        label: `${name} (${code})`,
        labelNode: (
          <ComboboxItem>
            <Typography variant="body" color="grey700" noWrap>
              {name}
            </Typography>
            <Typography variant="caption" color="grey600" noWrap>
              {code}
            </Typography>
          </ComboboxItem>
        ),
        value: id,
        disabled: attachedPlansIds?.includes(id),
      }
    })
  }, [data, attachedPlansIds])

  return (
    <div className="p-8">
      <form.AppField
        name="selectedPlan"
        listeners={{
          onChange: ({ value }) => {
            const plan = data?.selectablePlans?.collection.find((p) => p.id === value)

            onSelect(value ? plan : undefined)
          },
        }}
      >
        {(field) => (
          <field.ComboBoxField
            data={comboboxPlansData}
            label={translate('text_63d3a658c6d84a5843032145')}
            loading={loading}
            placeholder={translate('text_63d3a658c6d84a5843032147')}
            PopperProps={{ displayInDialog: true }}
            searchQuery={getPlans}
          />
        )}
      </form.AppField>
    </div>
  )
}

interface OpenAddPlanToCouponDialogParams {
  onSubmit: (plan: SelectablePlanForCouponsFragment) => void
  attachedPlansIds?: string[]
}

export const useAddPlanToCouponDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const selectedPlanRef = useRef<SelectablePlanForCouponsFragment | undefined>()
  const setDisabledRef = useSetDisabledRef()

  const openAddPlanToCouponDialog = ({
    attachedPlansIds,
    onSubmit,
  }: OpenAddPlanToCouponDialogParams) => {
    selectedPlanRef.current = undefined

    formDialog.open({
      title: translate('text_63d3a658c6d84a5843032141'),
      description: translate('text_63d3a658c6d84a5843032143'),
      closeOnError: false,
      children: (
        <AddPlanContent
          attachedPlansIds={attachedPlansIds}
          onSelect={(plan) => {
            selectedPlanRef.current = plan
            setDisabledRef.current(!plan)
          }}
        />
      ),
      mainAction: (
        <DialogActionButton
          label={translate('text_63d3a658c6d84a584303214b')}
          setDisabledRef={setDisabledRef}
          data-test={SUBMIT_ADD_PLAN_DIALOG_TEST_ID}
        />
      ),
      form: {
        id: ADD_PLAN_FORM_ID,
        submit: () => {
          if (!selectedPlanRef.current) {
            throw new Error('No plan selected')
          }
          onSubmit(selectedPlanRef.current)
        },
      },
    })
  }

  return { openAddPlanToCouponDialog }
}
