import {
  booleanToNotifyOn,
  getThresholdCodeErrors,
  getThresholdCodeErrorsFromForm,
  notifyOnToBoolean,
  patchThreshold,
  SortableThreshold,
  sortAndFormatThresholds,
} from '~/components/alerts/utils'
import { CurrencyEnum, NotifyOnEnum, ThresholdInput } from '~/generated/graphql'

type TestThreshold = SortableThreshold & { code?: string | null }

const threshold = (overrides: Partial<TestThreshold> = {}) => ({
  code: 'threshold-code',
  recurring: false,
  value: '1000',
  ...overrides,
})

describe('sortAndFormatThresholds', () => {
  describe('GIVEN an alert holding amounts', () => {
    describe('WHEN formatting its thresholds', () => {
      it('THEN should deserialize the value from cents', () => {
        const result = sortAndFormatThresholds([threshold()], CurrencyEnum.Usd, false)

        expect(result).toEqual([expect.objectContaining({ value: '10' })])
      })

      it('THEN should keep the other threshold fields untouched', () => {
        const result = sortAndFormatThresholds(
          [threshold({ code: 'my-code' })],
          CurrencyEnum.Usd,
          false,
        )

        expect(result).toEqual([{ code: 'my-code', recurring: false, value: '10' }])
      })
    })
  })

  describe('GIVEN an alert holding units', () => {
    describe('WHEN formatting its thresholds', () => {
      it.each([
        ['12.99', '12'],
        ['12', '12'],
        ['0.5', '0'],
      ])('THEN should truncate %s to %s', (value, expected) => {
        const result = sortAndFormatThresholds([threshold({ value })], CurrencyEnum.Usd, true)

        expect(result).toEqual([expect.objectContaining({ value: expected })])
      })
    })
  })

  describe('GIVEN a recurring threshold placed first', () => {
    describe('WHEN formatting the thresholds', () => {
      it('THEN should move it last, since the table maps row indexes on that order', () => {
        const result = sortAndFormatThresholds(
          [
            threshold({ code: 'recurring', recurring: true, value: '5' }),
            threshold({ code: 'first', value: '10' }),
            threshold({ code: 'second', value: '20' }),
          ],
          CurrencyEnum.Usd,
          true,
        )

        expect(result.map(({ code }) => code)).toEqual(['first', 'second', 'recurring'])
      })
    })
  })

  describe('GIVEN non-recurring thresholds with an empty value', () => {
    describe('WHEN formatting the thresholds', () => {
      it('THEN should push the empty ones after the filled ones', () => {
        const result = sortAndFormatThresholds(
          [threshold({ code: 'empty', value: '' }), threshold({ code: 'filled', value: '10' })],
          CurrencyEnum.Usd,
          true,
        )

        expect(result.map(({ code }) => code)).toEqual(['filled', 'empty'])
      })
    })
  })

  describe('GIVEN no threshold at all', () => {
    describe('WHEN formatting the thresholds', () => {
      it('THEN should return an empty list', () => {
        expect(sortAndFormatThresholds([], CurrencyEnum.Usd, false)).toEqual([])
      })
    })
  })
})

describe('patchThreshold', () => {
  const baseThreshold: ThresholdInput = { code: 'initial-code', recurring: false, value: '100' }

  describe('GIVEN a code cell', () => {
    describe('WHEN it receives a value', () => {
      it('THEN should store it and leave the other fields untouched', () => {
        expect(patchThreshold(baseThreshold, 'code', 'new-code')).toEqual({
          code: 'new-code',
          recurring: false,
          value: '100',
        })
      })
    })

    describe('WHEN it is emptied', () => {
      it('THEN should store no code rather than the "undefined" string', () => {
        expect(patchThreshold(baseThreshold, 'code', undefined).code).toBeUndefined()
      })
    })
  })

  describe('GIVEN a value cell', () => {
    describe('WHEN it receives a value', () => {
      it('THEN should store it as a string', () => {
        expect(patchThreshold(baseThreshold, 'value', 250).value).toBe('250')
      })
    })

    describe('WHEN it is emptied', () => {
      it('THEN should store an empty string, as the API type requires one', () => {
        expect(patchThreshold(baseThreshold, 'value', undefined).value).toBe('')
      })
    })
  })

  describe('GIVEN the recurring flag', () => {
    describe('WHEN it is toggled', () => {
      it('THEN should store a real boolean', () => {
        expect(patchThreshold(baseThreshold, 'recurring', true).recurring).toBe(true)
      })
    })
  })

  describe('GIVEN any patch', () => {
    describe('WHEN it is applied', () => {
      it('THEN should not mutate the original threshold', () => {
        patchThreshold(baseThreshold, 'value', '999')

        expect(baseThreshold.value).toBe('100')
      })
    })
  })
})

