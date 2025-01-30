// NOTE: There is an issue with the Luxon 't' format
// It appeat to add a weird space between the time and the AM/PM
// Leading to not being able to test the text content exactly via test
// Letting the code here for now, but will need to retry later
import { act, cleanup, renderHook, screen } from '@testing-library/react'
import { DateTime } from 'luxon'

import {
  SubscriptionDatesOffsetHelperComponent,
  SubscriptionDatesOffsetHelperComponentProps,
} from '~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent'
import { GetOrganizationInfosDocument, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { render } from '~/test-utils'

const DATA_TEST_ID = 'subscription-dates-offset-helper-component'
// const DEFAULT_SUBSCRIPTION_AT_NOW = DateTime.now().toISO() as string
// const DEFAULT_SUBSCRIPTION_AT_TOMORROW = DateTime.now().plus({ day: 1 }).toISO() as string
// const DEFAULT_SUBSCRIPTION_AT_YESTERDAY = DateTime.now().minus({ day: 1 }).toISO() as string
// const DEFAULT_ENDING_AT = DateTime.now().plus({ month: 1 }).toISO() as string

type PrepareType = SubscriptionDatesOffsetHelperComponentProps & {
  organizationTimezone?: TimezoneEnum
}

async function prepare(
  { customerTimezone, subscriptionAt, endingAt, organizationTimezone }: PrepareType = {
    customerTimezone: TimezoneEnum.TzUtc,
    subscriptionAt: DateTime.now().toISO() as string,
  },
) {
  const { result } = renderHook(() => useInternationalization())

  const mocks = [
    {
      request: {
        query: GetOrganizationInfosDocument,
      },
      result: {
        data: {
          organization: {
            id: '1234',
            name: 'Organization Name',
            timezone: organizationTimezone || TimezoneEnum.TzUtc,
          },
        },
      },
    },
  ]

  await act(() =>
    render(
      <SubscriptionDatesOffsetHelperComponent
        customerTimezone={customerTimezone}
        subscriptionAt={subscriptionAt}
        endingAt={endingAt}
      />,
      {
        mocks,
      },
    ),
  )

  return { translate: result.current.translate }
}

describe('SubscriptionDatesOffsetHelperComponent', () => {
  afterEach(cleanup)

  it('renders', async () => {
    await prepare()

    expect(screen.getByTestId(DATA_TEST_ID)).toBeInTheDocument()
  })

  // describe('with Organization in UTC', () => {
  //   describe('with only subscriptionAt', () => {
  //     it('should should display text for current date', async () => {
  //       const { translate } = await prepare({
  //         organizationTimezone: TimezoneEnum.TzUtc,
  //         subscriptionAt: DEFAULT_SUBSCRIPTION_AT_NOW,
  //       })

  //       expect(screen.getByTestId(DATA_TEST_ID)).toHaveTextContent(
  //         'The subscription will start on Aug. 31, 2023 at 3:29 PM UTC ±0:00 for your customer. It won’t end until you manually terminate it.'
  //       )
  //     })
  //     it('should should display text for future date', async () => {})
  //     it('should should display text for past date', async () => {})
  //   })
  //   describe('with only endingAt', () => {
  //     it('should should display text', async () => {})
  //   })
  //   describe('with both subscriptionAt and endingAt', () => {
  //     it('should should display text', async () => {})
  //   })

  //   describe('with Customer in positive UTC', () => {
  //     describe('with only subscriptionAt', () => {
  //       it('should should display text for current date', async () => {})
  //       it('should should display text for future date', async () => {})
  //       it('should should display text for past date', async () => {})
  //     })
  //     describe('with only endingAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //     describe('with both subscriptionAt and endingAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //   })

  //   describe('with Customer in negative UTC', () => {
  //     describe('with only subscriptionAt', () => {
  //       it('should should display text for current date', async () => {})
  //       it('should should display text for future date', async () => {})
  //       it('should should display text for past date', async () => {})
  //     })
  //     describe('with only endingAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //     describe('with both subscriptionAt and endingAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //   })
  // })

  // describe('with Customer in UTC', () => {
  //   describe('with only subscriptionAt', () => {
  //     it('should should display text', async () => {})
  //   })
  //   describe('with only endingAt', () => {
  //     it('should should display text', async () => {})
  //   })
  //   describe('with both subscriptionAt and endingAt', () => {
  //     it('should should display text', async () => {})
  //   })

  //   describe('with Organization in positive UTC', () => {
  //     describe('with only subscriptionAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //     describe('with only endingAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //     describe('with both subscriptionAt and endingAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //   })

  //   describe('with Organization in negative UTC', () => {
  //     describe('with only subscriptionAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //     describe('with only endingAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //     describe('with both subscriptionAt and endingAt', () => {
  //       it('should should display text', async () => {})
  //     })
  //   })
  // })
})
