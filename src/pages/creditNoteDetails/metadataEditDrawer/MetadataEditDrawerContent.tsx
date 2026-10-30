import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { isZodErrors } from '~/core/form/isZodErrors'
import { MetadataErrorsEnum } from '~/formValidation/metadataSchema'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  CREDIT_NOTE_METADATA_KEY_MAX_LENGTH,
  CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH,
  MAX_CREDIT_NOTE_METADATA_COUNT,
  METADATA_EDIT_DEFAULT_VALUES,
} from './validationSchema'

export const ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID = 'add-credit-note-metadata-row'

const GRID_CLASS_NAME = 'grid grid-cols-[200px_1fr_24px] gap-x-3'

const FIELD_CONFIG = {
  key: {
    placeholder: 'text_63fcc3218d35b9377840f5a7',
    uniquenessError: 'text_63fcc3218d35b9377840f5dd',
    maxLengthError: 'text_63fcc3218d35b9377840f5d9',
    maxLength: CREDIT_NOTE_METADATA_KEY_MAX_LENGTH,
    requiredError: 'text_1764753433918x3icklnboak',
  },
  value: {
    placeholder: 'text_63fcc3218d35b9377840f5af',
    uniquenessError: undefined,
    maxLengthError: 'text_63fcc3218d35b9377840f5e5',
    maxLength: CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH,
    requiredError: 'text_1764753433918nlsnvdnwjmo',
  },
} as const

type MetadataFieldKind = keyof typeof FIELD_CONFIG

export const MetadataEditDrawerContent = withForm({
  defaultValues: METADATA_EDIT_DEFAULT_VALUES,
  render: function MetadataEditDrawerContentRender({ form }) {
    const { translate } = useInternationalization()

    const getErrorMessage = (errors: unknown, kind: MetadataFieldKind): string | undefined => {
      if (!isZodErrors(errors)) return undefined

      const config = FIELD_CONFIG[kind]
      const codes = errors.map((error) => error.message)

      if (codes.includes(MetadataErrorsEnum.required)) {
        return translate(config.requiredError)
      }
      if (config.uniquenessError && codes.includes(MetadataErrorsEnum.uniqueness)) {
        return translate(config.uniquenessError)
      }
      if (codes.includes(MetadataErrorsEnum.maxLength)) {
        return translate(config.maxLengthError, { max: config.maxLength })
      }

      return undefined
    }

    const renderField = (index: number, kind: MetadataFieldKind) => (
      <form.AppField name={`metadata[${index}].${kind}`}>
        {(field) => (
          <field.TextInputField
            placeholder={translate(FIELD_CONFIG[kind].placeholder)}
            errorOverride={getErrorMessage(field.state.meta.errors, kind)}
          />
        )}
      </form.AppField>
    )

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate('text_176466851340792f3wzvqvb8')}
          description={translate('text_17646706795118k0wulsr7oq')}
        />

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_63fcc3218d35b9377840f59b')}
            description={translate('text_1764595550459v75grmg3do9')}
          />

          <form.AppField name="metadata" mode="array">
            {(field) => (
              <>
                {!!field.state.value.length && (
                  <div className="flex flex-col gap-y-6">
                    {field.state.value.map((_, index) => (
                      <div className="flex flex-col gap-y-1" key={`credit-note-metadata-${index}`}>
                        {index === 0 && (
                          <div className={GRID_CLASS_NAME}>
                            <Typography variant="captionHl" color="grey700">
                              {translate('text_63fcc3218d35b9377840f5a3')}
                            </Typography>
                            <Typography variant="captionHl" color="grey700">
                              {translate('text_63fcc3218d35b9377840f5ab')}
                            </Typography>
                          </div>
                        )}

                        <div className={GRID_CLASS_NAME}>
                          {renderField(index, 'key')}
                          {renderField(index, 'value')}
                          <Tooltip
                            className="mt-2 flex"
                            placement="top-end"
                            title={translate('text_63fcc3218d35b9377840f5e1')}
                          >
                            <Button
                              variant="quaternary"
                              size="small"
                              icon="trash"
                              onClick={() => form.removeFieldValue('metadata', index)}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <Button
                    startIcon="plus"
                    variant="inline"
                    disabled={field.state.value.length >= MAX_CREDIT_NOTE_METADATA_COUNT}
                    onClick={() => form.pushFieldValue('metadata', { key: '', value: '' })}
                    data-test={ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID}
                  >
                    {translate('text_63fcc3218d35b9377840f5bb')}
                  </Button>
                </div>
              </>
            )}
          </form.AppField>
        </CenteredPage.PageSection>
      </CenteredPage.SectionWrapper>
    )
  },
})
