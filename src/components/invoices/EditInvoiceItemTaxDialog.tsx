import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { array, object, string } from 'yup'

import { Button, Dialog, DialogRef, Tooltip, Typography } from '~/components/designSystem'
import { ComboBox, ComboboxItem } from '~/components/form'
import { SEARCH_TAX_INPUT_FOR_INVOICE_ADD_ON_CLASSNAME } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { useGetTaxesForInvoiceEditTaxDialogQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalFeeInput } from './types'

gql`
  fragment TaxForInvoiceEditTaxDialog on Tax {
    id
    name
    rate
    code
  }

  fragment AddOnForInvoiceEditTaxDialog on AddOn {
    id
    taxes {
      id
      ...TaxForInvoiceEditTaxDialog
    }
  }

  query getTaxesForInvoiceEditTaxDialog($limit: Int, $page: Int) {
    taxes(limit: $limit, page: $page) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...TaxForInvoiceEditTaxDialog
      }
    }
  }
`

type EditInvoiceItemTaxDialogProps = {
  taxes?: LocalFeeInput['taxes']
  callback: (newTaxesArray: LocalFeeInput['taxes']) => void
}

export interface EditInvoiceItemTaxDialogRef {
  openDialog: (data: EditInvoiceItemTaxDialogProps) => unknown
  closeDialog: () => unknown
}

export const EditInvoiceItemTaxDialog = forwardRef<EditInvoiceItemTaxDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [data, setData] = useState<EditInvoiceItemTaxDialogProps>()

  const { data: taxesData, loading: taxesLoading } = useGetTaxesForInvoiceEditTaxDialogQuery({
    variables: { limit: 1000 },
  })
  const { collection: taxesCollection } = taxesData?.taxes || {}

  const formikProps = useFormik<Omit<EditInvoiceItemTaxDialogProps, 'callback'>>({
    initialValues: {
      taxes: data?.taxes || [],
    },
    validationSchema: object().shape({
      taxes: array().of(
        object().shape({
          id: string().required(''),
        }),
      ),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values, formikBag) => {
      data?.callback(values?.taxes as LocalFeeInput['taxes'])

      dialogRef?.current?.closeDialog()
      formikBag.resetForm()
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (datas) => {
      setData(datas)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_645bb193927b375079d289b5')}
      description={translate('text_64d40b7e80e64e40710a4931')}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_63eba8c65a6c8043feee2a14')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
            }}
            data-test="edit-invoice-item-tax-dialog-submit-button"
          >
            {translate('text_645bb193927b375079d289b5')}
          </Button>
        </>
      )}
      data-test="edit-invoice-item-tax-dialog"
    >
      {!formikProps.values?.taxes?.length ? (
        <Typography className="mb-4" variant="caption" color="grey600">
          {translate('text_64d40b7e80e64e40710a4935')}
        </Typography>
      ) : (
        <>
          <div className="mb-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_636bedf292786b19d3398f06')}
            </Typography>
          </div>
          <div className="mb-4 flex flex-col gap-3">
            {formikProps.values?.taxes.map((tax, i) => (
              <div key={`tax-${i}-item-${tax?.code}`} className="flex items-center gap-3">
                <ComboBox
                  disableClearable
                  containerClassName="flex-1"
                  className={SEARCH_TAX_INPUT_FOR_INVOICE_ADD_ON_CLASSNAME}
                  data={[
                    ...(taxesCollection || []).map(
                      ({ id: localTaxId = '', name = '', rate = 0 }) => {
                        const formatedRate = intlFormatNumber(Number(rate) / 100 || 0, {
                          style: 'percent',
                        })

                        return {
                          label: `${name} (${formatedRate})`,
                          labelNode: (
                            <ComboboxItem>
                              <Typography variant="body" color="grey700" noWrap>
                                {name}
                              </Typography>
                              <Typography variant="caption" color="grey600" noWrap>
                                {formatedRate}
                              </Typography>
                            </ComboboxItem>
                          ),
                          value: localTaxId,
                          disabled:
                            formikProps.values?.taxes?.map((t) => t?.id)?.includes(localTaxId) &&
                            localTaxId !== tax?.id,
                        }
                      },
                    ),
                  ]}
                  value={tax?.id || ''}
                  loading={taxesLoading}
                  placeholder={translate('text_64be910fba8ef9208686a8e7')}
                  emptyText={translate('text_64be91fd0678965126e5657b')}
                  onChange={(newTaxId) => {
                    const newTaxObject = taxesCollection?.find((t) => t?.id === newTaxId)
                    const newTaxesArray = [...(formikProps?.values?.taxes || [])].map((t, j) => {
                      if (j === i) {
                        return newTaxObject
                      }

                      return t
                    })

                    formikProps.setFieldValue('taxes', newTaxesArray)
                  }}
                  PopperProps={{ displayInDialog: true }}
                />
                <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                  <Button
                    variant="quaternary"
                    icon="trash"
                    data-test="remove-charge"
                    onClick={() => {
                      const currentTaxes = [...(formikProps.values.taxes || [])]

                      currentTaxes.splice(i, 1)
                      formikProps.setFieldValue('taxes', currentTaxes)
                    }}
                  />
                </Tooltip>
              </div>
            ))}
          </div>
        </>
      )}

      <Button
        className="mb-8 flex w-fit"
        startIcon="plus"
        variant="inline"
        onClick={() => {
          formikProps.setFieldValue('taxes', [...(formikProps.values.taxes || []), {}])
        }}
        data-test="add-tax-button"
      >
        {translate('text_645bb193927b375079d289af')}
      </Button>
    </Dialog>
  )
})

EditInvoiceItemTaxDialog.displayName = 'forwardRef'
