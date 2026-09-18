import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { useInternationalization } from '~/hooks/core/useInternationalization'

// Product Catalog plan rate-card details do not have finalized development yet.
// Keep this section read-only until BIL-709 adds the contract-scoped list and actions.
export const ContractRateCardsSection = (): JSX.Element => {
  const { translate } = useInternationalization()
  const placeholder: TablePlaceholder = {
    emptyState: {
      title: translate('text_1789030049529u2gzzho6x8x'),
      subtitle: translate('text_1789723302114au3ml0nf077'),
    },
  }

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={translate('text_1783104239825nxqno33u945')}
        description={translate('text_1789030049529jp760bke0x8')}
        contentClassName="gap-2"
      />
      <Table
        name="contract-rate-cards"
        data={[]}
        columns={[]}
        containerSize={0}
        rowSize={72}
        placeholder={placeholder}
      />
    </section>
  )
}
