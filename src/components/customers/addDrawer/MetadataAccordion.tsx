import { FormikProps } from 'formik'
import _get from 'lodash/get'
import React, { FC } from 'react'
import { css, styled } from 'styled-components'

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
import { theme } from '~/styles'

const MAX_METADATA_COUNT = 5

interface MetadataAccordionProps {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
}

export interface LocalCustomerMetadata extends CustomerMetadataInput {
  localId?: string
}

export const MetadataAccordion: FC<MetadataAccordionProps> = ({ formikProps }) => {
  const { translate } = useInternationalization()

  return (
    <Accordion
      size="large"
      summary={
        <Typography variant="subhead">{translate('text_63fcc3218d35b9377840f59b')}</Typography>
      }
    >
      <AccordionContentWrapper>
        <Typography variant="body" color="grey600">
          {translate('text_63fcc3218d35b9377840f59f')}
        </Typography>
        {!!formikProps?.values?.metadata?.length && (
          <div>
            <MetadataGrid $isHeader>
              <Typography variant="captionHl" color="grey700">
                {translate('text_63fcc3218d35b9377840f5a3')}
              </Typography>
              <Typography variant="captionHl" color="grey700">
                {translate('text_63fcc3218d35b9377840f5ab')}
              </Typography>
              <Typography variant="captionHl" color="grey700">
                {translate('text_63fcc3218d35b9377840f5b3')}
              </Typography>
            </MetadataGrid>
            <MetadataGrid>
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
                    <StyledTooltip
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
                    </StyledTooltip>
                  </React.Fragment>
                )
              })}
            </MetadataGrid>
          </div>
        )}
        <Button
          startIcon="plus"
          variant="quaternary"
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
      </AccordionContentWrapper>
    </Accordion>
  )
}

const AccordionContentWrapper = styled.div<{ $largeSpacing?: boolean }>`
  &:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }

  > *:not(:last-child) {
    margin-bottom: ${({ $largeSpacing }) => ($largeSpacing ? theme.spacing(6) : theme.spacing(4))};
  }
`

const MetadataGrid = styled.div<{ $isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 200px 1fr 60px 24px;
  gap: ${theme.spacing(6)} ${theme.spacing(3)};

  ${({ $isHeader }) =>
    $isHeader &&
    css`
      margin-bottom: ${theme.spacing(1)};

      > div:nth-child(3) {
        grid-column: span 2;
      }
    `};
`

const StyledTooltip = styled(Tooltip)`
  display: flex;
  align-items: center;
`
