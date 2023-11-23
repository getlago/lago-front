import { gql } from '@apollo/client'
import { forwardRef, useMemo, useState } from 'react'
import styled from 'styled-components'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { ComboBox } from '~/components/form'
import {
  PlansForCouponsFragment,
  PlansForCouponsFragmentDoc,
  useGetPlansForCouponsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { Item } from '../form/ComboBox/ComboBoxItem'

gql`
  fragment PlansForCoupons on Plan {
    id
    name
    code
  }

  query getPlansForCoupons($page: Int, $limit: Int, $searchTerm: String) {
    plans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        ...PlansForCoupons
      }
    }
  }

  ${PlansForCouponsFragmentDoc}
`

export interface AddPlanToCouponDialogRef extends DialogRef {}

interface AddPlanToCouponDialogProps {
  onSubmit: Function
  attachedPlansIds?: String[]
}

export const AddPlanToCouponDialog = forwardRef<DialogRef, AddPlanToCouponDialogProps>(
  ({ attachedPlansIds, onSubmit }: AddPlanToCouponDialogProps, ref) => {
    const { translate } = useInternationalization()
    const [selectedPlan, setSelectedPlan] = useState<PlansForCouponsFragment>()
    const [getPlans, { loading, data }] = useGetPlansForCouponsLazyQuery({
      variables: { limit: 50 },
    })
    const comboboxPlansData = useMemo(() => {
      if (!data || !data?.plans || !data?.plans?.collection) return []

      return data?.plans?.collection.map((plan) => {
        const { id, name, code } = plan

        return {
          label: `${name} - (${code})`,
          labelNode: (
            <Item>
              <Typography color="grey700" noWrap>
                {name}
              </Typography>
              &nbsp;
              <Typography color="textPrimary" noWrap>
                ({code})
              </Typography>
            </Item>
          ),
          value: id,
          disabled: attachedPlansIds?.includes(id),
        }
      })
    }, [data, attachedPlansIds])

    return (
      <Dialog
        ref={ref}
        title={translate('text_63d3a658c6d84a5843032141')}
        description={translate('text_63d3a658c6d84a5843032143')}
        onClose={() => {
          setSelectedPlan(undefined)
        }}
        onOpen={() => {
          if (!loading && !data) {
            getPlans()
          }
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63d3a658c6d84a5843032149')}
            </Button>
            <Button
              disabled={!selectedPlan}
              onClick={async () => {
                onSubmit(selectedPlan)
                closeDialog()
              }}
              data-test="submitAddPlanToCouponDialog"
            >
              {translate('text_63d3a658c6d84a584303214b')}
            </Button>
          </>
        )}
      >
        <StyledComboBox
          name="selectedPlan"
          data={comboboxPlansData}
          label={translate('text_63d3a658c6d84a5843032145')}
          loading={loading}
          onChange={(value) => {
            const plan = data?.plans?.collection.find((p) => p.id === value)

            if (!!plan) {
              setSelectedPlan(plan)
            } else {
              setSelectedPlan(undefined)
            }
          }}
          placeholder={translate('text_63d3a658c6d84a5843032147')}
          PopperProps={{ displayInDialog: true }}
          searchQuery={getPlans}
          value={selectedPlan?.id}
        />
      </Dialog>
    )
  },
)

AddPlanToCouponDialog.displayName = 'AddPlanToCouponDialog'

const StyledComboBox = styled(ComboBox)`
  margin-bottom: ${theme.spacing(8)};
`
