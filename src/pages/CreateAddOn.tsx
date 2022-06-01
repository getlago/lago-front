import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { useCreateEditAddOn } from '~/hooks/useCreateEditAddOn'
import { theme, PageHeader } from '~/styles'
import { useI18nContext } from '~/core/I18nContext'
import { Typography, Button } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import EmojiParty from '~/public/images/party.png'
import { ADD_ONS_ROUTE } from '~/core/router'
import { AddOnForm } from '~/components/addOns/AddOnForm'

const CreateAddOn = () => {
  const { translate } = useI18nContext()
  let navigate = useNavigate()
  const { isEdition, loading, addOn, isCreated, resetIsCreated, onSave } = useCreateEditAddOn()
  const warningDialogRef = useRef<WarningDialogRef>(null)

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_629728388c4d2300e2d37fc2' : 'text_629728388c4d2300e2d37fbc')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            isCreated ? navigate(ADD_ONS_ROUTE) : warningDialogRef.current?.openDialog()
          }
        />
      </PageHeader>
      {isCreated ? (
        <SuccessCard>
          <img src={EmojiParty} alt="success emoji" />
          <SuccessTitle variant="subhead">
            {translate('text_629728388c4d2300e2d37fd8')}
          </SuccessTitle>
          <SuccessDescription>{translate('text_629728388c4d2300e2d37ff2')}</SuccessDescription>
          <div>
            <Button variant="secondary" onClick={resetIsCreated}>
              {translate('text_629728388c4d2300e2d3800c')}
            </Button>
            <Button variant="secondary" onClick={() => navigate(ADD_ONS_ROUTE)}>
              {translate('text_629728388c4d2300e2d38026')}
            </Button>
          </div>
        </SuccessCard>
      ) : (
        <AddOnForm loading={loading} addOn={addOn} onSave={onSave} isEdition={isEdition} />
      )}
      <WarningDialog
        ref={warningDialogRef}
        title={translate(
          isEdition ? 'text_629728388c4d2300e2d37fe0' : 'text_629728388c4d2300e2d37fda'
        )}
        description={translate(
          isEdition ? 'text_629728388c4d2300e2d37ffa' : 'text_629728388c4d2300e2d37ff4'
        )}
        continueText={translate(
          isEdition ? 'text_629728388c4d2300e2d3802d' : 'text_629728388c4d2300e2d38027'
        )}
        onContinue={() => navigate(ADD_ONS_ROUTE)}
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

export default CreateAddOn
