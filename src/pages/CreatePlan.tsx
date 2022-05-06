import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { theme, PageHeader } from '~/styles'
import { Typography, Button } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { PLANS_ROUTE } from '~/core/router'
import EmojiParty from '~/public/images/party.png'
import { PlanForm } from '~/components/plans/PlanForm'
import { useCreateEditPlan } from '~/hooks/useCreateEditPlan'

const CreatePlan = () => {
  const { loading, isEdition, isCreated, plan, onSave, resetIsCreated } = useCreateEditPlan()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const { translate } = useI18nContext()
  let navigate = useNavigate()

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_625fd165963a7b00c8f59767' : 'text_624453d52e945301380e4988')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            isCreated ? navigate(PLANS_ROUTE) : warningDialogRef.current?.openDialog()
          }
        />
      </PageHeader>

      {isCreated ? (
        <SuccessCard>
          <img src={EmojiParty} alt="success emoji" />
          <SuccessTitle variant="subhead">
            {translate('text_624455d859b1b000a8e17bf3')}
          </SuccessTitle>
          <SuccessDescription>{translate('text_624455d859b1b000a8e17bf5')}</SuccessDescription>
          <div>
            <Button variant="secondary" onClick={resetIsCreated}>
              {translate('text_624455d859b1b000a8e17bf7')}
            </Button>
            <Button variant="secondary" onClick={() => navigate(PLANS_ROUTE)}>
              {translate('text_624455d859b1b000a8e17bf9')}
            </Button>
          </div>
        </SuccessCard>
      ) : (
        <PlanForm loading={loading} isEdition={isEdition} plan={plan} onSave={onSave} />
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
        onContinue={() => navigate(PLANS_ROUTE)}
      />
    </div>
  )
}

const Card = styled.div`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;
`

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
