import {
  CREDIT_NOTE_TYPE_TRANSLATIONS_MAP,
  creditNoteTaxError,
  creditNoteType,
} from '~/components/creditNote/utils'
import { Chip } from '~/components/designSystem/Chip'
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

  if (!type) return null

  const label = translate(CREDIT_NOTE_TYPE_TRANSLATIONS_MAP[type])

  const hasError = creditNoteTaxError({ taxProviderSyncable })

  return <Chip label={label} icon={hasError ? 'warning-filled' : undefined} />
}

export default CreditNoteBadge
