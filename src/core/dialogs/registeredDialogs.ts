import NiceModal from '@ebay/nice-modal-react'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_NAME,
  DIALOG_OPENING_WARNING_DIALOG_NAME,
  PREMIUM_WARNING_DIALOG_NAME,
  WARNING_DIALOG_NAME,
} from '~/components/dialogs/const'
import DialogOpeningWarningDialog from '~/components/dialogs/DialogOpeningWarningDialog'
import PremiumWarningDialog from '~/components/dialogs/PremiumWarningDialog'
import WarningDialog from '~/components/dialogs/WarningDialog'

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)
NiceModal.register(PREMIUM_WARNING_DIALOG_NAME, PremiumWarningDialog)
NiceModal.register(WARNING_DIALOG_NAME, WarningDialog)
NiceModal.register(DIALOG_OPENING_WARNING_DIALOG_NAME, DialogOpeningWarningDialog)
