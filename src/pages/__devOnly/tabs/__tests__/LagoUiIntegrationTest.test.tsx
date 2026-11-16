import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { render } from '~/test-utils'

import {
  LAGO_UI_INTEGRATION_COUNT_TEST_ID,
  LAGO_UI_INTEGRATION_INCREMENT_BUTTON_TEST_ID,
  LAGO_UI_INTEGRATION_NOTE_INPUT_TEST_ID,
  lagoUiIntegrationTab,
  LagoUiIntegrationTest,
} from '../LagoUiIntegrationTest'

describe('LagoUiIntegrationTest', () => {
  describe('GIVEN the tab is rendered', () => {
    describe('WHEN nothing has been clicked yet', () => {
      it('THEN should render the lago-ui Button and Badge with a zero count', () => {
        render(<LagoUiIntegrationTest />)

        expect(screen.getByTestId(LAGO_UI_INTEGRATION_INCREMENT_BUTTON_TEST_ID)).toBeEnabled()
        expect(screen.getByTestId(LAGO_UI_INTEGRATION_COUNT_TEST_ID)).toHaveTextContent('Count: 0')
      })
    })

    describe('WHEN the lago-ui Button is clicked twice', () => {
      it('THEN should increment the counter shown in the Badge', async () => {
        const user = userEvent.setup()

        render(<LagoUiIntegrationTest />)

        await user.click(screen.getByTestId(LAGO_UI_INTEGRATION_INCREMENT_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(LAGO_UI_INTEGRATION_INCREMENT_BUTTON_TEST_ID))

        expect(screen.getByTestId(LAGO_UI_INTEGRATION_COUNT_TEST_ID)).toHaveTextContent('Count: 2')
      })
    })

    describe('WHEN typing in the note input after incrementing', () => {
      it('THEN should keep both the typed note and the count', async () => {
        const user = userEvent.setup()

        render(<LagoUiIntegrationTest />)

        await user.click(screen.getByTestId(LAGO_UI_INTEGRATION_INCREMENT_BUTTON_TEST_ID))

        const input = screen
          .getByTestId(LAGO_UI_INTEGRATION_NOTE_INPUT_TEST_ID)
          .querySelector('input') as HTMLInputElement

        await user.type(input, 'hot reload')

        expect(input).toHaveValue('hot reload')
        expect(screen.getByTestId(LAGO_UI_INTEGRATION_COUNT_TEST_ID)).toHaveTextContent('Count: 1')
      })
    })
  })

  describe('GIVEN the tab is registered in a NavigationTab', () => {
    describe('WHEN its URL is opened directly', () => {
      it('THEN should select the lago-ui integration panel', () => {
        window.history.pushState({}, '', lagoUiIntegrationTab.link)

        render(
          <NavigationTab
            tabs={[
              { title: 'Other', link: '/design-system/other', component: <div>Other panel</div> },
              lagoUiIntegrationTab,
            ]}
          />,
        )

        expect(screen.getByRole('tab', { name: 'lago-ui integration' })).toHaveAttribute(
          'aria-selected',
          'true',
        )
        expect(screen.getByTestId(LAGO_UI_INTEGRATION_INCREMENT_BUTTON_TEST_ID)).toBeVisible()
        expect(screen.queryByText('Other panel')).not.toBeInTheDocument()
      })
    })
  })
})
