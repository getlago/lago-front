import { extractOptionValue } from '~/pages/settings/integrations/XeroIntegrationMapItemDrawer/extractOptionValue'
import { stringifyOptionValue } from '~/pages/settings/integrations/XeroIntegrationMapItemDrawer/stringifyOptionValue'

import { toQuickbooksOption } from '../toQuickbooksOption'

const ITEM = { externalId: 'ext-1', externalName: 'Sales' }

describe('toQuickbooksOption', () => {
  describe('GIVEN an integration item', () => {
    describe('WHEN it is turned into an option', () => {
      // QuickBooks items and accounts carry no account code: the label is the name alone and the
      // stored value keeps an empty code slot, so the shared Xero value format still parses.
      it('THEN should label it with its name and store it without an account code', () => {
        expect(toQuickbooksOption(ITEM)).toEqual({
          label: 'Sales',
          description: 'ext-1',
          value: stringifyOptionValue({ ...ITEM, externalAccountCode: '' }),
        })
      })

      it('THEN should fall back to the external id when the name is missing', () => {
        expect(toQuickbooksOption({ externalId: 'ext-1', externalName: null })).toEqual({
          label: 'ext-1',
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
        const stored = stringifyOptionValue({ ...ITEM, externalAccountCode: '' })
        const { externalId, externalName } = extractOptionValue(stored)

        expect(toQuickbooksOption({ externalId: externalId ?? '', externalName }).value).toBe(
          stored,
        )
      })
    })
  })
})
