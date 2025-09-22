import { gql } from '@apollo/client'
import { Button, Chip, Tooltip, Typography } from 'lago-design-system'
import { useMemo, useState } from 'react'

import { ComboBox, ComboboxItem } from '~/components/form'
import { MUI_INPUT_BASE_ROOT_CLASSNAME } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  TaxForTaxesSelectorSectionFragment,
  TaxForTaxesSelectorSectionFragmentDoc,
  useGetTaxesForTaxesSelectorSectionLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment TaxForTaxesSelectorSection on Tax {
    id
    code
    name
    rate
  }

  query getTaxesForTaxesSelectorSection($limit: Int, $page: Int, $searchTerm: String) {
    taxes(limit: $limit, page: $page, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...TaxForTaxesSelectorSection
      }
    }
  }

  ${TaxForTaxesSelectorSectionFragmentDoc}
`

export const TaxesSelectorSection = <T extends TaxForTaxesSelectorSectionFragment>({
  taxes,
  comboboxSelector,
  onUpdate,
  onDelete,
}: {
  taxes: T[]
  comboboxSelector: string
  onUpdate: (newTaxArray: T[]) => void
  onDelete: (newTaxArray: T[]) => void
}) => {
  const { translate } = useInternationalization()
  const [shouldDisplayTaxesInput, setShouldDisplayTaxesInput] = useState<boolean>(false)

  const [getTaxes, { data: taxesData, loading: taxesLoading }] =
    useGetTaxesForTaxesSelectorSectionLazyQuery({
      variables: { limit: 500 },
    })
  const { collection: taxesCollection } = taxesData?.taxes || {}

  const taxesDataForCombobox = useMemo(() => {
    if (!taxesCollection) return []

    const chargeTaxesIds = taxes?.map((tax) => tax.id) || []

    return taxesCollection.map(({ id: taxId, name, rate }) => {
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
        value: taxId,
        disabled: chargeTaxesIds.includes(taxId),
      }
    })
  }, [taxes, taxesCollection])

  return (
    <div className="flex flex-col gap-4">
      {!!taxes?.length && (
        <div className="flex flex-wrap items-center gap-3">
          {taxes.map(({ id: localTaxId, name, rate }) => (
            <Chip
              key={localTaxId}
              label={`${name} (${rate}%)`}
              type="secondary"
              size="medium"
              deleteIcon="trash"
              icon="percentage"
              deleteIconLabel={translate('text_63aa085d28b8510cd46443ff')}
              onDelete={() => {
                const newTaxedArray = taxes?.filter((tax) => tax.id !== localTaxId) || []

                onDelete(newTaxedArray)
              }}
            />
          ))}
        </div>
      )}

      {!shouldDisplayTaxesInput ? (
        <Button
          fitContent
          startIcon="plus"
          variant="inline"
          onClick={() => {
            setShouldDisplayTaxesInput(true)

            scrollToAndClickElement({
              selector: `.${comboboxSelector} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            })
          }}
          data-test="show-add-taxes"
        >
          {translate('text_64be910fba8ef9208686a8c9')}
        </Button>
      ) : (
        <div className="flex items-center gap-3">
          <ComboBox
            containerClassName="flex-1"
            className={comboboxSelector}
            data={taxesDataForCombobox}
            searchQuery={getTaxes}
            loading={taxesLoading}
            placeholder={translate('text_64be910fba8ef9208686a8e7')}
            emptyText={translate('text_64be91fd0678965126e5657b')}
            onChange={(newTaxId) => {
              const previousTaxes = [...(taxes || [])]
              const newTaxObject = taxesData?.taxes.collection.find((t) => t.id === newTaxId)

              onUpdate([...previousTaxes, newTaxObject] as T[])
              setShouldDisplayTaxesInput(false)
            }}
          />

          <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
            <Button
              icon="trash"
              variant="quaternary"
              onClick={() => {
                setShouldDisplayTaxesInput(false)
              }}
            />
          </Tooltip>
        </div>
      )}
    </div>
  )
}
