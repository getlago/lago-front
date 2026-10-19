import { AlertTypeEnum, NotifyOnEnum } from '~/generated/graphql'
import {
  TWalletAlertForm,
  walletAlertValidationSchema,
} from '~/pages/wallet/walletAlertForm/validationSchema'

const REQUIRED_ERROR = 'text_1771342994699klxu2paz7g8'

const validValues = (overrides: Partial<TWalletAlertForm> = {}): TWalletAlertForm => ({
  walletId: 'wallet-1',
  name: 'My alert',
  code: 'my-alert',
  alertType: AlertTypeEnum.WalletCreditsBalance,
  thresholds: [{ code: 'threshold-code', recurring: false, value: '100' }],
  ...overrides,
})

const errorsOf = (values: unknown): { path: string; message: string }[] => {
  const result = walletAlertValidationSchema.safeParse(values)

  if (result.success) return []

  return result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

describe('walletAlertValidationSchema', () => {
  describe('GIVEN a fully filled form', () => {
    describe('WHEN validating it', () => {
      it('THEN should report no error', () => {
        expect(errorsOf(validValues())).toEqual([])
      })
    })
  })

  describe('GIVEN an optional field', () => {
    describe('WHEN the name is left empty', () => {
      it('THEN should report no error', () => {
        expect(errorsOf(validValues({ name: '' }))).toEqual([])
      })
    })

    describe('WHEN a threshold has no code', () => {
      it('THEN should report no error', () => {
        expect(errorsOf(validValues({ thresholds: [{ recurring: false, value: '100' }] }))).toEqual(
          [],
        )
      })
    })
  })

  describe('GIVEN a required field left empty', () => {
    describe('WHEN the code is empty', () => {
      it('THEN should report the generic required error on the code', () => {
        expect(errorsOf(validValues({ code: '' }))).toEqual([
          { path: 'code', message: REQUIRED_ERROR },
        ])
      })
    })

    describe.each([
      ['not picked yet', ''],
      ['cleared from the combobox', undefined],
    ])('WHEN the alert type is %s', (_, alertType) => {
      it('THEN should report the generic required error on the alert type', () => {
        expect(errorsOf(validValues({ alertType: alertType as '' | undefined }))).toEqual([
          { path: 'alertType', message: REQUIRED_ERROR },
        ])
      })
    })
  })

  describe('GIVEN a threshold value', () => {
    describe.each([
      ['empty', ''],
      ['not a number', 'abc'],
    ])('WHEN it is %s', (_, value) => {
      it('THEN should report the generic required error on that row', () => {
        expect(errorsOf(validValues({ thresholds: [{ recurring: false, value }] }))).toEqual([
          { path: 'thresholds.0.value', message: REQUIRED_ERROR },
        ])
      })
    })

    describe.each([
      ['a plain number', '100'],
      ['a decimal', '10.5'],
      ['negative, as ongoing balances allow', '-10'],
      ['zero', '0'],
    ])('WHEN it is %s', (_, value) => {
      it('THEN should report no error', () => {
        expect(errorsOf(validValues({ thresholds: [{ recurring: false, value }] }))).toEqual([])
      })
    })

    describe('WHEN a later row is empty', () => {
      it('THEN should report the error on that row only', () => {
        expect(
          errorsOf(
            validValues({
              thresholds: [
                { recurring: false, value: '100' },
                { recurring: false, value: '' },
              ],
            }),
          ),
        ).toEqual([{ path: 'thresholds.1.value', message: REQUIRED_ERROR }])
      })
    })
  })

  describe('GIVEN a threshold without a recurring flag', () => {
    describe('WHEN validating it', () => {
      it('THEN should report the generic required error on the flag', () => {
        expect(errorsOf(validValues({ thresholds: [{ recurring: null, value: '100' }] }))).toEqual([
          { path: 'thresholds.0.recurring', message: REQUIRED_ERROR },
        ])
      })
    })
  })
})

describe('walletAlertValidationSchema notifyOn rules', () => {
  const CODE_REQUIRED_ERROR = 'text_1792439710542tbnwvrxl0g7'
  const CODE_NOT_UNIQUE_ERROR = 'text_17924397105421fihqq5j6ns'
  const RECURRING_ERROR = 'text_1792439710542gpn287ho1ck'
  const TRIGGERED = [NotifyOnEnum.Triggered]
  const TRIGGERED_AND_RESOLVED = [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved]

  describe('GIVEN a threshold notifying when resolved', () => {
    describe('WHEN its code is empty', () => {
      it.each([[''], ['   '], [undefined]])(
        'THEN should report the error on that row code for %p',
        (code) => {
          expect(
            errorsOf(
              validValues({
                thresholds: [
                  { code: 'warn', recurring: false, value: '10', notifyOn: TRIGGERED },
                  { code, recurring: false, value: '20', notifyOn: TRIGGERED_AND_RESOLVED },
                ],
              }),
            ),
          ).toEqual([{ path: 'thresholds.1.code', message: CODE_REQUIRED_ERROR }])
        },
      )
    })

    describe('WHEN another threshold uses the same code', () => {
      it('THEN should report the error on both rows', () => {
        expect(
          errorsOf(
            validValues({
              thresholds: [
                { code: 'hard', recurring: false, value: '10', notifyOn: TRIGGERED },
                { code: 'hard', recurring: false, value: '20', notifyOn: TRIGGERED_AND_RESOLVED },
              ],
            }),
          ),
        ).toEqual(
          expect.arrayContaining([
            { path: 'thresholds.0.code', message: CODE_NOT_UNIQUE_ERROR },
            { path: 'thresholds.1.code', message: CODE_NOT_UNIQUE_ERROR },
          ]),
        )
      })
    })

    describe('WHEN it is recurring', () => {
      it('THEN should reject it', () => {
        expect(
          errorsOf(
            validValues({
              thresholds: [
                { code: 'warn', recurring: false, value: '10', notifyOn: TRIGGERED },
                { code: 'every', recurring: true, value: '5', notifyOn: TRIGGERED_AND_RESOLVED },
              ],
            }),
          ),
        ).toEqual([{ path: 'thresholds.1.notifyOn', message: RECURRING_ERROR }])
      })
    })
  })

  describe('GIVEN thresholds that only notify when triggered', () => {
    describe('WHEN their codes are empty or shared', () => {
      it('THEN should report no error, as today', () => {
        expect(
          errorsOf(
            validValues({
              thresholds: [
                { code: '', recurring: false, value: '10', notifyOn: TRIGGERED },
                { code: 'same', recurring: false, value: '20', notifyOn: TRIGGERED },
                { code: 'same', recurring: false, value: '30' },
              ],
            }),
          ),
        ).toEqual([])
      })
    })
  })

  describe('GIVEN a notifyOn without triggered', () => {
    describe('WHEN validating it', () => {
      it('THEN should reject it, as the API makes triggered mandatory', () => {
        expect(
          errorsOf(
            validValues({
              thresholds: [
                { code: 'warn', recurring: false, value: '10', notifyOn: [NotifyOnEnum.Resolved] },
              ],
            }),
          ),
        ).toEqual([{ path: 'thresholds.0.notifyOn', message: 'text_1771342994699klxu2paz7g8' }])
      })
    })
  })
})
