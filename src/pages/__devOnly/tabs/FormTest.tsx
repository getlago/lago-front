import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import { useStore } from '@tanstack/react-form'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { Checkbox, MultipleComboBox } from '~/components/form'
import { CurrencyEnum } from '~/generated/graphql'
import { withForm } from '~/hooks/forms/useAppform'
import { tw } from '~/styles/utils'

import Container from '../common/Container'
import { designSystemFormDefaultValues } from '../validationSchema'

export const DESIGN_SYSTEM_FORM_ID = 'design-system-form'
export const FORM_TEST_ALL_CONDITIONS_CHECKBOX_TEST_ID = 'design-system-form-all-conditions'
export const FORM_TEST_SUBMIT_BUTTON_TEST_ID = 'design-system-form-submit'

const Block = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={tw('mb-6 flex flex-wrap gap-4', className)}>{children}</div>
)

const ComboboxHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full gap-1 *:whitespace-nowrap">{children}</div>
)

const getCheckboxValue = (cond1: boolean, cond2: boolean): boolean | undefined => {
  if (cond1 && cond2) return true
  if (!cond1 && !cond2) return false

  return undefined
}

export const FormTest = withForm({
  defaultValues: designSystemFormDefaultValues,
  render: function Render({ form }) {
    const switchValue = useStore(form.store, (state) => state.values.switch)
    const amountCurrency = useStore(form.store, (state) => state.values.amountCurrency)
    const checkboxCond1 = useStore(form.store, (state) => state.values.checkboxCond1)
    const checkboxCond2 = useStore(form.store, (state) => state.values.checkboxCond2)
    const multipleCombobox = useStore(form.store, (state) => state.values.multipleCombobox)

    const handleSubmit = (event: React.FormEvent): void => {
      event.preventDefault()
      form.handleSubmit()
    }

    return (
      <Container>
        <form id={DESIGN_SYSTEM_FORM_ID} onSubmit={handleSubmit}>
          <Typography className="mb-4" variant="headline">
            Form
          </Typography>

          <Typography className="mb-4" variant="subhead1">
            Checkbox
          </Typography>

          <Block>
            <Checkbox
              canBeIndeterminate
              data-test={FORM_TEST_ALL_CONDITIONS_CHECKBOX_TEST_ID}
              name="checkboxCond3"
              value={getCheckboxValue(checkboxCond1, checkboxCond2)}
              onChange={(e, value) => {
                if (value) {
                  form.setFieldValue('checkboxCond1', true)
                  form.setFieldValue('checkboxCond2', true)
                } else {
                  form.setFieldValue('checkboxCond1', false)
                  form.setFieldValue('checkboxCond2', false)
                }
              }}
              label="Accept all conditions or else you won't be able to become the incredibly talented person you want to become (we know, life is unfair)"
              error={!checkboxCond1 || !checkboxCond2 ? 'Sorry you need to accept both' : undefined}
            />

            <form.AppField name="checkboxCond1">
              {(field) => <field.CheckboxField label="Accept the insane condition" />}
            </form.AppField>

            <form.AppField name="checkboxCond2">
              {(field) => <field.CheckboxField label="Accept the smart condition" />}
            </form.AppField>

            <form.AppField name="checkboxCond1">
              {(field) => (
                <field.CheckboxField disabled label="Insane condition you can't remove" />
              )}
            </form.AppField>

            <form.AppField name="checkboxCond2">
              {(field) => <field.CheckboxField disabled label="Smart condition you can't remove" />}
            </form.AppField>

            <form.AppField name="checkboxCond2">
              {(field) => <field.CheckboxField label="Label" sublabel="Sublabel" />}
            </form.AppField>

            <form.AppField name="checkboxCond2">
              {(field) => <field.CheckboxField disabled label="Label" sublabel="Sublabel" />}
            </form.AppField>
          </Block>

          <Typography className="mb-4" variant="subhead1">
            ButtonSelector
          </Typography>
          <Block>
            <form.AppField name="buttonSelector">
              {(field) => (
                <field.ButtonSelectorField
                  label="You'd rather..."
                  description="Be careful with your choice"
                  infoText="You WILL be judge on the answer"
                  options={[
                    {
                      label: '...talk like Yoda',
                      value: 'yoda',
                    },
                    {
                      label: '...Breath like Darth Vader',
                      value: 'vador',
                    },
                  ]}
                />
              )}
            </form.AppField>
            <form.AppField name="buttonSelector">
              {(field) => (
                <field.ButtonSelectorField
                  label="You'd rather..."
                  disabled
                  options={[
                    {
                      label: '...talk like Yoda',
                      value: 'yoda',
                    },
                    {
                      label: '...Breath like Darth Vader',
                      value: 'vador',
                    },
                  ]}
                />
              )}
            </form.AppField>
          </Block>

          <Typography className="mb-4" variant="subhead1">
            Switch
          </Typography>
          <Block>
            <form.AppField name="switch">
              {(field) => (
                <field.SwitchField
                  label="How do you feel today ?"
                  subLabel={switchValue ? '' : 'Wanna talk about it ? Call 911.'}
                />
              )}
            </form.AppField>
            <form.AppField name="switch">
              {(field) => <field.SwitchField label="Disabled" disabled />}
            </form.AppField>
            <form.AppField name="switch">
              {(field) => (
                <field.SwitchField
                  label="How do you feel today ?"
                  subLabel="I really wanna know"
                  labelPosition="left"
                />
              )}
            </form.AppField>
          </Block>

          <Typography className="mb-4" variant="subhead1">
            Combobox
          </Typography>
          <Block>
            <form.AppField name="combobox">
              {(field) => (
                <field.ComboBoxField
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                    group: Math.round(i / 5) + '',
                    description: `I am a description for ${letter}`,
                  }))}
                  label="Grouped by - virtualized"
                  description="You can type anything to see the magic happen"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="combobox">
              {(field) => (
                <field.ComboBoxField
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                  }))}
                  label="Not grouped - virtualized"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="combobox">
              {(field) => (
                <field.ComboBoxField
                  virtualized={false}
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                  }))}
                  label="Not grouped - normal"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="combobox">
              {(field) => (
                <field.ComboBoxField
                  virtualized={false}
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                    description: `I am a description for ${letter}`,
                  }))}
                  label="With description"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="combobox">
              {(field) => (
                <field.ComboBoxField
                  virtualized={false}
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                    group: Math.round(i / 5) + '',
                  }))}
                  renderGroupHeader={{
                    '0': (
                      <ComboboxHeader>
                        <Typography component="span" variant="captionHl" color="textSecondary">
                          The good •
                        </Typography>
                        <Typography component="span" variant="caption" noWrap>
                          Based on several survey
                        </Typography>
                      </ComboboxHeader>
                    ),
                    '1': (
                      <ComboboxHeader>
                        <Typography component="span" variant="captionHl" color="textSecondary">
                          The bad •
                        </Typography>
                        <Typography component="span" variant="caption" noWrap>
                          Because I say so
                        </Typography>
                      </ComboboxHeader>
                    ),
                    '2': (
                      <ComboboxHeader>
                        <Typography component="span" variant="captionHl" color="textSecondary">
                          The ugly •
                        </Typography>
                        <Typography component="span" variant="caption" noWrap>
                          Don&apos;t look at it
                        </Typography>
                      </ComboboxHeader>
                    ),
                  }}
                  label="Grouped by - normal - custom headers"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="combobox">
              {(field) => (
                <field.ComboBoxField
                  virtualized={false}
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                    group: Math.round(i / 5) + '',
                  }))}
                  renderGroupHeader={{
                    '0': (
                      <ComboboxHeader>
                        <Typography component="span" variant="captionHl" color="textSecondary">
                          The good •
                        </Typography>
                        <Typography component="span" variant="caption" noWrap>
                          Based on several survey
                        </Typography>
                      </ComboboxHeader>
                    ),
                    '1': (
                      <ComboboxHeader>
                        <Typography component="span" variant="captionHl" color="textSecondary">
                          The bad •
                        </Typography>
                        <Typography component="span" variant="caption" noWrap>
                          Because I say so
                        </Typography>
                      </ComboboxHeader>
                    ),
                    '2': (
                      <ComboboxHeader>
                        <Typography component="span" variant="captionHl" color="textSecondary">
                          The ugly •
                        </Typography>
                        <Typography component="span" variant="caption" noWrap>
                          Don&apos;t look at it
                        </Typography>
                      </ComboboxHeader>
                    ),
                  }}
                  renderGroupInputStartAdornment={{
                    0: 'The good',
                    1: 'The bad',
                    2: 'The ugly',
                  }}
                  label="Grouped by - normal - custom headers - Input start adornment"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="combobox">
              {(field) => (
                <field.ComboBoxField
                  virtualized={false}
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                    group: Math.round(i / 5) + '',
                    description: `I am a description for ${letter}`,
                  }))}
                  label="Grouped by with description"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>

            <form.AppField name="combobox">
              {(field) => (
                <field.ComboBoxField
                  data={[]}
                  label="Loading"
                  placeholder="But who is it anyway ?"
                  loading
                />
              )}
            </form.AppField>
            <form.AppField name="combobox">
              {(field) => (
                <field.ComboBoxField
                  data={[]}
                  label="Disabled"
                  placeholder="You don't get to answer"
                  disabled
                />
              )}
            </form.AppField>

            <form.AppField name="multipleCombobox">
              {(field) => (
                <field.MultipleComboBoxField
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                  }))}
                  label="Multiple"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="multipleCombobox">
              {(field) => (
                <field.MultipleComboBoxField
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                    description: `I am a description for ${letter}`,
                  }))}
                  label="Multiple with description"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="multipleCombobox">
              {(field) => (
                <field.MultipleComboBoxField
                  disableCloseOnSelect
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                    group: Math.round(i / 5) + '',
                    description: `I am a description for ${letter}`,
                  }))}
                  label="Multiple disableCloseOnSelect"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="multipleCombobox">
              {(field) => (
                <field.MultipleComboBoxField
                  freeSolo
                  data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                    value: `${letter}-${i}`,
                    group: Math.round(i / 5) + '',
                  }))}
                  label="Multiple Free Solo"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            <form.AppField name="multipleCombobox">
              {(field) => (
                <field.MultipleComboBoxField
                  freeSolo
                  showOptionsOnlyWhenTyping
                  label="Multiple No Data freeSolo showOptionsOnlyWhenTyping"
                  placeholder="Placeholder"
                />
              )}
            </form.AppField>
            {multipleCombobox.length > 0 && (
              <Stack gap={1} direction="row" flexWrap="wrap">
                {multipleCombobox.map((value, index) => (
                  <Chip
                    key={index}
                    label={value.value}
                    onDelete={() => {
                      form.setFieldValue(
                        'multipleCombobox',
                        multipleCombobox.filter((v) => v !== value),
                      )
                    }}
                  />
                ))}
              </Stack>
            )}
            <MultipleComboBox
              freeSolo
              hideTags
              disableClearable
              showOptionsOnlyWhenTyping
              data={[]}
              onChange={(newValue) => form.setFieldValue('multipleCombobox', newValue)}
              value={multipleCombobox}
              label="Multiple No Data freeSolo hideTags disableClearable allowSameValue showOptionsOnlyWhenTyping"
              placeholder="Placeholder"
            />
          </Block>

          <Typography className="mb-4" variant="subhead1">
            Radio
          </Typography>
          <Block>
            <form.AppField name="radio">
              {(field) => <field.RadioField value="chocolatine" label="Chocolatine" />}
            </form.AppField>
            <form.AppField name="radio">
              {(field) => (
                <field.RadioField
                  value="painauchocolat"
                  label="Pain au chocolat"
                  sublabel="The right answer"
                />
              )}
            </form.AppField>
            <form.AppField name="radio">
              {(field) => (
                <field.RadioField
                  value="painauchocolat"
                  label="Disabled"
                  sublabel="I'm disabled too"
                  disabled
                />
              )}
            </form.AppField>
            <form.AppField name="radio">
              {(field) => (
                <field.RadioField
                  value="painauchocolat"
                  label="Radio with a very long label - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
                  sublabel="The right answer"
                />
              )}
            </form.AppField>
          </Block>

          <Typography className="mb-4" variant="subhead1">
            DatePicker
          </Typography>
          <Block className="min-w-[325px]">
            <form.AppField name="date">
              {(field) => <field.DatePickerField label="When is Morguy's birthday ?" />}
            </form.AppField>
            <form.AppField name="date">
              {(field) => (
                <field.DatePickerField
                  label="DatePicker with helper"
                  helperText="I'm here to help"
                />
              )}
            </form.AppField>
            <form.AppField name="date">
              {(field) => <field.DatePickerField label="DatePicker disabled" disabled />}
            </form.AppField>
          </Block>

          <Typography className="mb-4" variant="subhead1">
            AmountInput
          </Typography>
          <Block>
            <form.AppField name="amountCents">
              {(field) => (
                <field.AmountInputField
                  beforeChangeFormatter={['positiveNumber']}
                  currency={amountCurrency}
                  label="Amount"
                  description='Amount in "cents" (1€ = 100 cents)'
                />
              )}
            </form.AppField>
            <form.AppField name="amountCurrency">
              {(field) => (
                <field.ComboBoxField
                  data={Object.values(CurrencyEnum).map((currencyType) => ({
                    value: currencyType,
                  }))}
                  label="currency"
                  description="Select your currency"
                  placeholder="Placeholder"
                  disableClearable
                />
              )}
            </form.AppField>
          </Block>

          <Typography className="mb-4" variant="subhead1">
            TextInput
          </Typography>
          <Block>
            <form.AppField name="input">
              {(field) => (
                <field.TextInputField
                  label="Label"
                  placeholder="Type something"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">Dias</InputAdornment>,
                  }}
                />
              )}
            </form.AppField>
            <form.AppField name="inputNumber">
              {(field) => (
                <field.TextInputField
                  label="With decimal formatter"
                  placeholder="Type number"
                  beforeChangeFormatter={['decimal']}
                />
              )}
            </form.AppField>
            <form.AppField name="inputNumber">
              {(field) => (
                <field.TextInputField
                  label="With triDecimal formatter"
                  placeholder="Type number"
                  beforeChangeFormatter={['triDecimal']}
                />
              )}
            </form.AppField>
            <form.AppField name="inputNumber">
              {(field) => (
                <field.TextInputField
                  label="With quadDecimal formatter"
                  placeholder="Type number"
                  beforeChangeFormatter={['quadDecimal']}
                />
              )}
            </form.AppField>
            <form.AppField name="input">
              {(field) => (
                <field.TextInputField label="Cleanable" placeholder="Type something" cleanable />
              )}
            </form.AppField>
            <form.AppField name="input">
              {(field) => (
                <field.TextInputField label="Password" placeholder="Type something" password />
              )}
            </form.AppField>
            <form.AppField name="input">
              {(field) => (
                <field.TextInputField
                  label="With infotext"
                  placeholder="Type something"
                  infoText="I'm giving you some infos"
                />
              )}
            </form.AppField>
            <form.AppField name="input">
              {(field) => (
                <field.TextInputField
                  label="Disabled"
                  placeholder="Type something"
                  disabled
                  InputProps={{
                    endAdornment: <InputAdornment position="end">Dias</InputAdornment>,
                  }}
                />
              )}
            </form.AppField>
            <form.AppField name="input">
              {(field) => (
                <field.TextInputField
                  label="With helpertext"
                  placeholder="Type something"
                  helperText="I'm here to help"
                />
              )}
            </form.AppField>
            <form.AppField name="input">
              {(field) => (
                <field.TextInputField
                  label="With description"
                  placeholder="Type something"
                  description="I'm here to help"
                />
              )}
            </form.AppField>
          </Block>

          <Typography className="mb-4" variant="subhead1">
            JSON Editor
          </Typography>
          <Block>
            <form.AppField name="json">
              {(field) => (
                <field.JsonEditorField
                  label="With small editor and overlay"
                  description='Click on "expand" to remove the overlay'
                  infoText="Some tips"
                  onExpand={(deleteOverlay) => {
                    deleteOverlay()
                  }}
                  helperText="Until you can't see the last line in the editor, you will see the expand overlay"
                />
              )}
            </form.AppField>

            <form.AppField name="jsonLong">
              {(field) => <field.JsonEditorField label="With height" height="300px" />}
            </form.AppField>
          </Block>

          <Button type="submit" data-test={FORM_TEST_SUBMIT_BUTTON_TEST_ID}>
            Check your answers
          </Button>
        </form>
      </Container>
    )
  },
})
