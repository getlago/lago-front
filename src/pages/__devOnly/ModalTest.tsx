import { Button, Typography } from '~/components/designSystem'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { useDialogOpeningWarningDialog } from '~/components/dialogs/DialogOpeningWarningDialog'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { useWarningDialog } from '~/components/dialogs/WarningDialog'
import { TextInput } from '~/components/form'

const ModalTestActions = ({ onClose, onAction }: { onClose: () => void; onAction: () => void }) => {
  return (
    <>
      <Button variant="quaternary" onClick={onClose}>
        Close
      </Button>
      <Button onClick={onAction}>Success</Button>
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
    modal
      .open({
        title: 'Test Modal',
        children: 'This is a test modal opened from the ModalTest page.',
        actions: (
          <ModalTestActions
            onClose={() => modal.close()}
            onAction={() =>
              modal.execute(() => ({
                reason: 'success',
              }))
            }
          />
        ),
      })
      .then((params) => {
        /* TODO: Remove this line */
        // eslint-disable-next-line no-console
        console.log('success', params)
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
      onContinue: async () => {
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
      onContinue: async () => {
        // Action confirmed
      },
    })
  }

  const handleDialogOpeningWarningDialog = (): void => {
    dialogOpeningWarningModal.open({
      title: 'Will open another Dialog',
      children: 'This dialog warns about opening another dialog.',
      actions: (
        <ModalTestActions
          onClose={() => modal.close()}
          onAction={() =>
            modal.execute(() => ({
              reason: 'success',
            }))
          }
        />
      ),
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
      actions: (
        <ModalTestActions
          onClose={() => modal.close()}
          onAction={() =>
            modal.execute(() => ({
              reason: 'success',
            }))
          }
        />
      ),
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
      actions: (
        <ModalTestActions
          onClose={() => modal.close()}
          onAction={() =>
            modal.execute(() => ({
              reason: 'success',
            }))
          }
        />
      ),
    })
  }
  const handleOpenLongDialogWithDescription = (): void => {
    modal.open({
      title: 'Test Modal',
      description: 'This is a description for the long modal.',
      headerContent: <LongModalHeaderContent />,
      children: <LongModalContent />,
      actions: (
        <ModalTestActions
          onClose={() => modal.close()}
          onAction={() =>
            modal.execute(() => ({
              reason: 'success',
            }))
          }
        />
      ),
    })
  }
  const handleExampleOfError = (): void => {
    modal
      .open({
        title: 'Test Modal',
        description: 'This is a description for the long modal.',
        headerContent: <LongModalHeaderContent />,
        children: <LongModalContent />,
        actions: (
          <ModalTestActions
            onClose={() => modal.close()}
            onAction={() =>
              modal.execute(() => {
                throw new Error('hey')
              })
            }
          />
        ),
      })
      .catch((e) => {
        /* TODO: Remove this line */
        // eslint-disable-next-line no-console
        console.log('error', e)
      })
  }

  const handleRandomErrorSuccess = (): void => {
    modal
      .open({
        title: 'Test Modal',
        description: 'This is a description for the long modal.',
        headerContent: <LongModalHeaderContent />,
        children: <LongModalContent />,
        actions: (
          <ModalTestActions
            onClose={() => modal.close()}
            onAction={() =>
              modal.execute(() => {
                if (Math.round(Math.random()) > 0) {
                  throw new Error('hey')
                }

                return {
                  reason: 'success',
                  params: 'lol',
                }
              })
            }
          />
        ),
      })
      .then((p) => {
        /* TODO: Remove this line */
        // eslint-disable-next-line no-console
        console.log('success', p)
      })
      .catch((e) => {
        /* TODO: Remove this line */
        // eslint-disable-next-line no-console
        console.log('error', e)
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
      <Button onClick={handleExampleOfError}>Open Error Example</Button>
      <Button onClick={handleRandomErrorSuccess}>Open Random Example</Button>
    </div>
  )
}

export default ModalTest
