import { forwardRef, useMemo, useState } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import {Alert, Button, Dialog, DialogRef, Typography} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  BillableMetricsForCouponsFragment,
  BillableMetricsForCouponsFragmentDoc,
  useGetBillableMetricsForCouponsLazyQuery,
} from '~/generated/graphql'
import { ComboBox } from '~/components/form'
import { theme } from '~/styles'

gql`
  fragment BillableMetricsForCoupons on BillableMetric {
    id
    name
    code
  }

  query getBillableMetricsForCoupons($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        ...BillableMetricsForCoupons
      }
    }
  }

  ${BillableMetricsForCouponsFragmentDoc}
`

export interface AddBillableMetricToCouponDialogRef extends DialogRef {}

interface AddBillableMetricToCouponDialogProps {
  onSubmit: Function
  attachedBillableMetricsIds?: String[]
}

export const AddBillableMetricToCouponDialog = forwardRef<DialogRef, AddBillableMetricToCouponDialogProps>(
  ({ attachedBillableMetricsIds, onSubmit }: AddBillableMetricToCouponDialogProps, ref) => {
    const { translate } = useInternationalization()
    const [selectedBillableMetric, setSelectedBillableMetric] = useState<BillableMetricsForCouponsFragment>()
    const [getBillableMetrics, { loading, data }] = useGetBillableMetricsForCouponsLazyQuery({
      variables: { limit: 50 },
    })
    const comboboxBillableMetricsData = useMemo(() => {
      if (!data || !data?.billableMetrics || !data?.billableMetrics?.collection) return []

      return data?.billableMetrics?.collection.map((billableMetric) => {
        const { id, name, code } = billableMetric

        return {
          label: `${name} - (${code})`,
          labelNode: (
            <BillableMetricItem>
              {name} <Typography color="textPrimary">({code})</Typography>
            </BillableMetricItem>
          ),
          value: id,
          disabled: attachedBillableMetricsIds?.includes(id),
        }
      })
    }, [data, attachedBillableMetricsIds])

    return (
      <Dialog
        ref={ref}
        title={translate('text_64352657267c3d916f96274b')}
        description={translate('text_64352657267c3d916f962751')}
        onClickAway={() => {
          setSelectedBillableMetric(undefined)
        }}
        onOpen={() => {
          if (!loading && !data) {
            getBillableMetrics()
          }
        }}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                setSelectedBillableMetric(undefined)
              }}
            >
              {translate('text_64352657267c3d916f962769')}
            </Button>
            <Button
              disabled={!selectedBillableMetric}
              onClick={async () => {
                onSubmit(selectedBillableMetric)
                closeDialog()
                setSelectedBillableMetric(undefined)
              }}
              data-test="submitAddBillableMetricToCouponDialog"
            >
              {translate('text_64352657267c3d916f96276f')}
            </Button>
          </>
        )}
      >
        <StyledComboBox
          name="selectedBillableMetric"
          data={comboboxBillableMetricsData}
          label={translate('text_64352657267c3d916f962757')}
          loading={loading}
          onChange={(value) => {
            const billableMetric = data?.billableMetrics?.collection.find((b) => b.id === value)

            if (!!billableMetric) {
              setSelectedBillableMetric(billableMetric)
            } else {
              setSelectedBillableMetric(undefined)
            }
          }}
          placeholder={translate('text_64352657267c3d916f96275d')}
          PopperProps={{ displayInDialog: true }}
          searchQuery={getBillableMetrics}
          value={selectedBillableMetric?.id}
        />
        <StyledAlertBox type="warning">{translate('text_64352657267c3d916f962763')}</StyledAlertBox>
      </Dialog>
    )
  }
)

AddBillableMetricToCouponDialog.displayName = 'AddBillableMetricToCouponDialog'

const BillableMetricItem = styled.span`
  display: flex;
  white-space: pre;
`
const StyledComboBox = styled(ComboBox)`
  margin-bottom: ${theme.spacing(8)};
`

const StyledAlertBox = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`
