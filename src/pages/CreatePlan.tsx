import { useRef } from 'react'
import styled from 'styled-components'

import { theme, PageHeader, Card } from '~/styles'
import { Typography, Button, ButtonLink } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { PLANS_ROUTE } from '~/core/router'
import SuccessImage from '~/public/images/maneki/success.svg'
import { PlanForm } from '~/components/plans/PlanForm'
import { usePlanForm, PLAN_FORM_TYPE_ENUM } from '~/hooks/plans/usePlanForm'

const CreatePlan = () => {
  const {
    loading,
    type,
    isCreated,
    plan,
    parentPlanName,
    errorCode,
    onSave,
    onClose,
    resetIsCreated,
  } = usePlanForm()
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
          onClick={() => (isCreated ? onClose() : warningDialogRef.current?.openDialog())}
        />
      </PageHeader>

      {isCreated ? (
        <SuccessCard $disableChildSpacing>
          <SuccessImage width="136" height="104" />
          <SuccessTitle variant="subhead">
            {translate('text_624455d859b1b000a8e17bf3')}
          </SuccessTitle>
          <SuccessDescription>{translate('text_624455d859b1b000a8e17bf5')}</SuccessDescription>
          <div>
            <Button variant="secondary" onClick={resetIsCreated}>
              {translate('text_624455d859b1b000a8e17bf7')}
            </Button>
            <ButtonLink
              data-test="go-back"
              type="button"
              to={PLANS_ROUTE}
              buttonProps={{ variant: 'secondary' }}
            >
              {translate('text_624455d859b1b000a8e17bf9')}
            </ButtonLink>
          </div>
        </SuccessCard>
      ) : (
        <PlanForm
          loading={loading}
          type={type}
          parentPlanName={parentPlanName}
          plan={plan}
          errorCode={errorCode}
          onSave={onSave}
        />
      )}

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

const SuccessCard = styled(Card)`
  max-width: 672px;
  margin: ${theme.spacing(12)} auto 0;

  > img {
    width: 40px;
    height: 40px;
    margin-bottom: ${theme.spacing(5)};
  }

  > *:last-child {
    display: flex;
    > *:first-child {
      margin-right: ${theme.spacing(3)};
    }
  }
`

const SuccessTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(3)};
`

const SuccessDescription = styled(Typography)`
  margin-bottom: ${theme.spacing(5)};
`

export default CreatePlan
