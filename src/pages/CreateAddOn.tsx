import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCreateEditAddOn } from '~/hooks/useCreateEditAddOn'
import { PageHeader } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, Button } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { ADD_ONS_ROUTE } from '~/core/router'
import { AddOnForm } from '~/components/addOns/AddOnForm'

const CreateAddOn = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { isEdition, loading, addOn, onSave } = useCreateEditAddOn()
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
          onClick={() => warningDialogRef.current?.openDialog()}
        />
      </PageHeader>

      <AddOnForm loading={loading} addOn={addOn} onSave={onSave} isEdition={isEdition} />

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

export default CreateAddOn
