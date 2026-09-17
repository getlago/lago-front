import { captureMessage } from '@sentry/react'

import { AppEnvEnum } from '~/core/constants/globalTypes'
import { LocaleEnum } from '~/core/translations/types'
import {
  getPluralTranslation,
  replaceDynamicVarInString,
  translateKey,
} from '~/core/translations/utils'

jest.mock('@sentry/react', () => ({
  captureMessage: jest.fn(),
}))

describe('utils', () => {
  describe('translateKey', () => {
    const baseContext = {
      locale: LocaleEnum.en,
      appEnv: AppEnvEnum.development,
    }

    describe('when translations are not loaded yet', () => {
      it('returns an empty string for undefined translations', () => {
        expect(translateKey({ ...baseContext, translations: undefined }, 'any_key')).toEqual('')
      })
    })

    describe('when the key exists', () => {
      it('returns the matching translation', () => {
        expect(
          translateKey({ ...baseContext, translations: { greeting: 'Hello' } }, 'greeting'),
        ).toEqual('Hello')
      })

      it('interpolates dynamic variables', () => {
        expect(
          translateKey(
            { ...baseContext, translations: { greeting: 'Hello {{name}}' } },
            'greeting',
            { name: 'World' },
          ),
        ).toEqual('Hello World')
      })

      it('resolves the plural form', () => {
        expect(
          translateKey(
            { ...baseContext, translations: { items: 'one|many' } },
            'items',
            undefined,
            2,
          ),
        ).toEqual('many')
      })
    })

    describe('when the key is missing', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('returns the key itself', () => {
        expect(
          translateKey({ ...baseContext, translations: { greeting: 'Hello' } }, 'missing_key'),
        ).toEqual('missing_key')
      })

      it('reports it to Sentry on production for a non-english locale', () => {
        translateKey(
          {
            translations: { greeting: 'Hello' },
            locale: LocaleEnum.fr,
            appEnv: AppEnvEnum.production,
          },
          'missing_key',
        )

        expect(captureMessage).toHaveBeenCalledTimes(1)
      })

      it('reports it to Sentry when appEnv is undefined for a non-english locale', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

        translateKey(
          { translations: { greeting: 'Hello' }, locale: LocaleEnum.fr, appEnv: undefined },
          'missing_key',
        )

        expect(captureMessage).toHaveBeenCalledTimes(1)
        expect(warnSpy).not.toHaveBeenCalled()

        warnSpy.mockRestore()
      })

      it('warns in the console on development instead of reporting to Sentry', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

        translateKey({ ...baseContext, translations: { greeting: 'Hello' } }, 'missing_key')

        expect(warnSpy).toHaveBeenCalledTimes(1)
        expect(captureMessage).not.toHaveBeenCalled()

        warnSpy.mockRestore()
      })
    })
  })

  describe('getPluralTranslation', () => {
    describe('when the template has no none', () => {
      it('returns singular for 0', () => {
        expect(getPluralTranslation('singular|plural', 0)).toEqual('singular')
      })
      it('returns singular for 1', () => {
        expect(getPluralTranslation('singular|plural', 1)).toEqual('singular')
      })
      it('returns plural for 2', () => {
        expect(getPluralTranslation('singular|plural', 2)).toEqual('plural')
      })
      it('returns plural for more than 2', () => {
        expect(
          getPluralTranslation('singular|plural', Math.round(Math.random() * 100) + 2),
        ).toEqual('plural')
      })
    })

    describe('when the template has none', () => {
      it('returns none for 0', () => {
        expect(getPluralTranslation('none|singular|plural', 0)).toEqual('none')
      })
      it('returns singular for 1', () => {
        expect(getPluralTranslation('none|singular|plural', 1)).toEqual('singular')
      })
      it('returns plural for 2', () => {
        expect(getPluralTranslation('none|singular|plural', 2)).toEqual('plural')
      })
      it('returns plural for more than 2', () => {
        expect(
          getPluralTranslation('none|singular|plural', Math.round(Math.random() * 100) + 2),
        ).toEqual('plural')
      })
    })
  })

  describe('replaceDynamicVarInString', () => {
    it('replaces the dynamic variable', () => {
      expect(replaceDynamicVarInString('Hello {{name}}', { name: 'World' })).toEqual('Hello World')
    })
    it('replaces the dynamic variable multiple times', () => {
      expect(replaceDynamicVarInString('Hello {{name}}, {{name}}', { name: 'World' })).toEqual(
        'Hello World, World',
      )
    })
    it('replaces the dynamic variabled with multiple words', () => {
      expect(replaceDynamicVarInString('Hello {{name}}', { name: 'World Peace' })).toEqual(
        'Hello World Peace',
      )
    })
    it('replaces the dynamic variable with numbers', () => {
      expect(replaceDynamicVarInString('Hello {{name}}', { name: 123 })).toEqual('Hello 123')
    })
    it('replaces multiple dynamic variable', () => {
      expect(
        replaceDynamicVarInString('Hello {{firstName}} {{lastName}}', {
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).toEqual('Hello John Doe')
    })
  })
})
