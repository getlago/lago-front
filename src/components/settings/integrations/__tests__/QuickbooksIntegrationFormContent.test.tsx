import { screen } from '@testing-library/react'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { DEFAULT_QUICKBOOKS_FORM_VALUES } from '../quickbooksIntegrationForm'
import { QuickbooksIntegrationFormContent } from '../QuickbooksIntegrationFormContent'

// Identity translate so rows are asserted by their message keys.
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const SYNC_OBJECT_KEYS = [
  'text_661ff6e56ef7e1b7c542b2a6',
  'text_661ff6e56ef7e1b7c542b2c2',
  'text_661ff6e56ef7e1b7c542b2d7',
  'text_661ff6e56ef7e1b7c542b2e9',
  'text_661ff6e56ef7e1b7c542b2ff',
  'text_661ff6e56ef7e1b7c542b311',
]

const Host = ({ isEdition }: { isEdition: boolean }) => {
  const form = useAppForm({ defaultValues: DEFAULT_QUICKBOOKS_FORM_VALUES })

  return <QuickbooksIntegrationFormContent form={form} isEdition={isEdition} />
}

const sandboxSwitch = () => screen.getByRole('checkbox', { name: 'sandbox' })

describe('QuickbooksIntegrationFormContent', () => {
  it('THEN lists every synced object', () => {
    render(<Host isEdition={false} />)

    SYNC_OBJECT_KEYS.forEach((objectKey) => expect(screen.getByText(objectKey)).toBeInTheDocument())
  })

  it('THEN lets a new connection choose its environment', () => {
    render(<Host isEdition={false} />)

    expect(sandboxSwitch()).not.toBeDisabled()
  })

  it('THEN locks the environment of an existing connection', () => {
    render(<Host isEdition />)

    expect(sandboxSwitch()).toBeDisabled()
  })
})