const TRIGGERED = [NotifyOnEnum.Triggered]
const TRIGGERED_AND_RESOLVED = [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved]

describe('notifyOnToBoolean', () => {
  describe('GIVEN a notifyOn value from the API', () => {
    it.each<[string, NotifyOnEnum[] | null | undefined, boolean]>([
      ['[triggered]', TRIGGERED, false],
      ['[triggered, resolved]', TRIGGERED_AND_RESOLVED, true],
      ['[resolved, triggered]', [NotifyOnEnum.Resolved, NotifyOnEnum.Triggered], true],
      ['an empty list', [], false],
      ['duplicated triggered', [NotifyOnEnum.Triggered, NotifyOnEnum.Triggered], false],
      [
        'duplicated resolved',
        [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved, NotifyOnEnum.Resolved],
        false,
      ],
      ['resolved without triggered', [NotifyOnEnum.Resolved], false],
      ['an unknown value with resolved', ['unknown' as NotifyOnEnum, NotifyOnEnum.Resolved], false],
      ['not a list', 'resolved' as unknown as NotifyOnEnum[], false],
      ['null', null, false],
      ['undefined', undefined, false],
    ])('WHEN it is %s THEN should map to %p', (_, notifyOn, expected) => {
      expect(notifyOnToBoolean(notifyOn)).toBe(expected)
    })
  })
})

describe('booleanToNotifyOn', () => {
  describe('GIVEN the "Notify when resolved" choice', () => {
    it('WHEN false THEN should only notify when triggered', () => {
      expect(booleanToNotifyOn(false)).toEqual(TRIGGERED)
    })

    it('WHEN true THEN should notify when triggered and resolved, in the API order', () => {
      expect(booleanToNotifyOn(true)).toEqual(TRIGGERED_AND_RESOLVED)
    })

    it.each([true, false])('WHEN %p THEN should round-trip through notifyOnToBoolean', (value) => {
      expect(notifyOnToBoolean(booleanToNotifyOn(value))).toBe(value)
    })
  })
})

describe('sortAndFormatThresholds with notifyOn', () => {
  describe('GIVEN one-time and recurring thresholds holding notifyOn', () => {
    it('THEN should carry notifyOn on every row', () => {
      const result = sortAndFormatThresholds(
        [
          threshold({ code: 'every', recurring: true, value: '500', notifyOn: TRIGGERED }),
          threshold({ code: 'hard', value: '1000', notifyOn: TRIGGERED_AND_RESOLVED }),
        ],
        CurrencyEnum.Usd,
        false,
      )

      expect(result).toEqual([
        { code: 'hard', recurring: false, value: '10', notifyOn: TRIGGERED_AND_RESOLVED },
        { code: 'every', recurring: true, value: '5', notifyOn: TRIGGERED },
      ])
    })
  })
})

