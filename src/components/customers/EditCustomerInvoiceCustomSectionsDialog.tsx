import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { array, mixed, object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { MultipleComboBox, RadioField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  CustomerAppliedInvoiceCustomSectionsFragmentDoc,
  EditCustomerInvoiceCustomSectionFragment,
  UpdateCustomerInput,
  useEditCustomerInvoiceCustomSectionMutation,
  useGetInvoiceCustomSectionsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment EditCustomerInvoiceCustomSection on Customer {
    id
    externalId
    configurableInvoiceCustomSections {
      id
    }
    hasOverwrittenInvoiceCustomSectionsSelection
    skipInvoiceCustomSections
  }

  query getInvoiceCustomSections {
    invoiceCustomSections {
      collection {
        id
        name
        code
      }
    }
  } 

  mutation editCustomerInvoiceCustomSection($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...CustomerAppliedInvoiceCustomSections
    }

    ${CustomerAppliedInvoiceCustomSectionsFragmentDoc}
  }
`

enum BehaviorType {
  FALLBACK = 'fallback',
  CUSTOM_SECTIONS = 'customSections',
  DEACTIVATE = 'deactivate',
}

export type EditCustomerInvoiceCustomSectionsDialogRef = DialogRef

interface EditCustomerInvoiceCustomSectionsDialogProps {
  customer: EditCustomerInvoiceCustomSectionFragment
}

export const EditCustomerInvoiceCustomSectionsDialog = forwardRef<
  DialogRef,
  EditCustomerInvoiceCustomSectionsDialogProps
>(({ customer }: EditCustomerInvoiceCustomSectionsDialogProps, ref) => {
  const { translate } = useInternationalization()

  const [getInvoiceCustomSections, { data }] = useGetInvoiceCustomSectionsLazyQuery()

  const [editCustomerDunningCampaignBehavior] = useEditCustomerInvoiceCustomSectionMutation({
    refetchQueries: ['getCustomerSettings'],
    onCompleted: () => {
      addToast({
        severity: 'success',
        message: translate('text_17352280436833uy9uxzbqn7'),
      })
    },
  })

  const formikProps = useFormik<{
    behavior: BehaviorType | ''
    configurableInvoiceCustomSectionIds: string[] | undefined
  }>({
    initialValues: {
      behavior: customer.hasOverwrittenInvoiceCustomSectionsSelection
        ? BehaviorType.CUSTOM_SECTIONS
        : customer.skipInvoiceCustomSections
          ? BehaviorType.DEACTIVATE
          : BehaviorType.FALLBACK,
      configurableInvoiceCustomSectionIds: customer.hasOverwrittenInvoiceCustomSectionsSelection
        ? customer.configurableInvoiceCustomSections?.map((section) => section.id)
        : undefined,
    },
    validationSchema: object().shape({
      behavior: mixed().oneOf(Object.values(BehaviorType)).required(''),
      configurableInvoiceCustomSectionIds: array()
        .of(string())
        .when('behavior', {
          is: (val: BehaviorType) => val === BehaviorType.CUSTOM_SECTIONS,
          then: (schema) => schema.min(1, ''),
        }),
    }),
    onSubmit: async (values) => {
      let formattedValues: UpdateCustomerInput = {
        id: customer.id,
        externalId: customer.externalId,
      }

      switch (values.behavior) {
        case BehaviorType.FALLBACK:
          formattedValues = {
            ...formattedValues,
            skipInvoiceCustomSections: false,
            configurableInvoiceCustomSectionIds: [],
          }
          break
        case BehaviorType.CUSTOM_SECTIONS:
          formattedValues = {
            ...formattedValues,
            skipInvoiceCustomSections: false,
            configurableInvoiceCustomSectionIds: values.configurableInvoiceCustomSectionIds,
          }
          break
        case BehaviorType.DEACTIVATE:
          formattedValues = {
            ...formattedValues,
            skipInvoiceCustomSections: true,
            configurableInvoiceCustomSectionIds: null,
          }
          break
      }

      await editCustomerDunningCampaignBehavior({ variables: { input: formattedValues } })
    },
    validateOnMount: true,
    enableReinitialize: true,
  })

  return (
    <Dialog
      ref={ref}
      onOpen={async () => {
        await getInvoiceCustomSections()
      }}
      title={translate('text_17352239389168sdqd97zo0t')}
      description={translate('text_1735223938916hla21yfwyzw')}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_63ea0f84f400488553caa6a5')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
            }}
          >
            {translate('text_1735223938916q9pq0j0z0ju')}
          </Button>
        </>
      )}
    >
      <div className="mb-8 not-last-child:mb-4">
        <RadioField
          name="behavior"
          formikProps={formikProps}
          value={BehaviorType.FALLBACK}
          label={translate('text_17352239389166kugn45zj95')}
          labelVariant="body"
        />
        <RadioField
          name="behavior"
          formikProps={formikProps}
          value={BehaviorType.CUSTOM_SECTIONS}
          label={translate('text_1735223938916ed8ef8phwaz')}
          labelVariant="body"
        />
        {formikProps.values.behavior === BehaviorType.CUSTOM_SECTIONS && (
          <MultipleComboBox
            hideTags={false}
            forcePopupIcon
            name="configurableInvoiceCustomSectionIds"
            data={
              data?.invoiceCustomSections?.collection.map((section) => ({
                labelNode: section.name,
                label: section.name,
                description: section.code,
                value: section.id,
              })) ?? []
            }
            onChange={(section) =>
              formikProps.setFieldValue(
                'configurableInvoiceCustomSectionIds',
                section.map(({ value }) => value),
              )
            }
            value={
              formikProps.values.configurableInvoiceCustomSectionIds?.map((id) => {
                const foundSection = data?.invoiceCustomSections?.collection.find(
                  (section) => section.id === id,
                )

                return {
                  value: id,
                  label: foundSection?.name,
                }
              }) ?? []
            }
            placeholder={translate('text_1735223938916qvvv12r7je0')}
            PopperProps={{ displayInDialog: true }}
            emptyText={translate('text_173642092241713ws50zg9v4')}
          />
        )}
        <RadioField
          name="behavior"
          formikProps={formikProps}
          value={BehaviorType.DEACTIVATE}
          label={translate('text_1735223938916dhd7cyzokib')}
          labelVariant="body"
        />
      </div>
    </Dialog>
  )
})

EditCustomerInvoiceCustomSectionsDialog.displayName = 'EditCustomerInvoiceCustomSectionsDialog'
