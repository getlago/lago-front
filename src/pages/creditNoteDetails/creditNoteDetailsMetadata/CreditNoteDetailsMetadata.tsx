import { useRef } from 'react'

import { Button, Typography } from '~/components/designSystem'
import { type GetCreditNoteForDetailsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  MetadataEditDrawer,
  MetadataEditDrawerRef,
} from '~/pages/creditNoteDetails/metadataEditDrawer/MetadataEditDrawer'
import { SectionHeader } from '~/styles/customer'

type CreditNotesDetailsMetadataProps = {
  creditNote: GetCreditNoteForDetailsQuery['creditNote']
}

const CreditNoteDetailsMetadata = ({ creditNote }: CreditNotesDetailsMetadataProps) => {
  const { translate } = useInternationalization()
  const metadataEditDrawerRef = useRef<MetadataEditDrawerRef>(null)

  const handleOpenMetadataEditDrawer = () => {
    metadataEditDrawerRef.current?.openDrawer({ creditNote })
  }

  return (
    <div>
      <SectionHeader variant="subhead1">
        {translate('text_63fcc3218d35b9377840f59b')}
        <Button variant="inline" onClick={handleOpenMetadataEditDrawer}>
          {translate('text_63e51ef4985f0ebd75c212fc')}
        </Button>
      </SectionHeader>

      <div className="mt-6">
        {!creditNote?.metadata?.length && (
          <Typography variant="caption" color="grey600">
            {translate('text_1764666863501j6vdc3bjjb9')}
          </Typography>
        )}

        {creditNote?.metadata?.map((metadata) => (
          <div key={metadata.key} className="mb-2 flex gap-x-4">
            <Typography variant="body" className="w-58" color="grey600">
              {metadata.key}
            </Typography>
            <Typography variant="body" color="grey700">
              {metadata.value}
            </Typography>
          </div>
        ))}
      </div>

      <MetadataEditDrawer ref={metadataEditDrawerRef} />
    </div>
  )
}

export default CreditNoteDetailsMetadata
