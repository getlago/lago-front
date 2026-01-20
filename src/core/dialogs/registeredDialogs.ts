import NiceModal from '@ebay/nice-modal-react'

import CentralizedDialog, { CENTRALIZED_DIALOG_NAME } from '~/components/dialogs/CentralizedDialog'
import DialogOpeningWarningDialog, {
  DIALOG_OPENING_WARNING_DIALOG_NAME,
} from '~/components/dialogs/DialogOpeningWarningDialog'
import PremiumWarningDialog, {
  PREMIUM_WARNING_DIALOG_NAME,
} from '~/components/dialogs/PremiumWarningDialog'
import WarningDialog, { WARNING_DIALOG_NAME } from '~/components/dialogs/WarningDialog'

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)
NiceModal.register(PREMIUM_WARNING_DIALOG_NAME, PremiumWarningDialog)
NiceModal.register(WARNING_DIALOG_NAME, WarningDialog)
NiceModal.register(DIALOG_OPENING_WARNING_DIALOG_NAME, DialogOpeningWarningDialog)
