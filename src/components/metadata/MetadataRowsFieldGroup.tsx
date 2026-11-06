import React from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { isZodErrors } from '~/core/form/isZodErrors'
import { MetadataErrorsEnum } from '~/formValidation/metadataSchema'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

type MetadataRowsValues = {
  metadata: Array<{ key: string; value: string }>
}

type MetadataRowsFieldGroupProps = {
  keyMaxLength: number
  valueMaxLength: number
  maxCount: number
  keyColumnLabel: string
  valueColumnLabel: string
  addRowLabel: string
  addRowDataTest: string
  gridClassName: string
}

const defaultValues: MetadataRowsValues = {
  metadata: [],
}

const defaultProps: MetadataRowsFieldGroupProps = {
  keyMaxLength: 0,
  valueMaxLength: 0,
  maxCount: 0,
  keyColumnLabel: '',
  valueColumnLabel: '',
  addRowLabel: '',
  addRowDataTest: '',
  gridClassName: '',
}

const KEY_PLACEHOLDER = 'text_63fcc3218d35b9377840f5a7'
const VALUE_PLACEHOLDER = 'text_63fcc3218d35b9377840f5af'
const KEY_UNIQUENESS_ERROR = 'text_63fcc3218d35b9377840f5dd'
const KEY_MAX_LENGTH_ERROR = 'text_63fcc3218d35b9377840f5d9'
const VALUE_MAX_LENGTH_ERROR = 'text_63fcc3218d35b9377840f5e5'
const KEY_REQUIRED_ERROR = 'text_1764753433918x3icklnboak'
const VALUE_REQUIRED_ERROR = 'text_1764753433918nlsnvdnwjmo'
const REMOVE_ROW_TOOLTIP = 'text_63fcc3218d35b9377840f5e1'

// A row can carry several issues at once (an empty key is also a duplicate);
// the first known one is the message the cell shows.
const getRowError = (errors: unknown): string => {
  if (!isZodErrors(errors)) return ''

  return (
    errors.find(({ message }) => Object.keys(MetadataErrorsEnum).includes(message))?.message || ''
  )
}

export const MetadataRowsFieldGroup = withFieldGroup({
  defaultValues,
  props: defaultProps,
  render: function MetadataRowsFieldGroupRender({
    group,
    keyMaxLength,
    valueMaxLength,
    maxCount,
    keyColumnLabel,
    valueColumnLabel,
    addRowLabel,
    addRowDataTest,
    gridClassName,
  }) {
    const { translate } = useInternationalization()

    const renderCell = (index: number, kind: 'key' | 'value'): JSX.Element => {
      const isKey = kind === 'key'

      return (
        <group.AppField name={`metadata[${index}].${kind}`}>
          {(field) => {
            const error = getRowError(field.state.meta.errors)
            const hasCustomError = Object.keys(MetadataErrorsEnum).includes(error)

            const getTitle = (): string | undefined => {
              if (error === MetadataErrorsEnum.uniqueness && isKey) {
                return translate(KEY_UNIQUENESS_ERROR)
              }
              if (error === MetadataErrorsEnum.maxLength) {
                return translate(isKey ? KEY_MAX_LENGTH_ERROR : VALUE_MAX_LENGTH_ERROR, {
                  max: isKey ? keyMaxLength : valueMaxLength,
                })
              }
              if (error === MetadataErrorsEnum.required) {
                return translate(isKey ? KEY_REQUIRED_ERROR : VALUE_REQUIRED_ERROR)
              }

              return undefined
            }

            return (
              <Tooltip
                placement="top-end"
                title={getTitle()}
                disableHoverListener={!hasCustomError}
              >
                <field.TextInputField
                  silentError={!hasCustomError}
                  placeholder={translate(isKey ? KEY_PLACEHOLDER : VALUE_PLACEHOLDER)}
                  displayErrorText={false}
                />
              </Tooltip>
            )
          }}
        </group.AppField>
      )
    }

    return (
      <group.AppField name="metadata" mode="array">
        {(field) => (
          <div>
            {field.state.value.length > 0 && (
              <div className={`${gridClassName} mb-1 [&>*:nth-child(2)]:col-span-2`}>
                <Typography variant="captionHl" color="grey700">
                  {keyColumnLabel}
                </Typography>
                <Typography variant="captionHl" color="grey700">
                  {valueColumnLabel}
                </Typography>
              </div>
            )}
            <div className={gridClassName}>
              {field.state.value.map((_, index) => (
                <React.Fragment key={`metadata-row-${index}`}>
                  {renderCell(index, 'key')}
                  {renderCell(index, 'value')}
                  <Tooltip
                    className="flex items-center"
                    placement="top-end"
                    title={translate(REMOVE_ROW_TOOLTIP)}
                  >
                    <Button
                      variant="quaternary"
                      size="small"
                      icon="trash"
                      onClick={() => group.removeFieldValue('metadata', index)}
                    />
                  </Tooltip>
                </React.Fragment>
              ))}
            </div>
            <Button
              className={field.state.value.length > 0 ? 'mt-4' : undefined}
              startIcon="plus"
              variant="inline"
              disabled={field.state.value.length >= maxCount}
              onClick={() => group.pushFieldValue('metadata', { key: '', value: '' })}
              data-test={addRowDataTest}
            >
              {addRowLabel}
            </Button>
          </div>
        )}
      </group.AppField>
    )
  },
})
