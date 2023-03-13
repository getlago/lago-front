import React, { forwardRef, RefObject } from 'react'
import styled, { css } from 'styled-components'
import { useFormik } from 'formik'
import { object } from 'yup'
import { gql } from '@apollo/client'
import { FieldWithPossiblyUndefined } from 'lodash'
import _get from 'lodash/get'

import { Drawer, Button, DrawerRef, Typography, Tooltip } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'
import { theme, Card, DrawerTitle, DrawerContent, DrawerSubmitButton } from '~/styles'
import {
  UpdateInvoiceInput,
  InvoiceMetadatasForMetadataDrawerFragment,
  useUpdateInvoiceMetadataMutation,
} from '~/generated/graphql'
import { MetadataErrorsEnum, metadataSchema } from '~/formValidationSchemas/metadataSchema'

const MAX_METADATA_COUNT = 5
const METADATA_VALUE_MAX_LENGTH = 255

gql`
  fragment InvoiceMetadatasForMetadataDrawer on Invoice {
    id
    metadata {
      id
      key
      value
    }
  }

  mutation updateInvoiceMetadata($input: UpdateInvoiceInput!) {
    updateInvoice(input: $input) {
      id
      ...InvoiceMetadatasForMetadataDrawer
    }
  }
`

export interface AddMetadataDrawerRef extends DrawerRef {}

interface AddMetadataDrawerProps {
  invoice?: InvoiceMetadatasForMetadataDrawerFragment
}

export const AddMetadataDrawer = forwardRef<DrawerRef, AddMetadataDrawerProps>(
  ({ invoice }: AddMetadataDrawerProps, ref) => {
    const { translate } = useInternationalization()
    const isEdition = !!invoice?.metadata?.length
    const [updateInvoiceMetadata] = useUpdateInvoiceMetadataMutation({
      onCompleted({ updateInvoice }) {
        if (updateInvoice?.id) {
          addToast({
            message: translate(
              isEdition ? 'text_6405cac5c833dcf18cad01fb' : 'text_6405cac5c833dcf18cad0204'
            ),
            severity: 'success',
          })
        }
      },
    })
    const formikProps = useFormik<Omit<UpdateInvoiceInput, 'id'>>({
      initialValues: {
        metadata: invoice?.metadata ?? undefined,
      },
      validationSchema: object().shape({
        metadata: metadataSchema({ valueMaxLength: METADATA_VALUE_MAX_LENGTH }),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async (values) => {
        await updateInvoiceMetadata({
          variables: {
            input: {
              id: invoice?.id as string,
              ...values,
            },
          },
        })
        ;(ref as unknown as RefObject<DrawerRef>)?.current?.closeDrawer()
      },
    })

    return (
      <Drawer
        ref={ref}
        title={translate(
          isEdition ? 'text_6405cac5c833dcf18cacff2a' : 'text_6405cac5c833dcf18cacff2c'
        )}
        onClose={() => {
          formikProps.resetForm()
          formikProps.validateForm()
        }}
      >
        <DrawerContent>
          <DrawerTitle>
            <Typography variant="headline">
              {translate(
                isEdition ? 'text_6405cac5c833dcf18cacff6c' : 'text_6405cac5c833dcf18cacff32'
              )}
            </Typography>
            <Typography>{translate('text_6405cac5c833dcf18cacff38')}</Typography>
          </DrawerTitle>

          <Card>
            <Typography variant="subhead">{translate('text_6405cac5c833dcf18cacff3e')}</Typography>

            {!!formikProps?.values?.metadata?.length && (
              <div>
                <MetadataGrid $isHeader>
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_6405cac5c833dcf18cacff66')}
                  </Typography>
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_6405cac5c833dcf18cacff7c')}
                  </Typography>
                </MetadataGrid>
                <MetadataGrid>
                  {formikProps?.values?.metadata?.map((m, i) => {
                    const metadataItemKeyError: FieldWithPossiblyUndefined<
                      string | undefined,
                      `${number}`
                    > = _get(formikProps.errors, `metadata.${i}.key`)
                    const metadataItemValueError: FieldWithPossiblyUndefined<
                      string | undefined,
                      `${number}`
                    > = _get(formikProps.errors, `metadata.${i}.value`)
                    const hasCustomKeyError = Object.keys(MetadataErrorsEnum).includes(
                      metadataItemKeyError || ''
                    )
                    const hasCustomValueError = Object.keys(MetadataErrorsEnum).includes(
                      metadataItemValueError || ''
                    )

                    return (
                      <React.Fragment key={`metadata-item-${m.id || i}`}>
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
                                  max: METADATA_VALUE_MAX_LENGTH,
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
                                ...(formikProps.values.metadata || []).filter((metadata, j) => {
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
                  },
                ])
              }
              data-test="add-fixed-fee"
            >
              {translate('text_6405cac5c833dcf18cacff44')}
            </Button>
          </Card>

          <DrawerSubmitButton>
            <Button
              size="large"
              disabled={
                !formikProps.isValid ||
                (isEdition && !formikProps.dirty) ||
                (!formikProps.dirty && !formikProps.values.metadata?.length)
              }
              loading={formikProps.isSubmitting}
              fullWidth
              data-test="submit"
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_6405cac5c833dcf18cacffec' : 'text_6405cac5c833dcf18cacff4a'
              )}
            </Button>
          </DrawerSubmitButton>
        </DrawerContent>
      </Drawer>
    )
  }
)

const MetadataGrid = styled.div<{ $isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 200px 1fr 24px;
  gap: ${theme.spacing(6)} ${theme.spacing(3)};

  ${({ $isHeader }) =>
    $isHeader &&
    css`
      margin-bottom: ${theme.spacing(1)};

      > div:nth-child(2) {
        grid-column: span 2;
      }
    `};
`

const StyledTooltip = styled(Tooltip)`
  display: flex;
  align-items: center;
`

AddMetadataDrawer.displayName = 'AddMetadataDrawer'
