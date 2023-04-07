import { forwardRef, useMemo, useState } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
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
        title={'Add billable metric'}
        description={'Limit the usage of a coupon based on a billable metric. Please select a billable metric.'}
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
              {'Cancel'}
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
              {'Add billable metric'}
            </Button>
          </>
        )}
      >
        <StyledComboBox
          name="selectedBillableMetric"
          data={comboboxBillableMetricsData}
          label={'Label'}
          loading={loading}
          onChange={(value) => {
            const billableMetric = data?.billableMetrics?.collection.find((b) => b.id === value)

            if (!!billableMetric) {
              setSelectedBillableMetric(billableMetric)
            } else {
              setSelectedBillableMetric(undefined)
            }
          }}
          placeholder={'placeholder'}
          PopperProps={{ displayInDialog: true }}
          searchQuery={getBillableMetrics}
          value={selectedBillableMetric?.id}
        />
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
