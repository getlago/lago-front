import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '~/styles'
import { Typography, Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { BILLABLE_METRICS_ROUTE } from '~/core/router'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { BillableMetricForm } from '~/components/billableMetrics/BillableMetricForm'
import { useCreateEditBillableMetric } from '~/hooks/useCreateEditBillableMetric'

const CreateBillableMetric = () => {
  const { translate } = useInternationalization()
  const { isEdition, loading, billableMetric, onSave } = useCreateEditBillableMetric()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  let navigate = useNavigate()

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_62582fb4675ece01137a7e44' : 'text_623b42ff8ee4e000ba87d0ae')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() => warningDialogRef.current?.openDialog()}
        />
      </PageHeader>

      <BillableMetricForm
        loading={loading}
        billableMetric={billableMetric}
        onSave={onSave}
        isEdition={isEdition}
      />

      <WarningDialog
        ref={warningDialogRef}
        title={translate(
          isEdition ? 'text_62583bbb86abcf01654f693f' : 'text_6244277fe0975300fe3fb940'
        )}
        description={translate(
          isEdition ? 'text_62583bbb86abcf01654f6943' : 'text_6244277fe0975300fe3fb946'
        )}
        continueText={translate(
          isEdition ? 'text_62583bbb86abcf01654f694b' : 'text_6244277fe0975300fe3fb94c'
        )}
        onContinue={() => navigate(BILLABLE_METRICS_ROUTE)}
      />
    </div>
  )
}

export default CreateBillableMetric
