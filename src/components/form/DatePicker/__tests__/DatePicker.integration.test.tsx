import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTime, Settings } from 'luxon'
import { useState } from 'react'

import { DatePicker } from '../DatePicker'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ organization: { id: 'org-1', timezone: 'TZ_UTC' } }),
}))

const ControlledPicker = ({
  initialValue,
  onPublish,
}: {
  initialValue: string
  onPublish: (value?: string | null) => void
}) => {
  const [value, setValue] = useState(initialValue)

  return (
    <DatePicker
      name="date"
      defaultZone="UTC"
      value={value}
      onChange={(next) => {
        onPublish(next)
        setValue(next ?? '')
      }}
    />
  )
}

const openCalendarAndPickDay = async (day: string): Promise<void> => {
  const user = userEvent.setup()

  const openButton = document.querySelector('.open-picker-tooltip button') as HTMLElement

  await user.click(openButton)
  await user.click(await screen.findByRole('gridcell', { name: day }))
}

describe('DatePicker integration', () => {
  const originalDefaultZone = Settings.defaultZone

  afterEach(() => {
    Settings.defaultZone = originalDefaultZone
  })

  // Regression: the picker only switched to `defaultZone` from an effect, so the
  // calendar was built in the ambient zone and carried its local time-of-day onto
  // the clicked day, publishing the previous UTC day (one-off invoice billing period).
  describe.each([
    ['ahead of UTC', 'Europe/Paris', '2026-09-09T22:00:00.000Z'],
    ['behind UTC', 'America/New_York', '2026-09-10T00:00:00.000Z'],
  ])('GIVEN an ambient zone %s and a value whose local day differs', (_, zone, initialValue) => {
    describe('WHEN a day is picked in the calendar', () => {
      it('THEN should publish that calendar day in the declared zone', async () => {
        const onPublish = jest.fn()

        Settings.defaultZone = zone

        render(<ControlledPicker initialValue={initialValue} onPublish={onPublish} />)
        await openCalendarAndPickDay('17')

        const published = onPublish.mock.calls[0][0] as string

        expect(DateTime.fromISO(published, { zone: 'UTC' }).toISODate()).toBe('2026-09-17')
      })
    })
  })
})
