import { FormikProps } from 'formik'
import _get from 'lodash/get'
import React, { FC } from 'react'

import { Accordion, Button, Tooltip, Typography } from '~/components/designSystem'
import { Switch, TextInputField } from '~/components/form'
import {
  METADATA_VALUE_MAX_LENGTH_DEFAULT,
  MetadataErrorsEnum,
} from '~/formValidation/metadataSchema'
import {
  CreateCustomerInput,
  CustomerMetadataInput,
  UpdateCustomerInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

const MAX_METADATA_COUNT = 5

interface MetadataAccordionProps {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
}

export interface LocalCustomerMetadata extends CustomerMetadataInput {
  localId?: string
}

export const MetadataAccordion: FC<MetadataAccordionProps> = ({ formikProps }) => {
  const { translate } = useInternationalization()

  const gridClassName = 'grid grid-cols-[200px_1fr_60px_24px] gap-x-3 gap-y-6'

  return (
    <Accordion
      variant="borderless"
      summary={
        <div className="flex flex-col gap-2">
          <Typography variant="subhead1">{translate('text_63fcc3218d35b9377840f59b')}</Typography>
          <Typography variant="caption">{translate('text_1735655045719sl0z0pooptb')}</Typography>
        </div>
      }
    >
      <div className="not-last-child:mb-4">
        {!!formikProps?.values?.metadata?.length && (
          <div>
            <div className={tw(gridClassName, 'mb-1 [&>*:nth-child(3)]:col-span-2')}>
              <Typography variant="captionHl" color="grey700">
                {translate('text_63fcc3218d35b9377840f5a3')}
              </Typography>
              <Typography variant="captionHl" color="grey700">
                {translate('text_63fcc3218d35b9377840f5ab')}
              </Typography>
              <Typography variant="captionHl" color="grey700">
                {translate('text_63fcc3218d35b9377840f5b3')}
              </Typography>
            </div>

            <div className={gridClassName}>
              {formikProps?.values?.metadata?.map((m: LocalCustomerMetadata, i) => {
                const metadataItemKeyError: string =
                  _get(formikProps.errors, `metadata.${i}.key`) || ''
                const metadataItemValueError: string =
                  _get(formikProps.errors, `metadata.${i}.value`) || ''
                const hasCustomKeyError =
                  Object.keys(MetadataErrorsEnum).includes(metadataItemKeyError)
                const hasCustomValueError =
                  Object.keys(MetadataErrorsEnum).includes(metadataItemValueError)

                return (
                  <React.Fragment key={`metadata-item-${m.id || m.localId || i}`}>
                    <Tooltip
                      placement="top-end"
                      title={
                        metadataItemKeyError === MetadataErrorsEnum.uniqueness
                          ? translate('text_63fcc3218d35b9377840f5dd')
                          : metadataItemKeyError === MetadataErrorsEnum.maxLength
                            ? translate('text_63fcc3218d35b9377840f5d9')
                            : undefined
                      }
                      disableHoverListener={!hasCustomKeyError}
                    >
                      <TextInputField
                        name={`metadata.${i}.key`}
                        silentError={!hasCustomKeyError}
                        placeholder={translate('text_63fcc3218d35b9377840f5a7')}
                        formikProps={formikProps}
                        displayErrorText={false}
                      />
                    </Tooltip>
                    <Tooltip
                      placement="top-end"
                      title={
                        metadataItemValueError === MetadataErrorsEnum.maxLength
                          ? translate('text_63fcc3218d35b9377840f5e5', {
                              max: METADATA_VALUE_MAX_LENGTH_DEFAULT,
                            })
                          : undefined
                      }
                      disableHoverListener={!hasCustomValueError}
                    >
                      <TextInputField
                        name={`metadata.${i}.value`}
                        silentError={!hasCustomValueError}
                        placeholder={translate('text_63fcc3218d35b9377840f5af')}
                        formikProps={formikProps}
                        displayErrorText={false}
                      />
                    </Tooltip>
                    <Switch
                      name={`metadata.${i}.displayInInvoice`}
                      checked={
                        !!formikProps.values.metadata?.length &&
                        !!formikProps.values.metadata[i].displayInInvoice
                      }
                      onChange={(newValue) => {
                        formikProps.setFieldValue(`metadata.${i}.displayInInvoice`, newValue)
                      }}
                    />
                    <Tooltip
                      className="flex items-center"
                      placement="top-end"
                      title={translate('text_63fcc3218d35b9377840f5e1')}
                    >
                      <Button
                        variant="quaternary"
                        size="small"
                        icon="trash"
                        onClick={() => {
                          formikProps.setFieldValue('metadata', [
                            ...(formikProps.values.metadata || []).filter((_metadata, j) => {
                              return j !== i
                            }),
                          ])
                        }}
                      />
                    </Tooltip>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )}
        <Button
          startIcon="plus"
          variant="inline"
          disabled={(formikProps?.values?.metadata?.length || 0) >= MAX_METADATA_COUNT}
          onClick={() =>
            formikProps.setFieldValue('metadata', [
              ...(formikProps.values.metadata || []),
              {
                key: '',
                value: '',
                displayInInvoice: false,
                localId: Date.now(),
              },
            ])
          }
          data-test="add-fixed-fee"
        >
          {translate('text_63fcc3218d35b9377840f5bb')}
        </Button>
      </div>
    </Accordion>
  )
}
