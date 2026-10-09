import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { IntegrationMapItemDrawerContent } from '../IntegrationMapItemDrawerContent'

const BILLING_ENTITIES = [
  { id: null, key: 'default', name: 'Default' },
  { id: 'be-1', key: 'be-1', name: 'Entity One' },
  { id: 'be-2', key: 'be-2', name: 'Entity Two' },
]

const mockRenderForm = jest.fn((billingEntityKey: string) => (
  <div data-test={`form-${billingEntityKey}`}>Form for {billingEntityKey}</div>
))

const prepare = () =>
  render(
    <IntegrationMapItemDrawerContent
      title="Map Test Metric"
      description="Select the external account for this metric"
      billingEntities={BILLING_ENTITIES}
      renderForm={mockRenderForm}
    />,
  )

describe('IntegrationMapItemDrawerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the content is rendered with billing entities', () => {
    describe('WHEN it mounts', () => {
      it('THEN should display the title and description', () => {
        prepare()

        expect(screen.getByText('Map Test Metric')).toBeInTheDocument()
        expect(screen.getByText('Select the external account for this metric')).toBeInTheDocument()
      })

      it('THEN should render the default form section', () => {
        prepare()

        expect(screen.getByTestId('form-default')).toBeInTheDocument()
      })

      it('THEN should render one tab per non-default billing entity', () => {
        prepare()

        expect(screen.getByText('Entity One')).toBeInTheDocument()
        expect(screen.getByText('Entity Two')).toBeInTheDocument()
        expect(screen.getAllByRole('tab')).toHaveLength(2)
      })

      it('THEN should only render the first billing entity tab panel', () => {
        prepare()

        expect(screen.getByTestId('form-be-1')).toBeInTheDocument()
        expect(screen.queryByTestId('form-be-2')).not.toBeInTheDocument()
        expect(mockRenderForm.mock.calls.map(([key]) => key)).toEqual(['default', 'be-1'])
      })

      it('THEN should match snapshot', () => {
        const { container } = prepare()

        expect(container).toMatchSnapshot()
      })
    })

    describe('WHEN clicking another billing entity tab', () => {
      it('THEN should switch the rendered tab panel', async () => {
        const user = userEvent.setup()

        prepare()

        await user.click(screen.getByText('Entity Two'))

        expect(screen.getByTestId('form-be-2')).toBeInTheDocument()
        expect(screen.queryByTestId('form-be-1')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN only the default billing entity', () => {
    describe('WHEN it mounts', () => {
      it('THEN should render the default form and no tab', () => {
        render(
          <IntegrationMapItemDrawerContent
            title="Title"
            description="Description"
            billingEntities={[BILLING_ENTITIES[0]]}
            renderForm={mockRenderForm}
          />,
        )

        expect(screen.getByTestId('form-default')).toBeInTheDocument()
        expect(screen.queryAllByRole('tab')).toHaveLength(0)
      })
    })
  })
})
