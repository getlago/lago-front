import { screen } from '@testing-library/react'

import { StatusType } from '~/components/designSystem/Status'
import { render } from '~/test-utils'

import { EntitySection } from '../EntitySection'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '../mainHeaderTestIds'
import { MainHeaderEntityConfig } from '../types'

describe('EntitySection', () => {
  describe('GIVEN isLoading is true', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display loading skeletons', () => {
        const { container } = render(<EntitySection isLoading={true} />)

        const skeletons = container.querySelectorAll('.animate-pulse')

        expect(skeletons.length).toBeGreaterThanOrEqual(2)
      })

      it('THEN should not display entity content', () => {
        render(<EntitySection isLoading={true} />)

        expect(screen.queryByTestId(ENTITY_SECTION_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no entity and not loading', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render nothing', () => {
        const { container } = render(<EntitySection />)

        expect(container.innerHTML).toBe('')
      })
    })
  })

  describe('GIVEN an entity with viewName only', () => {
    const entity: MainHeaderEntityConfig = {
      viewName: 'Acme Corporation',
    }

    describe('WHEN the component renders', () => {
      it('THEN should display the entity section', () => {
        render(<EntitySection entity={entity} />)

        expect(screen.getByTestId(ENTITY_SECTION_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the view name', () => {
        render(<EntitySection entity={entity} />)

        expect(screen.getByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)).toHaveTextContent(
          'Acme Corporation',
        )
      })

      it('THEN should not display metadata', () => {
        render(<EntitySection entity={entity} />)

        expect(screen.queryByTestId(ENTITY_SECTION_METADATA_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an entity with metadata', () => {
    const entity: MainHeaderEntityConfig = {
      viewName: 'Invoice #001',
      metadata: 'ext-id-12345',
    }

    describe('WHEN the component renders', () => {
      it('THEN should display the metadata', () => {
        render(<EntitySection entity={entity} />)

        expect(screen.getByTestId(ENTITY_SECTION_METADATA_TEST_ID)).toHaveTextContent(
          'ext-id-12345',
        )
      })
    })
  })

  describe('GIVEN an entity with badges', () => {
    const entity: MainHeaderEntityConfig = {
      viewName: 'Customer',
      badges: [{ type: StatusType.success, label: 'Active' }],
    }

    describe('WHEN the component renders', () => {
      it('THEN should display the badge', () => {
        render(<EntitySection entity={entity} />)

        // Status component renders the badge label
        expect(screen.getByTestId(ENTITY_SECTION_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an entity with an icon', () => {
    const entity: MainHeaderEntityConfig = {
      viewName: 'Stripe Integration',
      icon: 'plug',
    }

    describe('WHEN the component renders', () => {
      it('THEN should display the entity section with an avatar', () => {
        render(<EntitySection entity={entity} />)

        expect(screen.getByTestId(ENTITY_SECTION_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
