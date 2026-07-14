import { gql } from '@apollo/client'
import { useMemo, useRef, useState } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { ComboBox, ComboboxItem } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_CUSTOMER_CLASSNAME,
} from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CREATE_TAX_ROUTE } from '~/core/router'
import {
  CustomerAppliedTaxRatesForSettingsFragmentDoc,
  EditCustomerVatRateFragment,
  useCreateCustomerAppliedTaxMutation,
  useGetTaxRatesForEditCustomerLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import {
  DialogActionButton,
  useSetDisabledRef,
} from '~/pages/createCoupon/dialogs/DialogActionButton'

gql`
  fragment EditCustomerVatRate on Customer {
    id
    name
    displayName
    externalId
    taxes {
      id
      code
    }
  }

  query getTaxRatesForEditCustomer($limit: Int, $page: Int, $searchTerm: String) {
    taxes(limit: $limit, page: $page, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        name
        rate
        code
      }
    }
  }

  mutation createCustomerAppliedTax($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...CustomerAppliedTaxRatesForSettings
    }
  }

  ${CustomerAppliedTaxRatesForSettingsFragmentDoc}
`

export const EDIT_CUSTOMER_VAT_RATE_FORM_ID = 'edit-customer-vat-rate-form'

interface EditCustomerVatRateContentProps {
  appliedTaxRatesTaxesIds?: string[]
  onSelect: (taxCode: string) => void
}

const EditCustomerVatRateContent = ({
  appliedTaxRatesTaxesIds,
  onSelect,
}: EditCustomerVatRateContentProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const [localTax, setLocalTax] = useState<string>('')
  const [getTaxRates, { loading, data }] = useGetTaxRatesForEditCustomerLazyQuery({
    variables: { limit: 500 },
  })

  const comboboxTaxRatesData = useMemo(() => {
    if (!data || !data?.taxes || !data?.taxes?.collection) return []

    return data?.taxes?.collection.map((taxRate) => {
      const { id, name, rate, code } = taxRate
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
        value: code,
        disabled: appliedTaxRatesTaxesIds?.includes(id),
      }
    })
  }, [appliedTaxRatesTaxesIds, data])

  return (
    <div className="p-6">
      <ComboBox
        allowAddValue
        className={SEARCH_TAX_INPUT_FOR_CUSTOMER_CLASSNAME}
        addValueProps={
          hasPermissions(['organizationTaxesUpdate'])
            ? {
                label: translate('text_64639c4d172d7a006ef30516'),
                redirectionUrl: CREATE_TAX_ROUTE,
              }
            : undefined
        }
        data={comboboxTaxRatesData}
        label={translate('text_64639c4d172d7a006ef30514')}
        loading={loading}
        onChange={(value) => {
          setLocalTax(value)
          onSelect(value)
        }}
        placeholder={translate('text_64639c4d172d7a006ef30515')}
        PopperProps={{ displayInDialog: true }}
        searchQuery={getTaxRates}
        value={localTax}
      />
    </div>
  )
}

interface OpenEditCustomerVatRateDialogParams {
  customer: EditCustomerVatRateFragment
  appliedTaxRatesTaxesIds?: string[]
}

export const useEditCustomerVatRateDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const customerRef = useRef<EditCustomerVatRateFragment | null>(null)
  const taxCodeRef = useRef<string>('')
  const setDisabledRef = useSetDisabledRef()

  const [createCustomerAppliedTax] = useCreateCustomerAppliedTaxMutation({
    onCompleted({ updateCustomer: mutationRes }) {
      if (mutationRes?.id) {
        addToast({
          message: translate('text_64639f5e63a5cc0076779de0'),
          severity: 'success',
        })
      }
    },
  })

  const openEditCustomerVatRateDialog = ({
    customer,
    appliedTaxRatesTaxesIds,
  }: OpenEditCustomerVatRateDialogParams) => {
    customerRef.current = customer
    taxCodeRef.current = ''

    formDialog.open({
      title: translate('text_64639f5e63a5cc0076779d42', {
        name: customer.displayName,
      }),
      description: translate('text_64639f5e63a5cc0076779d46'),
      closeOnError: false,
      onEntered: (container) => {
        container
          .querySelector<HTMLElement>(
            `.${SEARCH_TAX_INPUT_FOR_CUSTOMER_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
          )
          ?.click()
      },
      children: (
        <EditCustomerVatRateContent
          appliedTaxRatesTaxesIds={appliedTaxRatesTaxesIds}
          onSelect={(taxCode) => {
            taxCodeRef.current = taxCode
            setDisabledRef.current(!taxCode)
          }}
        />
      ),
      mainAction: (
        <DialogActionButton
          label={translate('text_64639f5e63a5cc0076779d57')}
          setDisabledRef={setDisabledRef}
        />
      ),
      form: {
        id: EDIT_CUSTOMER_VAT_RATE_FORM_ID,
        submit: async () => {
          const activeCustomer = customerRef.current

          if (!activeCustomer || !taxCodeRef.current) {
            throw new Error('No tax rate selected')
          }

          const res = await createCustomerAppliedTax({
            variables: {
              input: {
                id: activeCustomer.id,
                taxCodes: [
                  ...(activeCustomer?.taxes?.map((t) => t.code) || []),
                  taxCodeRef.current,
                ],
                // NOTE: API should not require those fields on customer update
                // To be tackled as improvement
                externalId: activeCustomer.externalId,
                name: activeCustomer.name || '',
              },
            },
          })

          if (res.errors) {
            throw new Error('Failed to update customer applied tax')
          }
        },
      },
    })
  }

  return { openEditCustomerVatRateDialog }
}
