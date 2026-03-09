import NiceModal from '@ebay/nice-modal-react'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_NAME,
  DIALOG_OPENING_DIALOG_NAME,
  FORM_DIALOG_NAME,
  FORM_DIALOG_OPENING_DIALOG_NAME,
  PREMIUM_WARNING_DIALOG_NAME,
} from '~/components/dialogs/const'
import DialogOpeningDialog from '~/components/dialogs/DialogOpeningDialog'
import FormDialog from '~/components/dialogs/FormDialog'
import FormDialogOpeningDialog from '~/components/dialogs/FormDialogOpeningDialog'
import PremiumWarningDialog from '~/components/dialogs/PremiumWarningDialog'
import CentralizedDrawer from '~/components/drawers/CentralizedDrawer'
import {
  CENTRALIZED_DRAWER_NAME,
  FORM_DRAWER_NAME,
  SECOND_LEVEL_DRAWER_NAME,
  THIRD_LEVEL_DRAWER_NAME,
} from '~/components/drawers/const'
import FormDrawer from '~/components/drawers/FormDrawer'

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)
NiceModal.register(PREMIUM_WARNING_DIALOG_NAME, PremiumWarningDialog)
NiceModal.register(DIALOG_OPENING_DIALOG_NAME, DialogOpeningDialog)
NiceModal.register(FORM_DIALOG_NAME, FormDialog)
NiceModal.register(FORM_DIALOG_OPENING_DIALOG_NAME, FormDialogOpeningDialog)
NiceModal.register(CENTRALIZED_DRAWER_NAME, CentralizedDrawer)
NiceModal.register(SECOND_LEVEL_DRAWER_NAME, CentralizedDrawer)
NiceModal.register(THIRD_LEVEL_DRAWER_NAME, CentralizedDrawer)
NiceModal.register(FORM_DRAWER_NAME, FormDrawer)
