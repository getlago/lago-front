import { Button, Typography } from '~/components/designSystem'
import {
  CentralizedDialogProps,
  useCentralizedDialog,
} from '~/components/dialogs/CentralizedDialog'
import {
  DialogOpeningWarningDialogProps,
  useDialogOpeningWarningDialog,
} from '~/components/dialogs/DialogOpeningWarningDialog'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { HookDialogReturnType } from '~/components/dialogs/types'
import { useWarningDialog } from '~/components/dialogs/WarningDialog'
import { TextInput } from '~/components/form'

const ModalTestActions = ({
  modal,
}: {
  modal:
    | HookDialogReturnType<CentralizedDialogProps>
    | HookDialogReturnType<DialogOpeningWarningDialogProps>
}) => {
  const handleClose = (): void => {
    modal.reject()
    modal.close()
  }

  const handleSuccess = (): void => {
    modal.resolve()
    modal.close()
  }

  return (
    <>
      <Button variant="quaternary" onClick={handleClose}>
        Close
      </Button>
      <Button onClick={handleSuccess}>Success</Button>
    </>
  )
}

const LongModalHeaderContent = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-4">
        <Typography>To</Typography>
        <TextInput />
      </div>
      <div className="flex flex-row gap-4">
        <Typography>Cc</Typography>
        <TextInput />
      </div>
      <div className="flex flex-row gap-4">
        <Typography>Bcc</Typography>
        <TextInput />
      </div>
      <div className="flex flex-row gap-4">
        <Typography>Subject</Typography>
        <TextInput />
      </div>
    </div>
  )
}

const LongModalContent = () => <div className="h-[600px] py-8 text-center">Email content</div>

const ModalTest = (): JSX.Element => {
  const modal = useCentralizedDialog()
  const premiumWarningModal = usePremiumWarningDialog()
  const warningModal = useWarningDialog()
  const dialogOpeningWarningModal = useDialogOpeningWarningDialog()

  const handleCentralizedClick = (): void => {
    modal.open({
      title: 'Test Modal',
      children: 'This is a test modal opened from the ModalTest page.',
      actions: <ModalTestActions modal={modal} />,
    })
  }

  const handleWarningClick = (): void => {
    warningModal.open({
      title: 'Delete Item',
      children: 'Are you sure you want to delete this item? This action cannot be undone.',
      continueText: 'Delete',
      mode: 'danger',
      onContinue: async () => {
        // Simulate async action
        await new Promise((resolve) => setTimeout(resolve, 500))
      },
    })
  }

  const handleWarningInfoClick = (): void => {
    warningModal.open({
      title: 'Confirm Action',
      children: 'This will update your settings.',
      continueText: 'Confirm',
      mode: 'info',
      onContinue: () => {
        // Action confirmed
      },
    })
  }

  const handleWarningInfoWithDescriptionClick = (): void => {
    warningModal.open({
      title: 'Confirm Action',
      description: 'This will update your settings.',
      continueText: 'Confirm',
      mode: 'info',
      onContinue: () => {
        // Action confirmed
      },
    })
  }

  const handleDialogOpeningWarningDialog = (): void => {
    dialogOpeningWarningModal.open({
      title: 'Will open another Dialog',
      children: 'This dialog warns about opening another dialog.',
      actions: <ModalTestActions modal={dialogOpeningWarningModal} />,
      canOpenWarningDialog: true,
      openWarningDialogText: 'Open Warning Dialog',
      warningDialogProps: {
        title: 'Delete Item',
        children: 'Are you sure you want to delete this item? This action cannot be undone.',
        continueText: 'Delete',
        mode: 'danger',
        onContinue: async () => {
          // Simulate async action
          await new Promise((resolve) => setTimeout(resolve, 500))
        },
      },
    })
  }

  const handleDialogOpeningWarningWithDescriptionDialog = (): void => {
    dialogOpeningWarningModal.open({
      title: 'Will open another Dialog',
      description: 'This dialog warns about opening another dialog.',
      actions: <ModalTestActions modal={dialogOpeningWarningModal} />,
      canOpenWarningDialog: true,
      openWarningDialogText: 'Open Warning Dialog',
      warningDialogProps: {
        title: 'Delete Item',
        description: 'Are you sure you want to delete this item? This action cannot be undone.',
        continueText: 'Delete',
        mode: 'danger',
        onContinue: async () => {
          // Simulate async action
          await new Promise((resolve) => setTimeout(resolve, 500))
        },
      },
    })
  }

  const handleOpenLongDialog = (): void => {
    modal.open({
      title: 'Test Modal',
      headerContent: <LongModalHeaderContent />,
      children: <LongModalContent />,
      actions: <ModalTestActions modal={modal} />,
    })
  }
  const handleOpenLongDialogWithDescription = (): void => {
    modal.open({
      title: 'Test Modal',
      description: 'This is a description for the long modal.',
      headerContent: <LongModalHeaderContent />,
      children: <LongModalContent />,
      actions: <ModalTestActions modal={modal} />,
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>Modal Test Page</div>
      <Button onClick={handleCentralizedClick}>Open Centralized Modal</Button>
      <Button onClick={() => premiumWarningModal.open()}>Open Premium Warning Modal</Button>
      <Button onClick={handleWarningClick}>Open Warning Dialog WITH CONTENT (Danger)</Button>
      <Button onClick={handleWarningInfoClick}>Open Warning Dialog WITH CONTENT (Info)</Button>
      <Button onClick={handleWarningInfoWithDescriptionClick} variant="tertiary">
        Open Warning Dialog WITH DESCRIPTION (Info)
      </Button>
      <Button onClick={handleDialogOpeningWarningDialog}>
        Open Dialog Opening Warning Dialog WITH CONTENT
      </Button>
      <Button onClick={handleDialogOpeningWarningWithDescriptionDialog} variant="tertiary">
        Open Dialog Opening Warning Dialog WITH DESCRIPTION
      </Button>
      <Button onClick={handleOpenLongDialog}>Open Long Dialog</Button>
      <Button onClick={handleOpenLongDialogWithDescription} variant="tertiary">
        Open Long Dialog WITH DESCRIPTION
      </Button>
    </div>
  )
}

export default ModalTest
