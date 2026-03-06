/* eslint-disable no-console */
import { useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import {
  useCentralizedDrawer,
  useSecondLevelDrawer,
  useThirdLevelDrawer,
} from '~/components/drawers/CentralizedDrawer'
import { DrawerResult } from '~/components/drawers/types'

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="px-12 pb-20 pt-8">{children}</div>
)

const Block = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-6 flex flex-wrap gap-4">{children}</div>
)

// ---------------------------------------------------------------------------
// Example A — useCentralizedDrawer (generic, like useCentralizedDialog)
// ---------------------------------------------------------------------------

const CentralizedDrawerExample = () => {
  const drawer = useCentralizedDrawer()
  const [result, setResult] = useState<DrawerResult | null>(null)

  const handleOpen = () => {
    setResult(null)
    drawer
      .open({
        title: 'Centralized Drawer',
        children: (
          <div className="flex flex-col gap-4">
            <Typography>
              This drawer was opened via <code>useCentralizedDrawer</code>, the same pattern as{' '}
              <code>useCentralizedDialog</code>.
            </Typography>
            <Typography>Close this drawer to see the resolved result below the button.</Typography>
          </div>
        ),
      })
      .then((r) => {
        console.log('CentralizedDrawer resolved:', r)
        setResult(r)
      })
      .catch((err) => console.log('CentralizedDrawer rejected:', err))
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleOpen}>Open Centralized Drawer</Button>
      {result && (
        <Alert type="info">
          <Typography variant="captionCode">Resolved: {JSON.stringify(result)}</Typography>
        </Alert>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Example B — Stacking drawers via level hooks
// ---------------------------------------------------------------------------

const StackingDrawerExample = () => {
  const firstDrawer = useCentralizedDrawer()
  const secondDrawer = useSecondLevelDrawer()
  const thirdDrawer = useThirdLevelDrawer()
  const [events, setEvents] = useState<string[]>([])

  const addEvent = (message: string) => {
    setEvents((prev) => [...prev, message])
  }

  const openThirdDrawer = () => {
    addEvent('Drawer 3 opened')
    thirdDrawer
      .open({
        title: 'Drawer 3 — Deepest',
        children: (
          <div className="flex flex-col gap-4">
            <Typography>
              This is the third level. The two drawers behind are pushed back.
            </Typography>
            <Typography variant="caption">
              Close this drawer to reveal the previous ones.
            </Typography>
          </div>
        ),
      })
      .then((r) => addEvent(`Drawer 3 closed → ${JSON.stringify(r)}`))
  }

  const openSecondDrawer = () => {
    addEvent('Drawer 2 opened')
    secondDrawer
      .open({
        title: 'Drawer 2 — Details',
        children: (
          <div className="flex flex-col gap-4">
            <Typography>
              This is the second drawer. Notice how the first drawer is pushed back, scaled down,
              and slightly dimmed behind this one.
            </Typography>
            <Typography>
              You can open a third drawer from the bottom bar to see deeper stacking.
            </Typography>
          </div>
        ),
        stickyBottomBar: <Button onClick={openThirdDrawer}>Open Drawer 3</Button>,
      })
      .then((r) => addEvent(`Drawer 2 closed → ${JSON.stringify(r)}`))
  }

  const openFirstDrawer = () => {
    setEvents([])
    addEvent('Drawer 1 opened')
    firstDrawer
      .open({
        title: 'Drawer 1 — Invoice',
        children: (
          <div className="flex flex-col gap-4">
            <Typography>
              This is the first drawer in the stack. Click the button in the bottom bar to open a
              second drawer on top.
            </Typography>
            <Typography>
              When a new drawer opens, this one will push back with a scale + translate effect (like
              Stripe).
            </Typography>
            {/* Tall content to demonstrate scrolling is preserved */}
            <div className="mt-8 flex flex-col gap-2">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="rounded-lg bg-grey-100 p-4">
                  <Typography variant="caption" color="grey600">
                    Row {i + 1} — scroll is preserved when pushed back
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        ),
        stickyBottomBar: <Button onClick={openSecondDrawer}>Open Drawer 2</Button>,
      })
      .then((r) => addEvent(`Drawer 1 closed → ${JSON.stringify(r)}`))
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={openFirstDrawer}>Open Stacking Drawers</Button>
      {events.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg bg-grey-100 p-4">
          <Typography variant="captionHl">Event log</Typography>
          {events.map((event, i) => (
            <Typography key={i} variant="captionCode">
              {event}
            </Typography>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab component
// ---------------------------------------------------------------------------

const DrawerTest = () => {
  return (
    <Container>
      <Typography className="mb-4" variant="headline">
        Drawers
      </Typography>

      <Typography className="mb-4" variant="subhead1">
        Generic drawer via <code>useCentralizedDrawer</code>
      </Typography>
      <Block>
        <CentralizedDrawerExample />
      </Block>

      <Typography className="mb-4" variant="subhead1">
        Stacking drawers (Stripe-style push-back)
      </Typography>
      <Typography className="mb-6" variant="body">
        Opens a drawer that can open another drawer on top, up to 3 levels deep. Each new drawer
        pushes the previous one back with scale + translateX.
      </Typography>
      <Block>
        <StackingDrawerExample />
      </Block>
    </Container>
  )
}

export default DrawerTest
