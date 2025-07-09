import { Icon } from 'lago-design-system'

import { CREDIT_NOTE_TYPE_TRANSLATIONS_MAP, creditNoteType } from '~/components/creditNote/utils'
import { Tooltip, Typography } from '~/components/designSystem'
import { CreditNote, CreditNoteTableItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const CreditNoteBadge = ({
  creditNote,
}: {
  creditNote?: CreditNoteTableItemFragment | CreditNote | null
}) => {
  const { translate } = useInternationalization()

  if (!creditNote) return null

  const { creditAmountCents, refundAmountCents, voidedAt, taxProviderSyncable } = creditNote

  const type = creditNoteType({
    creditAmountCents,
    refundAmountCents,
    voidedAt,
  })

  if (type === null) return null

  const label = translate(CREDIT_NOTE_TYPE_TRANSLATIONS_MAP[type])

  const hasError = taxProviderSyncable

  return (
    <Tooltip
      title={hasError ? translate('text_1727090499191gqzispoy1qz') : null}
      placement="top-start"
    >
      <div className="flex items-center gap-2 rounded-lg border border-grey-400 bg-grey-100 px-2 py-1">
        <Typography variant="bodyHl" color="grey700" className="whitespace-nowrap">
          {label}
        </Typography>

        {hasError && <Icon name="warning-unfilled" />}
      </div>
    </Tooltip>
  )
}

export default CreditNoteBadge
