import { useStore } from '@tanstack/react-form'
import React from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { isZodErrors } from '~/core/form/isZodErrors'
import { MetadataErrorsEnum } from '~/formValidation/metadataSchema'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  DEFAULT_VALUES,
  ITEM_METADATA_KEY_MAX_LENGTH,
  ITEM_METADATA_VALUE_MAX_LENGTH,
  MAX_ITEM_METADATA_COUNT,
} from './constants'

export const ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID = 'add-item-metadata-drawer-row'

interface ItemMetadataDrawerContentExtraProps {
  // Owner-specific copy, e.g. "Store custom key-value pairs on this plan."
  description: string
}

const itemMetadataDrawerContentDefaultProps: ItemMetadataDrawerContentExtraProps = {
  description: '',
}

export const ItemMetadataDrawerContent = withForm({
  defaultValues: DEFAULT_VALUES,
  props: itemMetadataDrawerContentDefaultProps,
  render: function ItemMetadataDrawerContentRender({ form, description }) {
    const { translate } = useInternationalization()
    const gridClassName = 'grid grid-cols-[200px_1fr_24px] gap-x-3 gap-y-6'

    const getMetadataError = (errors: unknown): string => {
      if (!isZodErrors(errors)) return ''

      return errors.map((e) => e.message).join('')
    }

    const metadata = useStore(form.store, (state) => state.values.metadata)

    const handleFormSubmit = (event: React.FormEvent) => {
      event.preventDefault()
      form.handleSubmit()
    }

    return (
      <form onSubmit={handleFormSubmit}>
        <button type="submit" hidden aria-hidden="true" />
        <CenteredPage.SectionWrapper>
          <CenteredPage.PageTitle
            title={translate('text_63fcc3218d35b9377840f59b')}
            description={description}
          />

          <CenteredPage.PageSection>
            <form.AppField name="metadata" mode="array">
              {(field) => (
                <div>
                  {metadata.length > 0 && (
                    <div className={`${gridClassName} mb-1`}>
                      <Typography variant="captionHl" color="grey700">
                        {translate('text_63fcc3218d35b9377840f5a3')}
                      </Typography>
                      <Typography variant="captionHl" color="grey700">
                        {translate('text_63fcc3218d35b9377840f5ab')}
                      </Typography>
                    </div>
                  )}
                  <div className={gridClassName}>
                    {field.state.value.map((_, index) => (
                      <React.Fragment key={`item-metadata-item-${index}`}>
                        <form.AppField name={`metadata[${index}].key`}>
                          {(subField) => {
                            const error = getMetadataError(subField.state.meta.errors)
                            const hasCustomError = Object.keys(MetadataErrorsEnum).includes(error)

                            const getTitle = () => {
                              if (error === MetadataErrorsEnum.uniqueness) {
                                return translate('text_63fcc3218d35b9377840f5dd')
                              }
                              if (error === MetadataErrorsEnum.maxLength) {
                                return translate('text_63fcc3218d35b9377840f5d9', {
                                  max: ITEM_METADATA_KEY_MAX_LENGTH,
                                })
                              }
                              if (error === MetadataErrorsEnum.required) {
                                return translate('text_1764753433918x3icklnboak')
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
                                  placeholder={translate('text_63fcc3218d35b9377840f5a7')}
                                  displayErrorText={false}
                                />
                              </Tooltip>
                            )
                          }}
                        </form.AppField>
                        <form.AppField name={`metadata[${index}].value`}>
                          {(subField) => {
                            const error = getMetadataError(subField.state.meta.errors)
                            const hasCustomError = Object.keys(MetadataErrorsEnum).includes(error)

                            const getTitle = () => {
                              if (error === MetadataErrorsEnum.maxLength) {
                                return translate('text_63fcc3218d35b9377840f5e5', {
                                  max: ITEM_METADATA_VALUE_MAX_LENGTH,
                                })
                              }
                              if (error === MetadataErrorsEnum.required) {
                                return translate('text_1764753433918nlsnvdnwjmo')
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
                                  placeholder={translate('text_63fcc3218d35b9377840f5af')}
                                  displayErrorText={false}
                                />
                              </Tooltip>
                            )
                          }}
                        </form.AppField>
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
                    disabled={metadata.length >= MAX_ITEM_METADATA_COUNT}
                    onClick={() => form.pushFieldValue('metadata', { key: '', value: '' })}
                    data-test={ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID}
                  >
                    {translate('text_6405cac5c833dcf18cad0196')}
                  </Button>
                </div>
              )}
            </form.AppField>
          </CenteredPage.PageSection>
        </CenteredPage.SectionWrapper>
      </form>
    )
  },
})
