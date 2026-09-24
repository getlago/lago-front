import { useId, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { MUI_INPUT_BASE_ROOT_CLASSNAME } from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useFieldError } from '~/hooks/forms/useFieldError'

import { GOVERNANCE_ENTITY_FORM_DEFAULTS, MAX_ATTRIBUTION_KEYS } from './validationSchema'

export const ATTRIBUTION_KEYS_ADD_BUTTON_TEST_ID = 'governance-entity-attribution-keys-add'
export const ATTRIBUTION_KEYS_ERROR_TEST_ID = 'governance-entity-attribution-keys-error'
export const ATTRIBUTION_KEYS_CHIP_TEST_ID = 'governance-entity-attribution-keys-chip'

const AttributionKeysError = (): JSX.Element | null => {
  const error = useFieldError({ noBoolean: true, translateErrors: true })

  if (!error) return null

  return (
    <Typography variant="caption" color="danger600" data-test={ATTRIBUTION_KEYS_ERROR_TEST_ID}>
      {error}
    </Typography>
  )
}

export const AttributionKeysField = withForm({
  defaultValues: GOVERNANCE_ENTITY_FORM_DEFAULTS,
  render: function AttributionKeysFieldRender({ form }) {
    const { translate } = useInternationalization()
    const [isInputRevealed, setIsInputRevealed] = useState(false)
    const inputClassName = `governance-attribution-keys-input-${useId().replaceAll(':', '-')}`

    const revealInput = (): void => {
      setIsInputRevealed(true)
      scrollToAndClickElement({ selector: `.${inputClassName} .${MUI_INPUT_BASE_ROOT_CLASSNAME}` })
    }

    return (
      <form.AppField name="attributionKeys">
        {(field) => {
          const keys = field.state.value
          const canAddKey = keys.length < MAX_ATTRIBUTION_KEYS
          const isInputVisible = isInputRevealed && canAddKey

          return (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="textSecondary">
                  {translate('text_1790236828844kl6o27txp2z')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_1790236828844d337jccs8wz')}
                </Typography>
              </div>

              <div className="flex flex-col gap-3">
                {!!keys.length && (
                  <div className="flex flex-wrap gap-2">
                    {keys.map((key, keyIndex) => (
                      <Chip
                        key={`attribution-key-${key.value}-${keyIndex}`}
                        label={key.value}
                        data-test={ATTRIBUTION_KEYS_CHIP_TEST_ID}
                        onDelete={() =>
                          field.handleChange(keys.filter((_, index) => index !== keyIndex))
                        }
                      />
                    ))}
                  </div>
                )}

                {isInputVisible && (
                  <div className="flex gap-3">
                    <field.MultipleComboBoxField
                      freeSolo
                      hideTags
                      disableClearable
                      showOptionsOnlyWhenTyping
                      className={`flex-1 ${inputClassName}`}
                      data={[]}
                      placeholder={translate('text_1790236828844qhsvau9gmzf')}
                    />

                    <Tooltip
                      className="mt-1"
                      placement="top-end"
                      title={translate('text_63aa085d28b8510cd46443ff')}
                    >
                      <Button
                        icon="trash"
                        variant="quaternary"
                        onClick={() => setIsInputRevealed(false)}
                      />
                    </Tooltip>
                  </div>
                )}

                {!isInputRevealed && canAddKey && (
                  <Button
                    fitContent
                    startIcon="plus"
                    variant="inline"
                    onClick={revealInput}
                    data-test={ATTRIBUTION_KEYS_ADD_BUTTON_TEST_ID}
                  >
                    {translate('text_17902368288445czmo8qbyq7')}
                  </Button>
                )}

                {!isInputVisible && <AttributionKeysError />}
              </div>
            </div>
          )
        }}
      </form.AppField>
    )
  },
})
