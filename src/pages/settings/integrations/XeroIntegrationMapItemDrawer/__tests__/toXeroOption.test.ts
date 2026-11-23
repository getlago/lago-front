import { extractOptionValue } from '../extractOptionValue'
import { stringifyOptionValue } from '../stringifyOptionValue'
import { toXeroOption } from '../toXeroOption'

const ITEM = { externalId: 'ext-1', externalName: 'Sales', externalAccountCode: '200' }

describe('toXeroOption', () => {
  describe('GIVEN an integration item', () => {
    describe('WHEN it is turned into an option', () => {
      it('THEN should carry the label, the description and the stored value', () => {
        expect(toXeroOption(ITEM)).toEqual({
          label: 'Sales (200)',
          description: 'ext-1',
          value: stringifyOptionValue(ITEM),
        })
      })

      it('THEN should tolerate a missing name or account code', () => {
        expect(
          toXeroOption({ externalId: 'ext-1', externalName: null, externalAccountCode: null }),
        ).toEqual({
          label: 'null (null)',
          description: 'ext-1',
          value: stringifyOptionValue({
            externalId: 'ext-1',
            externalName: '',
            externalAccountCode: '',
          }),
        })
      })
    })
  })

  describe('GIVEN a value already stored on a mapping', () => {
    describe('WHEN the option is rebuilt from it', () => {
      // The rebuilt option is what keeps a stored mapping in `data`: if its value stopped
      // matching, `ComboBox` would treat the selection as deleted and clear the field.
      it('THEN should produce the very same value', () => {
        const stored = stringifyOptionValue(ITEM)
        const { externalId, externalName, externalAccountCode } = extractOptionValue(stored)

        expect(
          toXeroOption({ externalId: externalId ?? '', externalName, externalAccountCode }).value,
        ).toBe(stored)
      })
    })
  })
})
