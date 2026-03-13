import { useRef, useState } from 'react'

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
  const getMarkdownRef = useRef<(() => string) | null>(null)

  const handleSave = () => {
    const markdown = getMarkdownRef.current?.()

    if (markdown) {
      // eslint-disable-next-line no-console
      console.log('Editor markdown:', markdown)
    }
  }

  const preSavedContent = `# Hello World

This is a pre-saved content with **bold** text, _italic_ text, and a [link](https://www.example.com).

- Item 1
- Item 2
- Item 3

{customerName|Customer Name} owes us {amountDue|Amount Due}.

Best,
{companyName|Company Name}
`

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
        <Button onClick={handleSave}>Save</Button>
      </div>
      <Block>
        <RichTextEditor mode={mode} mentionValues={mentionValues} getMarkdownRef={getMarkdownRef} />
      </Block>
      <Typography variant="subhead1">&#60;RichTextEditor/&#62; with pre-saved content</Typography>
      <Block>
        <RichTextEditor mode={mode} mentionValues={mentionValues} content={preSavedContent} />
      </Block>
    </Container>
  )
}

export default EditorTest
