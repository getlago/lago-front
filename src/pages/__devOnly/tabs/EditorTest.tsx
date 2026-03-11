import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import RichTextEditor, {
  type RichTextEditorMode,
} from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { Typography } from '~/components/designSystem/Typography'

import Block from '../common/Block'
import Container from '../common/Container'

const mentionValues: Record<string, string> = {
  customerName: 'Acme Corp',
  planName: 'Pro Plan',
  amountDue: '$149.00',
  invoiceNumber: 'INV-2026-0042',
  dueDate: 'March 25, 2026',
  companyName: 'Lago Inc.',
}

const EditorTest = () => {
  const [mode, setMode] = useState<RichTextEditorMode>('edit')

  return (
    <Container>
      <Typography className="mb-4" variant="headline">
        RichTextEditor
      </Typography>
      <div className="mb-4 flex items-center gap-4">
        <Typography variant="subhead1">Simple &#60;RichTextEditor/&#62;</Typography>
        <Button
          variant={mode === 'edit' ? 'primary' : 'secondary'}
          onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
        >
          {mode === 'edit' ? 'Preview' : 'Edit'}
        </Button>
      </div>
      <Block className="h-80">
        <RichTextEditor
          mode={mode}
          mentionValues={mentionValues}
          onSave={(markdown: string) => {
            console.log('Editor markdown:', markdown)
          }}
        />
      </Block>
    </Container>
  )
}

export default EditorTest
