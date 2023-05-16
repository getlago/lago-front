import { forwardRef, useState, useMemo } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Dialog, Button, DialogRef, Typography } from '~/components/designSystem'
import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  LagoApiError,
  useGetTaxRatesForEditOrgaLazyQuery,
  useAssignTaxRateToOrganizationMutation,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast } from '~/core/apolloClient'
import { CREATE_TAX_ROUTE } from '~/core/router'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'

import { Item } from '../form/ComboBox/ComboBoxItem'

gql`
  query getTaxRatesForEditOrga($limit: Int, $page: Int, $searchTerm: String) {
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

  mutation assignTaxRateToOrganization($input: TaxUpdateInput!) {
    updateTax(input: $input) {
      id
    }
  }
`
export interface AddOrganizationVatRateDialogRef extends DialogRef {}

interface AddOrganizationVatRateDialogProps {
  appliedTaxRatesTaxesIds?: string[]
}

export const AddOrganizationVatRateDialog = forwardRef<
  DialogRef,
  AddOrganizationVatRateDialogProps
>(({ appliedTaxRatesTaxesIds }: AddOrganizationVatRateDialogProps, ref) => {
  const { translate } = useInternationalization()
  const [getTaxRates, { loading, data }] = useGetTaxRatesForEditOrgaLazyQuery({
    variables: { limit: 20 },
  })
  const [localVatRate, setLocalVatRate] = useState<string>('')
  const [updateVatRate] = useAssignTaxRateToOrganizationMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ updateTax }) {
      if (updateTax?.id) {
        addToast({
          message: translate('text_64639bf298650700512731ac'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getOrganizationSettings'],
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
      title={translate('text_64639c4d172d7a006ef30512')}
      description={translate('text_64639c4d172d7a006ef30513')}
      onClickAway={() => {
        setLocalVatRate('')
      }}
      onOpen={() => {
        if (!loading && !data) {
          getTaxRates()
        }
      }}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              setLocalVatRate('')
            }}
          >
            {translate('text_62728ff857d47b013204c7e4')}
          </Button>
          <Button
            variant="primary"
            disabled={!localVatRate}
            onClick={async () => {
              const res = await updateVatRate({
                variables: { input: { id: localVatRate, appliedToOrganization: true } },
              })

              if (res.errors) return
              setLocalVatRate('')
              closeDialog()
            }}
          >
            {translate('text_64639c4d172d7a006ef30518')}
          </Button>
        </>
      )}
    >
      <Content>
        <ComboBox
          allowAddValue
          addValueProps={{
            label: translate('text_64639c4d172d7a006ef30516'),
            redirectionUrl: CREATE_TAX_ROUTE,
          }}
          data={comboboxTaxRatesData}
          label={translate('text_64639c4d172d7a006ef30514')}
          loading={loading}
          onChange={setLocalVatRate}
          placeholder={translate('text_64639c4d172d7a006ef30515')}
          PopperProps={{ displayInDialog: true }}
          searchQuery={getTaxRates}
          value={localVatRate}
        />
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

AddOrganizationVatRateDialog.displayName = 'forwardRef'
