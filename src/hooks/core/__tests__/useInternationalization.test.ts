import { getPluralTranslation, replaceDynamicVarInString } from '../useInternationalization'

describe('useLocationHistory()', () => {
  describe('replaceDynamicVarInString()', () => {
    it('returns string unchanged if no variable passed', () => {
      expect(replaceDynamicVarInString('simple string', {})).toBe('simple string')
    })

    it('returns interpolate variable in strings', () => {
      expect(
        replaceDynamicVarInString("What' your real name {{fakeName}}?", { fakeName: 'Mr Brown' })
      ).toBe("What' your real name Mr Brown?")
    })
  })

  describe('getPluralTranslation()', () => {
    describe('for a simple string', () => {
      it('stays unchanged if plural is 0', () => {
        expect(getPluralTranslation('simple string', 0)).toBe('simple string')
      })
      it('stays unchanged if plural is 1', () => {
        expect(getPluralTranslation('simple string', 1)).toBe('simple string')
      })
      it('stays unchanged if plural is 2', () => {
        expect(getPluralTranslation('simple string', 2)).toBe('simple string')
      })
    })

    describe('for a string with two plural conditions', () => {
      it('returns first part if plural is 0', () => {
        expect(getPluralTranslation('one|two', 0)).toBe('one')
      })
      it('returns first part if plural is 1', () => {
        expect(getPluralTranslation('one|two', 1)).toBe('one')
      })
      it('returns second part if plural is 2', () => {
        expect(getPluralTranslation('one|two', 2)).toBe('two')
      })
      it('returns second part if plural is 3', () => {
        expect(getPluralTranslation('one|two', 3)).toBe('two')
      })
    })

    describe('for a string with three plural conditions', () => {
      it('returns first part if plural is 0', () => {
        expect(getPluralTranslation('one|two|three', 0)).toBe('one')
      })
      it('returns second part if plural is 1', () => {
        expect(getPluralTranslation('one|two|three', 1)).toBe('two')
      })
      it('returns second part if plural is 2', () => {
        expect(getPluralTranslation('one|two|three', 2)).toBe('three')
      })
      it('returns second part if plural is 3', () => {
        expect(getPluralTranslation('one|two|three', 3)).toBe('three')
      })
    })
  })
})