describe('patchThreshold with notifyOn', () => {
  const baseThreshold: ThresholdInput = {
    code: 'hard',
    recurring: false,
    value: '10',
    notifyOn: TRIGGERED,
  }

  it('WHEN set to true THEN should store [triggered, resolved]', () => {
    expect(patchThreshold(baseThreshold, 'notifyOn', true).notifyOn).toEqual(TRIGGERED_AND_RESOLVED)
  })

  it('WHEN set back to false THEN should store [triggered]', () => {
    expect(
      patchThreshold({ ...baseThreshold, notifyOn: TRIGGERED_AND_RESOLVED }, 'notifyOn', false)
        .notifyOn,
    ).toEqual(TRIGGERED)
  })

  it('WHEN another cell changes THEN should keep notifyOn untouched', () => {
    const optedIn = { ...baseThreshold, notifyOn: TRIGGERED_AND_RESOLVED }

    expect(patchThreshold(optedIn, 'value', '20').notifyOn).toEqual(TRIGGERED_AND_RESOLVED)
    expect(patchThreshold(optedIn, 'code', 'renamed').notifyOn).toEqual(TRIGGERED_AND_RESOLVED)
  })
})

describe('getThresholdCodeErrors', () => {
  const REQUIRED = 'text_1792439710542tbnwvrxl0g7'
  const NOT_UNIQUE = 'text_17924397105421fihqq5j6ns'

  const row = (overrides: Partial<ThresholdInput> = {}): ThresholdInput => ({
    code: 'code',
    recurring: false,
    value: '10',
    notifyOn: TRIGGERED,
    ...overrides,
  })

  it('GIVEN no threshold notifying when resolved THEN should report nothing, even without codes', () => {
    expect(getThresholdCodeErrors([row({ code: '' }), row({ code: undefined })])).toEqual({})
  })

  it.each([[''], ['  '], [undefined], [null]])(
    'GIVEN an opted-in threshold with code %p THEN should require a code on that row',
    (code) => {
      expect(
        getThresholdCodeErrors([
          row({ code: 'warn' }),
          row({ code, notifyOn: TRIGGERED_AND_RESOLVED }),
        ]),
      ).toEqual({ 1: REQUIRED })
    },
  )

  it('GIVEN an opted-in threshold sharing its code THEN should flag both rows', () => {
    expect(
      getThresholdCodeErrors([
        row({ code: 'hard' }),
        row({ code: 'other' }),
        row({ code: 'hard', notifyOn: TRIGGERED_AND_RESOLVED }),
      ]),
    ).toEqual({ 0: NOT_UNIQUE, 2: NOT_UNIQUE })
  })

  it('GIVEN an opted-in threshold sharing its code with the recurring one THEN should flag both rows', () => {
    expect(
      getThresholdCodeErrors([
        row({ code: 'hard', notifyOn: TRIGGERED_AND_RESOLVED }),
        row({ code: 'hard', recurring: true }),
      ]),
    ).toEqual({ 0: NOT_UNIQUE, 1: NOT_UNIQUE })
  })

  it.each([[null], [undefined], ['not a list' as unknown as ThresholdInput[]]])(
    'GIVEN thresholds %p THEN should report nothing instead of throwing',
    (thresholds) => {
      expect(getThresholdCodeErrors(thresholds)).toEqual({})
    },
  )

  it('GIVEN opted-in thresholds with unique codes THEN should report nothing', () => {
    expect(
      getThresholdCodeErrors([
        row({ code: 'warn', notifyOn: TRIGGERED_AND_RESOLVED }),
        row({ code: 'hard', notifyOn: TRIGGERED_AND_RESOLVED }),
      ]),
    ).toEqual({})
  })
})

describe('getThresholdCodeErrorsFromForm', () => {
  it('maps nested code issues without recomputing their rule', () => {
    expect(
      getThresholdCodeErrorsFromForm({
        'thresholds[1].code': [{ message: 'fake-refine-rule', path: ['thresholds', 1, 'code'] }],
        'thresholds[0].value': [{ message: 'invalid-value' }],
        code: [{ message: 'invalid-alert-code' }],
      }),
    ).toEqual({ 1: 'fake-refine-rule' })
  })

  it('clears cells when the form no longer has issues', () => {
    expect(getThresholdCodeErrorsFromForm(undefined)).toEqual({})
  })
})
