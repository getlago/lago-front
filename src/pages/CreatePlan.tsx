import { useRef } from 'react'

import { PageHeader } from '~/styles'
import { Typography, Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { PlanForm } from '~/components/plans/PlanForm'
import { usePlanForm, PLAN_FORM_TYPE_ENUM } from '~/hooks/plans/usePlanForm'

const CreatePlan = () => {
  const { loading, type, plan, parentPlanName, errorCode, onSave, onClose } = usePlanForm()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const { translate } = useInternationalization()
  const isEdition = type === PLAN_FORM_TYPE_ENUM?.edition

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {type === PLAN_FORM_TYPE_ENUM.override
            ? translate('text_6329fd60c32c30152678a6e8', { planName: parentPlanName })
            : translate(
                isEdition ? 'text_625fd165963a7b00c8f59767' : 'text_624453d52e945301380e4988'
              )}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() => warningDialogRef.current?.openDialog()}
        />
      </PageHeader>

      <PlanForm
        loading={loading}
        type={type}
        parentPlanName={parentPlanName}
        plan={plan}
        errorCode={errorCode}
        onSave={onSave}
      />

      <WarningDialog
        ref={warningDialogRef}
        title={translate(
          isEdition ? 'text_625fd165963a7b00c8f59777' : 'text_624454dd67656e00c534bc35'
        )}
        description={translate(
          isEdition ? 'text_625fd165963a7b00c8f59781' : 'text_624454dd67656e00c534bc3b'
        )}
        continueText={translate(
          isEdition ? 'text_625fd165963a7b00c8f59795' : 'text_624454dd67656e00c534bc41'
        )}
        onContinue={onClose}
      />
    </div>
  )
}

export default CreatePlan
