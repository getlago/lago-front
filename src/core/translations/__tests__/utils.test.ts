import { getPluralTranslation, replaceDynamicVarInString } from '~/core/translations/utils'

describe('utils', () => {
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
