/* eslint-disable no-console */
import { revalidateLogic } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import {
  useCentralizedDrawer,
  useSecondLevelDrawer,
  useThirdLevelDrawer,
} from '~/components/drawers/CentralizedDrawer'
import { useFormDrawer } from '~/components/drawers/FormDrawer'
import { DrawerResult } from '~/components/drawers/types'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'

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
        actions: <Button onClick={openThirdDrawer}>Open Drawer 3</Button>,
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
        actions: <Button onClick={openSecondDrawer}>Open Drawer 2</Button>,
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
// Example C — FormDrawer with TanStack Form (like FormDialog)
// ---------------------------------------------------------------------------

const EDIT_CUSTOMER_FORM_ID = 'edit-customer-form'

const editCustomerDefaultValues = {
  name: '',
  email: '',
}

const EditCustomerForm = withForm({
  defaultValues: editCustomerDefaultValues,
  render: function Render({ form }) {
    return (
      <div className="flex flex-col gap-4">
        <Typography>
          This drawer was opened via <code>useFormDrawer</code> with a TanStack Form, following the
          same pattern as <code>FormDialog</code>.
        </Typography>
        <form.AppField name="name">
          {(field) => <field.TextInputField label="Name" placeholder="Acme Corp" />}
        </form.AppField>
        <form.AppField name="email">
          {(field) => <field.TextInputField label="Email" placeholder="billing@acme.com" />}
        </form.AppField>
      </div>
    )
  },
})

const FormDrawerExample = () => {
  const formDrawer = useFormDrawer()
  const [result, setResult] = useState<DrawerResult | null>(null)

  const validationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
  })

  const form = useAppForm({
    defaultValues: editCustomerDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      // Simulate async save
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log('Customer saved:', value)
    },
  })

  const handleSubmit = async () => {
    await form.handleSubmit()
  }

  const handleOpen = () => {
    setResult(null)
    form.reset()
    formDrawer
      .open({
        title: 'Edit Customer',
        form: {
          id: EDIT_CUSTOMER_FORM_ID,
          submit: handleSubmit,
        },
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>Save</form.SubmitButton>
          </form.AppForm>
        ),
        children: <EditCustomerForm form={form} />,
      })
      .then((r) => {
        console.log('FormDrawer resolved:', r)
        setResult(r)
      })
      .catch((err) => console.log('FormDrawer rejected:', err))
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleOpen}>Open Form Drawer</Button>
      {result && (
        <Alert type="info">
          <Typography variant="captionCode">Resolved: {JSON.stringify(result)}</Typography>
        </Alert>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Example D — FormDrawer opened from a CentralizedDrawer
// ---------------------------------------------------------------------------

const EDIT_ITEM_FORM_ID = 'edit-item-form'

const editItemDefaultValues = {
  itemName: '',
  unitPrice: '',
}

const EditItemForm = withForm({
  defaultValues: editItemDefaultValues,
  render: function Render({ form }) {
    return (
      <div className="flex flex-col gap-4">
        <Typography>
          This <code>FormDrawer</code> was opened from a <code>CentralizedDrawer</code>. The first
          drawer is pushed back behind this one.
        </Typography>
        <form.AppField name="itemName">
          {(field) => <field.TextInputField label="Item name" placeholder="API calls" />}
        </form.AppField>
        <form.AppField name="unitPrice">
          {(field) => <field.TextInputField label="Unit price" placeholder="0.01" />}
        </form.AppField>
      </div>
    )
  },
})

const FormDrawerFromDrawerExample = () => {
  const drawer = useCentralizedDrawer()
  const formDrawer = useFormDrawer()
  const [events, setEvents] = useState<string[]>([])

  const addEvent = (message: string) => {
    setEvents((prev) => [...prev, message])
  }

  const validationSchema = z.object({
    itemName: z.string().min(1, 'Item name is required'),
    unitPrice: z.string().min(1, 'Unit price is required'),
  })

  const form = useAppForm({
    defaultValues: editItemDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log('Item saved:', value)
    },
  })

  const handleSubmit = async () => {
    await form.handleSubmit()
  }

  const openFormDrawer = () => {
    addEvent('FormDrawer opened from drawer')
    form.reset()
    formDrawer
      .open({
        title: 'Edit Item',
        form: {
          id: EDIT_ITEM_FORM_ID,
          submit: handleSubmit,
        },
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>Save</form.SubmitButton>
          </form.AppForm>
        ),
        children: <EditItemForm form={form} />,
      })
      .then((r) => addEvent(`FormDrawer closed → ${JSON.stringify(r)}`))
      .catch((err) => addEvent(`FormDrawer rejected → ${JSON.stringify(err)}`))
  }

  const handleOpen = () => {
    setEvents([])
    addEvent('CentralizedDrawer opened')
    drawer
      .open({
        title: 'Invoice Details',
        children: (
          <div className="flex flex-col gap-4">
            <Typography>
              This is a read-only drawer showing invoice details. Click the button in the bottom bar
              to open a <code>FormDrawer</code> on top for editing.
            </Typography>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex justify-between rounded-lg bg-grey-100 p-4">
                  <Typography variant="caption">Line item {i + 1}</Typography>
                  <Typography variant="caption" color="grey600">
                    ${((i + 1) * 12.5).toFixed(2)}
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        ),
        actions: <Button onClick={openFormDrawer}>Edit Item</Button>,
      })
      .then((r) => addEvent(`CentralizedDrawer closed → ${JSON.stringify(r)}`))
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleOpen}>Open Drawer → Form Drawer</Button>
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

      <Typography className="mb-4" variant="subhead1">
        Form drawer via <code>useFormDrawer</code>
      </Typography>
      <Typography className="mb-6" variant="body">
        A drawer with a native form wrapping content and sticky bottom bar, matching the{' '}
        <code>FormDialog</code> pattern.
      </Typography>
      <Block>
        <FormDrawerExample />
      </Block>

      <Typography className="mb-4" variant="subhead1">
        FormDrawer opened from a CentralizedDrawer
      </Typography>
      <Typography className="mb-6" variant="body">
        Opens a read-only drawer first, then a FormDrawer stacks on top for editing.
      </Typography>
      <Block>
        <FormDrawerFromDrawerExample />
      </Block>
    </Container>
  )
}

export default DrawerTest
