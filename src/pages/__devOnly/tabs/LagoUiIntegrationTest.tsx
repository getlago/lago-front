import { Badge } from 'lago-ui/badge'
import { Button } from 'lago-ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'lago-ui/tooltip'
import { useState } from 'react'
import { generatePath } from 'react-router'

import { Typography } from '~/components/designSystem/Typography'
import { TextInput } from '~/components/form'
import { ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'

export const LAGO_UI_INTEGRATION_INCREMENT_BUTTON_TEST_ID = 'lago-ui-integration-increment-button'
export const LAGO_UI_INTEGRATION_COUNT_TEST_ID = 'lago-ui-integration-count'
export const LAGO_UI_INTEGRATION_NOTE_INPUT_TEST_ID = 'lago-ui-integration-note-input'

export const LagoUiIntegrationTest = (): JSX.Element => {
  const [count, setCount] = useState(0)
  const [note, setNote] = useState('')

  return (
    <TooltipProvider>
      <section aria-label="lago-ui integration" className="flex max-w-md flex-col gap-6">
        <Typography variant="headline">lago-ui integration</Typography>
        <Typography>
          Reference consumer of lago-ui in the app. The showcase lives in Storybook.
        </Typography>
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-test={LAGO_UI_INTEGRATION_INCREMENT_BUTTON_TEST_ID}
                onClick={() => setCount((n) => n + 1)}
              >
                Increment
              </Button>
            </TooltipTrigger>
            <TooltipContent>Adds one to the counter</TooltipContent>
          </Tooltip>
          <Badge variant="info" role="status" data-test={LAGO_UI_INTEGRATION_COUNT_TEST_ID}>
            {`Count: ${count}`}
          </Badge>
        </div>
        <TextInput
          name="lagoUiNote"
          label="Note"
          value={note}
          onChange={setNote}
          data-test={LAGO_UI_INTEGRATION_NOTE_INPUT_TEST_ID}
        />
      </section>
    </TooltipProvider>
  )
}

export const lagoUiIntegrationTab = {
  title: 'lago-ui integration',
  link: generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'lago-ui-integration' }),
  component: (
    <div className="px-12 pb-20 pt-8">
      <LagoUiIntegrationTest />
    </div>
  ),
}
