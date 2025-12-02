import { useRef } from 'react'

import { Button, Dialog, DialogRef, Tooltip, Typography } from '~/components'

export const PoppersSection = () => {
  const dialogRef = useRef<DialogRef>(null)

  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Poppers
      </Typography>

      <div className="flex flex-row gap-4">
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
      </div>
    </div>
  )
}
