import { fireEvent, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'

import { filterDataInlineSeparator } from '~/components/Filters/presentation/types'
import {
  AdminActionEnum,
  AdminFeatureTypeEnum,
  GetAdminOrganizationsForFilterItemDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { escapeFilterLabel } from '../../utils'
import { FiltersItemAdminActions } from '../FiltersItemAdminActions'
import { FiltersItemAdminOrganizations } from '../FiltersItemAdminOrganizations'
import { FiltersItemFeatureType } from '../FiltersItemFeatureType'

jest.mock('~/components/form', () => {
  const actual = jest.requireActual<typeof import('~/components/form')>('~/components/form')

  return {
    ...actual,
    ComboBox: (props: ComponentProps<typeof actual.ComboBox>) => (
      <actual.ComboBox {...props} virtualized={false} />
    ),
    MultipleComboBox: (props: ComponentProps<typeof actual.MultipleComboBox>) => (
      <actual.MultipleComboBox {...props} virtualized={false} />
    ),
  }
})

jest.mock('~/components/Filters/presentation/context', () => ({
  useFilterContext: () => ({ displayInDialog: false }),
}))

describe('Admin audit filters', () => {
  it('serializes multiple audit actions', async () => {
    const setFilterValue = jest.fn()

    render(
      <FiltersItemAdminActions value={AdminActionEnum.ToggleOn} setFilterValue={setFilterValue} />,
    )
    expect(screen.getByText('Toggle on')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByRole('option', { name: 'Toggle off' }))
    expect(setFilterValue).toHaveBeenCalledWith('toggle_on,toggle_off')
  })

  it('selects the feature type accepted by the API', async () => {
    const setFilterValue = jest.fn()

    render(<FiltersItemFeatureType value={undefined} setFilterValue={setFilterValue} />)
    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('Feature flag'))
    expect(setFilterValue).toHaveBeenCalledWith(AdminFeatureTypeEnum.FeatureFlag)
  })

  it('preserves organization labels containing filter delimiters', async () => {
    const setFilterValue = jest.fn()
    const label = 'Acme, Inc.'

    render(<FiltersItemAdminOrganizations value={undefined} setFilterValue={setFilterValue} />, {
      mocks: [
        {
          request: { query: GetAdminOrganizationsForFilterItemDocument, variables: { limit: 500 } },
          result: { data: { adminOrganizations: { collection: [{ id: 'org', name: label }] } } },
        },
      ],
    })
    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByRole('option', { name: label }))
    expect(setFilterValue).toHaveBeenCalledWith(
      `org${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
    )
  })
})
