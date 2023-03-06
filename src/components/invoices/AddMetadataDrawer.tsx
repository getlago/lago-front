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
              isEdition ? 'id_6405e8dd5593b00054e31d9b' : 'id_6405e8dd5593b00054e31d3a'
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
        metadata: metadataSchema(),
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
        title={translate(isEdition ? 'id_6405e8dd5593b00054e31c9e' : 'id_6405e8dd5593b00054e31c6b')}
        onClose={() => {
          formikProps.resetForm()
          formikProps.validateForm()
        }}
      >
        <DrawerContent>
          <DrawerTitle>
            <Typography variant="headline">
              {translate(isEdition ? 'id_6405e8dd5593b00054e31c9f' : 'id_6405e8dd5593b00054e31c6c')}
            </Typography>
            <Typography>{translate('id_6405e8dd5593b00054e31c6d')}</Typography>
          </DrawerTitle>

          <Card>
            <Typography variant="subhead">{translate('id_6405e8dd5593b00054e31c6e')}</Typography>

            {!!formikProps?.values?.metadata?.length && (
              <div>
                <MetadataGrid $isHeader>
                  <Typography variant="captionHl" color="grey700">
                    {translate('id_6405e8dd5593b00054e31ca2')}
                  </Typography>
                  <Typography variant="captionHl" color="grey700">
                    {translate('id_6405e8dd5593b00054e31ca4')}
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
                              ? translate('id_6405e8dd5593b00054e31b9d')
                              : metadataItemKeyError === MetadataErrorsEnum.maxLength
                              ? translate('id_6405e8dd5593b00054e31b9c')
                              : undefined
                          }
                          disableHoverListener={!hasCustomKeyError}
                        >
                          <TextInputField
                            name={`metadata.${i}.key`}
                            silentError={!hasCustomKeyError}
                            placeholder={translate('id_6405e8dd5593b00054e31b5b')}
                            formikProps={formikProps}
                            displayErrorText={false}
                          />
                        </Tooltip>
                        <Tooltip
                          placement="top-end"
                          title={
                            metadataItemValueError === MetadataErrorsEnum.maxLength
                              ? translate('id_6405e8dd5593b00054e31b9f')
                              : undefined
                          }
                          disableHoverListener={!hasCustomValueError}
                        >
                          <TextInputField
                            name={`metadata.${i}.value`}
                            silentError={!hasCustomValueError}
                            placeholder={translate('id_6405e8dd5593b00054e31b5d')}
                            formikProps={formikProps}
                            displayErrorText={false}
                          />
                        </Tooltip>
                        <StyledTooltip
                          placement="top-end"
                          title={translate('id_6405e8dd5593b00054e31b9e')}
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
              {translate('id_6405e8dd5593b00054e31c6f')}
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
              {translate(isEdition ? 'id_6405e8dd5593b00054e31cad' : 'id_6405e8dd5593b00054e31c70')}
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
