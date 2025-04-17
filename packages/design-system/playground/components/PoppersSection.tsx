import { useRef } from 'react'

import { Button, Dialog, DialogRef, Drawer, Popper, Tooltip, Typography } from '~/components'

export const PoppersSection = () => {
  const dialogRef = useRef<DialogRef>(null)

  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Poppers
      </Typography>

      <div className="flex flex-row gap-4">
        <Drawer title="Imma supa drawa" opener={<Button>Drawer</Button>}>
          <iframe
            title="hey you"
            src="https://giphy.com/embed/nNxT5qXR02FOM"
            width="480"
            height="399"
            allowFullScreen
          ></iframe>
        </Drawer>

        <Drawer
          title="Imma supa drawa"
          opener={<Button variant="tertiary">Drawer close with warning</Button>}
          showCloseWarningDialog
        >
          <iframe
            title="hey you"
            src="https://giphy.com/embed/nNxT5qXR02FOM"
            width="480"
            height="399"
            allowFullScreen
          ></iframe>
        </Drawer>

        <Button onClick={() => dialogRef.current?.openDialog()}>Dialog</Button>
        <Dialog
          ref={dialogRef}
          title="Imma dialog"
          description="And I'm happy to see you"
          actions={({ closeDialog }) => (
            <>
              <Button variant="quaternary" onClick={() => closeDialog()}>
                Oups
              </Button>
              <Button onClick={() => closeDialog()}>Ok bye</Button>
            </>
          )}
        >
          <Typography className="mb-4">
            <iframe
              title="Happy to see you"
              src="https://giphy.com/embed/l2Jhok92mZ2PZHjDG"
              width="480"
              height="256"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </Typography>
        </Dialog>

        <Tooltip placement="top-end" title="Hola muchacho 🥸!">
          <Button variant="secondary">Tooltip</Button>
        </Tooltip>

        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={<Button variant="tertiary">Popper</Button>}
        >
          {({ closePopper }) => (
            <div className="flex flex-col gap-1 p-2">
              <Button startIcon="paperclip" variant="quaternary" align="left" fullWidth>
                I&apos;m lazy
              </Button>
              <Button
                startIcon="plug"
                variant="quaternary"
                align="left"
                fullWidth
                onClick={() => closePopper()}
              >
                I close the popper
              </Button>
            </div>
          )}
        </Popper>
      </div>
    </div>
  )
}
