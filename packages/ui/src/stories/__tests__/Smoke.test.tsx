import { render, screen } from '@testing-library/react'

import meta from '../Smoke.stories'

describe('Smoke story', () => {
  describe('GIVEN the smoke component', () => {
    describe('WHEN it renders', () => {
      it('THEN should display its content', () => {
        const Smoke = meta.component

        render(<Smoke />)

        expect(screen.getByText('lago-ui renders with Tailwind')).toBeInTheDocument()
      })
    })
  })
})
