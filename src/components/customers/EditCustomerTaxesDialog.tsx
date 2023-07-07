import { forwardRef, useState, useMemo } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { CREATE_TAX_ROUTE } from '~/core/router'
import { Dialog, Button, DialogRef, Typography } from '~/components/designSystem'
import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  CustomerAppliedTaxRatesForSettingsFragmentDoc,
  EditCustomerTaxesFragment,
  useCreateCustomerAppliedTaxMutation,
  useGetTaxRatesForEditCustomerLazyQuery,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'

import { Item } from '../form/ComboBox/ComboBoxItem'

gql`
  fragment EditCustomerTaxes on Customer {
    id
    name
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
      }
    }
  }

  mutation createCustomerAppliedTax($input: CreateCustomerAppliedTaxInput!) {
    createCustomerAppliedTax(input: $input) {
      id
      customer {
        ...CustomerAppliedTaxRatesForSettings
      }
    }
  }

  ${CustomerAppliedTaxRatesForSettingsFragmentDoc}
`

export interface EditCustomerTaxesDialogRef extends DialogRef {}

interface EditCustomerTaxesDialogProps {
  customer: EditCustomerTaxesFragment
  appliedTaxRatesTaxesIds?: string[]
}

export const EditCustomerTaxesDialog = forwardRef<DialogRef, EditCustomerTaxesDialogProps>(
  ({ appliedTaxRatesTaxesIds, customer }: EditCustomerTaxesDialogProps, ref) => {
    const { translate } = useInternationalization()
    const [localTax, setLocalTaxRate] = useState<string>('')
    const [getTaxRates, { loading, data }] = useGetTaxRatesForEditCustomerLazyQuery({
      variables: { limit: 20 },
    })
    const [createCustomerAppliedTax] = useCreateCustomerAppliedTaxMutation({
      onCompleted({ createCustomerAppliedTax: mutationRes }) {
        if (mutationRes?.id) {
          addToast({
            message: translate('text_64639f5e63a5cc0076779de0'),
            severity: 'success',
          })
        }
      },
    })

    const comboboxTaxRatesData = useMemo(() => {
      if (!data || !data?.taxes || !data?.taxes?.collection) return []

      return data?.taxes?.collection.map((taxRate) => {
        const { id, name, rate } = taxRate

        return {
          label: `${name} - (${intlFormatNumber((rate || 0) / 100, {
            minimumFractionDigits: 2,
            style: 'percent',
          })})`,
          labelNode: (
            <Item>
              {name}&nbsp;
              <Typography color="textPrimary">
                (
                {intlFormatNumber((rate || 0) / 100, {
                  minimumFractionDigits: 2,
                  style: 'percent',
                })}
                )
              </Typography>
            </Item>
          ),
          value: id,
          disabled: appliedTaxRatesTaxesIds?.includes(id),
        }
      })
    }, [appliedTaxRatesTaxesIds, data])

    return (
      <Dialog
        ref={ref}
        title={translate('text_64639f5e63a5cc0076779d42', { name: customer.name })}
        description={translate('text_64639f5e63a5cc0076779d46')}
        onClickAway={() => {
          setLocalTaxRate('')
        }}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                setLocalTaxRate('')
              }}
            >
              {translate('text_627387d5053a1000c5287cab')}
            </Button>
            <Button
              variant="primary"
              disabled={!localTax}
              onClick={async () => {
                const res = await createCustomerAppliedTax({
                  variables: { input: { customerId: customer.id, taxId: localTax } },
                })

                if (res.errors) return
                setLocalTaxRate('')
                closeDialog()
              }}
            >
              {translate('text_64639f5e63a5cc0076779d57')}
            </Button>
          </>
        )}
      >
        <Content data-test="edit-customer-taxes-rate-dialog">
          <ComboBox
            allowAddValue
            addValueProps={{
              label: translate('text_64639c4d172d7a006ef30516'),
              redirectionUrl: CREATE_TAX_ROUTE,
            }}
            data={comboboxTaxRatesData}
            label={translate('text_64639c4d172d7a006ef30514')}
            loading={loading}
            onChange={setLocalTaxRate}
            placeholder={translate('text_64639c4d172d7a006ef30515')}
            PopperProps={{ displayInDialog: true }}
            searchQuery={getTaxRates}
            value={localTax}
          />
        </Content>
      </Dialog>
    )
  }
)

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

EditCustomerTaxesDialog.displayName = 'forwardRef'
