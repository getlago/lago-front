import { forwardRef, useMemo, useState } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Dialog, Button, DialogRef, Typography } from '~/components/designSystem'
import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useGetbillableMetricsLazyQuery, BillableMetricForPlanFragment } from '~/generated/graphql'
import { theme } from '~/styles'

export interface AddChargeDialogRef extends DialogRef {}

gql`
  fragment billableMetricForPlan on BillableMetric {
    id
    name
    code
    flatGroups {
      id
      key
      value
    }
  }

  query getbillableMetrics($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        ...billableMetricForPlan
      }
    }
  }
`

interface AddChargeDialogProps {
  onConfirm: (item: BillableMetricForPlanFragment) => void
}

export const AddChargeDialog = forwardRef<DialogRef, AddChargeDialogProps>(
  ({ onConfirm }: AddChargeDialogProps, ref) => {
    const [selectedId, setSelectedId] = useState<string>()
    const { translate } = useInternationalization()
    const [getBillableMetrics, { loading, data }] = useGetbillableMetricsLazyQuery({
      variables: { limit: 50 },
    })
    const billableMetrics = useMemo(() => {
      if (!data || !data?.billableMetrics || !data?.billableMetrics?.collection) return []

      return data?.billableMetrics?.collection.map(({ id, name, code }) => {
        return {
          label: `${name} (${code})`,
          labelNode: (
            <Item>
              {name} <Typography color="textPrimary">({code})</Typography>
            </Item>
          ),
          value: id,
        }
      })
    }, [data])

    return (
      <Dialog
        ref={ref}
        title={translate('text_6246b6bc6b25f500b779aa4a')}
        description={translate('text_6246b6bc6b25f500b779aa56')}
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
                setSelectedId(undefined)
              }}
            >
              {translate('text_6244277fe0975300fe3fb94a')}
            </Button>
            <Button
              data-test="submit-add-charge"
              disabled={!selectedId}
              onClick={async () => {
                const selectedItem = data?.billableMetrics?.collection.find(
                  (bm) => bm.id === selectedId
                )

                selectedItem && onConfirm(selectedItem)
                closeDialog()
                setSelectedId(undefined)
              }}
            >
              {translate('text_6246b6bc6b25f500b779aa8e')}
            </Button>
          </>
        )}
      >
        <StyledComboBox
          label={translate('text_624c5eadff7db800acc4c995')}
          value={selectedId}
          data={billableMetrics}
          searchQuery={getBillableMetrics}
          name="billableMetricId"
          loading={loading}
          loadingText={translate('text_6246b6bc6b25f500b779aa84')}
          placeholder={translate('text_6246b6bc6b25f500b779aa6e')}
          emptyText={translate('text_6246b6bc6b25f500b779aa7a')}
          PopperProps={{ displayInDialog: true }}
          onChange={(value) => setSelectedId(value)}
        />
      </Dialog>
    )
  }
)

const Item = styled.span`
  display: flex;
  white-space: pre;
`

const StyledComboBox = styled(ComboBox)`
  margin-bottom: ${theme.spacing(8)};
`

AddChargeDialog.displayName = 'AddChargeDialog'
