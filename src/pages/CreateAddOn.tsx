import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { useCreateEditAddOn } from '~/hooks/useCreateEditAddOn'
import { theme, PageHeader, Card } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, Button, ButtonLink } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import SuccessImage from '~/public/images/maneki/success.svg'
import { ADD_ONS_ROUTE } from '~/core/router'
import { AddOnForm } from '~/components/addOns/AddOnForm'

const CreateAddOn = () => {
  const { translate } = useInternationalization()
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
        <SuccessCard $disableChildSpacing>
          <SuccessImage width="136" height="104" />
          <SuccessTitle variant="subhead">
            {translate('text_629728388c4d2300e2d37fd8')}
          </SuccessTitle>
          <SuccessDescription>{translate('text_629728388c4d2300e2d37ff2')}</SuccessDescription>
          <div>
            <Button variant="secondary" onClick={resetIsCreated}>
              {translate('text_629728388c4d2300e2d3800c')}
            </Button>
            <ButtonLink type="button" to={ADD_ONS_ROUTE} buttonProps={{ variant: 'secondary' }}>
              {translate('text_629728388c4d2300e2d38026')}
            </ButtonLink>
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
