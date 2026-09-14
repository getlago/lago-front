import { useStore } from '@tanstack/react-form'
import React from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { isZodErrors } from '~/core/form/isZodErrors'
import { METADATA_KEY_MAX_LENGTH, MetadataErrorsEnum } from '~/formValidation/metadataSchema'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { DEFAULT_VALUES, MAX_METADATA_COUNT, METADATA_VALUE_MAX_LENGTH } from './constants'

export const ADD_METADATA_DRAWER_ADD_ROW_TEST_ID = 'add-metadata-drawer-row'

const FIELD_CONFIG = {
  key: {
    placeholder: 'text_63fcc3218d35b9377840f5a7',
    uniquenessError: 'text_63fcc3218d35b9377840f5dd',
    maxLengthError: 'text_63fcc3218d35b9377840f5d9',
    maxLength: METADATA_KEY_MAX_LENGTH,
    requiredError: 'text_1764753433918x3icklnboak',
  },
  value: {
    placeholder: 'text_63fcc3218d35b9377840f5af',
    uniquenessError: undefined,
    maxLengthError: 'text_63fcc3218d35b9377840f5e5',
    maxLength: METADATA_VALUE_MAX_LENGTH,
    requiredError: 'text_1764753433918nlsnvdnwjmo',
  },
} as const

type AddMetadataDrawerContentExtraProps = {
  isEdition: boolean
}

const addMetadataDrawerContentDefaultProps: AddMetadataDrawerContentExtraProps = {
  isEdition: false,
}

export const AddMetadataDrawerContent = withForm({
  defaultValues: DEFAULT_VALUES,
  props: addMetadataDrawerContentDefaultProps,
  render: function AddMetadataDrawerContentRender({ form, isEdition }) {
    const { translate } = useInternationalization()
    const gridClassName = 'grid grid-cols-[200px_1fr_24px] gap-x-6 gap-y-3'

    const metadata = useStore(form.store, (state) => state.values.metadata)

    // A row can carry several issues at once (an empty key is both required and
    // a duplicate); the first known one is the message the cell shows.
    const getMetadataError = (errors: unknown): string => {
      if (!isZodErrors(errors)) return ''

      return (
        errors.find(({ message }) => Object.keys(MetadataErrorsEnum).includes(message))?.message ||
        ''
      )
    }

    const renderMetadataField = (index: number, kind: 'key' | 'value'): JSX.Element => {
      const config = FIELD_CONFIG[kind]

      return (
        <form.AppField name={`metadata[${index}].${kind}`}>
          {(subField) => {
            const error = getMetadataError(subField.state.meta.errors)
            const hasCustomError = Object.keys(MetadataErrorsEnum).includes(error)

            const getTitle = (): string | undefined => {
              if (error === MetadataErrorsEnum.uniqueness && config.uniquenessError) {
                return translate(config.uniquenessError)
              }
              if (error === MetadataErrorsEnum.maxLength) {
                return translate(config.maxLengthError, { max: config.maxLength })
              }
              if (error === MetadataErrorsEnum.required) {
                return translate(config.requiredError)
              }

              return undefined
            }

            return (
              <Tooltip
                placement="top-end"
                title={getTitle()}
                disableHoverListener={!hasCustomError}
              >
                <subField.TextInputField
                  silentError={!hasCustomError}
                  placeholder={translate(config.placeholder)}
                  displayErrorText={false}
                />
              </Tooltip>
            )
          }}
        </form.AppField>
      )
    }

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate(
            isEdition ? 'text_6405cac5c833dcf18cacff6c' : 'text_6405cac5c833dcf18cacff32',
          )}
          description={translate('text_6405cac5c833dcf18cacff38')}
        />

        <CenteredPage.PageSection>
          <Typography variant="subhead1" color="grey700">
            {translate('text_6405cac5c833dcf18cacff3e')}
          </Typography>

          <form.AppField name="metadata" mode="array">
            {(field) => (
              <div>
                {metadata.length > 0 && (
                  <div className={`${gridClassName} mb-1 [&>*:nth-child(2)]:col-span-2`}>
                    <Typography variant="captionHl" color="grey700">
                      {translate('text_6405cac5c833dcf18cacff66')}
                    </Typography>
                    <Typography variant="captionHl" color="grey700">
                      {translate('text_6405cac5c833dcf18cacff7c')}
                    </Typography>
                  </div>
                )}
                <div className={gridClassName}>
                  {field.state.value.map((row, index) => (
                    <React.Fragment key={`invoice-metadata-item-${row.id || index}`}>
                      {renderMetadataField(index, 'key')}
                      {renderMetadataField(index, 'value')}
                      <Tooltip
                        className="flex items-center"
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
                    </React.Fragment>
                  ))}
                </div>
                <Button
                  className={metadata.length > 0 ? 'mt-4' : undefined}
                  startIcon="plus"
                  variant="inline"
                  disabled={metadata.length >= MAX_METADATA_COUNT}
                  onClick={() => form.pushFieldValue('metadata', { key: '', value: '' })}
                  data-test={ADD_METADATA_DRAWER_ADD_ROW_TEST_ID}
                >
                  {translate('text_6405cac5c833dcf18cacff44')}
                </Button>
              </div>
            )}
          </form.AppField>
        </CenteredPage.PageSection>
      </CenteredPage.SectionWrapper>
    )
  },
})
