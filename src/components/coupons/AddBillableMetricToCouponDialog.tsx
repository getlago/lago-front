import { gql } from '@apollo/client'
import { forwardRef, useMemo, useState } from 'react'

import { Alert, Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { ComboBox, ComboboxItem } from '~/components/form'
import {
  BillableMetricsForCouponsFragment,
  BillableMetricsForCouponsFragmentDoc,
  useGetBillableMetricsForCouponsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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

export type AddBillableMetricToCouponDialogRef = DialogRef

interface AddBillableMetricToCouponDialogProps {
  onSubmit: (billableMetric: BillableMetricsForCouponsFragment) => void
  attachedBillableMetricsIds?: string[]
}

export const AddBillableMetricToCouponDialog = forwardRef<
  DialogRef,
  AddBillableMetricToCouponDialogProps
>(({ attachedBillableMetricsIds, onSubmit }: AddBillableMetricToCouponDialogProps, ref) => {
  const { translate } = useInternationalization()
  const [selectedBillableMetric, setSelectedBillableMetric] = useState<
    BillableMetricsForCouponsFragment | undefined
  >()
  const [getBillableMetrics, { loading, data }] = useGetBillableMetricsForCouponsLazyQuery({
    variables: { limit: 50 },
  })
  const comboboxBillableMetricsData = useMemo(() => {
    if (!data || !data?.billableMetrics || !data?.billableMetrics?.collection) return []

    return data?.billableMetrics?.collection.map((billableMetric) => {
      const { id, name, code } = billableMetric

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
        disabled: attachedBillableMetricsIds?.includes(id),
      }
    })
  }, [data, attachedBillableMetricsIds])

  return (
    <Dialog
      ref={ref}
      title={translate('text_64352657267c3d916f96274b')}
      description={translate('text_64352657267c3d916f962751')}
      onClose={() => {
        setSelectedBillableMetric(undefined)
      }}
      onOpen={() => {
        if (!loading && !data) {
          getBillableMetrics()
        }
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_64352657267c3d916f962769')}
          </Button>
          <Button
            disabled={!selectedBillableMetric}
            onClick={async () => {
              !!selectedBillableMetric && onSubmit(selectedBillableMetric)
              closeDialog()
            }}
            data-test="submitAddBillableMetricToCouponDialog"
          >
            {translate('text_64352657267c3d916f96276f')}
          </Button>
        </>
      )}
    >
      <ComboBox
        name="selectedBillableMetric"
        className="mb-8"
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
      <Alert className="mb-8" type="warning">
        {translate('text_64352657267c3d916f962763')}
      </Alert>
    </Dialog>
  )
})

AddBillableMetricToCouponDialog.displayName = 'AddBillableMetricToCouponDialog'
