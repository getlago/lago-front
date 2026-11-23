import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from 'lago-ui/combobox'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

import { AmountInputV2 } from '~/components/form/AmountInputV2'
import { initializeTranslations } from '~/core/apolloClient/reactiveVars/internationalizationVar'
import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import config from '../../../../tailwind.config'
import BaseDialog from '../BaseDialog'

it.each(['combobox', 'amount'])(
  'keeps the %s body-portalled results above the app dialog and selects an option',
  async (kind) => {
    await initializeTranslations()
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const user = userEvent.setup()
    const changed = jest.fn()
    const closeDialog = jest.fn().mockResolvedValue(undefined)
    const style = document.createElement('style')
    const utilities = await postcss([
      tailwindcss({ ...config, content: [{ raw: 'z-dialog z-[2100]', extension: 'html' }] }),
    ]).process('@tailwind utilities;', { from: undefined })

    const comboboxStyles = postcss.parse(
      readFileSync(
        resolve(__dirname, '../../../../packages/ui/src/components/combobox.css'),
        'utf8',
      ),
    )

    // jsdom cannot evaluate the nested :has selectors used for control hover states.
    comboboxStyles.walkRules((rule) => {
      if (rule.selector.includes(':has(')) rule.remove()
    })
    style.textContent = utilities.css + comboboxStyles.toString()
    document.head.append(style)
    const scrollIntoView = Element.prototype.scrollIntoView

    Element.prototype.scrollIntoView = jest.fn()

    try {
      render(
        <BaseDialog
          title="Assign quote owner"
          actions={null}
          isOpen
          closeDialog={closeDialog}
          removeDialog={jest.fn()}
        >
          {kind === 'amount' ? (
            <AmountInputV2
              mode="selectable"
              currency={CurrencyEnum.Usd}
              currencyOptions={[
                { value: CurrencyEnum.Usd, label: 'US Dollar' },
                { value: CurrencyEnum.Eur, label: 'Euro' },
              ]}
              onCurrencyChange={changed}
              value="123.45"
              onChange={jest.fn()}
              aria-label="Amount"
            />
          ) : (
            <Combobox items={['Alex', 'Sam']} onValueChange={changed}>
              <ComboboxControl>
                <ComboboxInput aria-label="Quote owner" />
              </ComboboxControl>
              <ComboboxContent>
                <ComboboxList getItemKey={(name: string) => name}>
                  {(name) => <ComboboxItem value={name}>{name}</ComboboxItem>}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )}
        </BaseDialog>,
      )
      await user.click(
        screen.getByRole('combobox', { name: kind === 'amount' ? 'Currency, USD' : 'Quote owner' }),
      )
      const option = await screen.findByRole('option', {
        name: kind === 'amount' ? 'EUR Euro' : 'Sam',
      })
      const positioner = option.closest('.v2-combobox-positioner') as HTMLElement
      const dialogRoot = screen
        .getAllByRole('dialog')
        .find((dialog) => dialog.closest('.MuiDialog-root'))
        ?.closest('.MuiDialog-root') as HTMLElement

      expect(dialogRoot).not.toContainElement(positioner)
      expect(Number(getComputedStyle(positioner).zIndex)).toBeGreaterThan(
        Number(getComputedStyle(dialogRoot).zIndex),
      )
      await user.click(option)
      if (kind === 'amount') expect(changed).toHaveBeenCalledWith(CurrencyEnum.Eur)
      else expect(changed).toHaveBeenCalledWith('Sam', expect.anything())
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
      if (kind === 'amount')
        expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('123.45')
      else expect(screen.getByRole('combobox')).toHaveValue('Sam')
      expect(closeDialog).not.toHaveBeenCalled()
    } finally {
      style.remove()
      Element.prototype.scrollIntoView = scrollIntoView
    }
  },
)
