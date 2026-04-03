import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { downloadMarkdownPdf } from '~/components/designSystem/RichTextEditor/common/downloadMarkdownPdf'
import RichTextEditor, {
  type RichTextEditorMode,
} from '~/components/designSystem/RichTextEditor/RichTextEditor'
import type { EditorTemplate } from '~/components/designSystem/RichTextEditor/TemplateSelector/types'
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

// Simulates a GraphQL fetch: GET /api/templates
const fetchTemplates = (): Promise<EditorTemplate[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'invoice-reminder',
          name: 'Invoice Reminder',
          description: 'A polite payment reminder email',
          content:
            '# Payment Reminder\n\nDear {customerName|Customer Name},\n\nThis is a friendly reminder that invoice **{invoiceNumber|Invoice Number}** for **{amountDue|Amount Due}** is due on **{dueDate|Due Date}**.\n\nPlease let us know if you have any questions.\n\nBest regards,\n{companyName|Company Name}',
        },
        {
          id: 'welcome-email',
          name: 'Welcome Email',
          description: 'Onboarding email for new customers',
          content:
            "# Welcome to {companyName|Company Name}!\n\nHi {customerName|Customer Name},\n\nWe're excited to have you on the **{planName|Plan Name}**. Here are a few things to get you started:\n\n1. Explore your dashboard\n2. Set up your first integration\n3. Invite your team members\n\n> Need help? Reply to this email and we'll get back to you within 24 hours.\n\nCheers,\n{companyName|Company Name}",
        },
      ])
    }, 800) // simulate network latency
  })

interface EditorControlsProps {
  mode: RichTextEditorMode
  onToggleMode: () => void
  onSave?: () => void
  onDownloadPdf?: () => void
}

const EditorControls = ({ mode, onToggleMode, onSave, onDownloadPdf }: EditorControlsProps) => (
  <div className="mb-4 flex items-center gap-4">
    <Button variant={mode === 'edit' ? 'primary' : 'secondary'} onClick={onToggleMode}>
      {mode === 'edit' ? 'Preview' : 'Edit'}
    </Button>
    {onSave && <Button onClick={onSave}>Save</Button>}
    {onDownloadPdf && (
      <Button variant="secondary" onClick={onDownloadPdf}>
        Download PDF
      </Button>
    )}
  </div>
)

const EditorTest = () => {
  const [mode1, setMode1] = useState<RichTextEditorMode>('edit')
  const [mode2, setMode2] = useState<RichTextEditorMode>('edit')
  const [mode3, setMode3] = useState<RichTextEditorMode>('edit')

  const getMarkdownRef1 = useRef<(() => string) | null>(null)
  const downloadPdfRef1 = useRef<(() => void) | null>(null)

  const getMarkdownRef2 = useRef<(() => string) | null>(null)
  const downloadPdfRef2 = useRef<(() => void) | null>(null)

  const getMarkdownRef3 = useRef<(() => string) | null>(null)
  const downloadPdfRef3 = useRef<(() => void) | null>(null)

  const [templates, setTemplates] = useState<EditorTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  useEffect(() => {
    fetchTemplates().then((data) => {
      setTemplates(data)
      setTemplatesLoading(false)
    })
  }, [])

  const handleSave = (getMarkdownRef: React.RefObject<(() => string) | null>) => {
    const markdown = getMarkdownRef.current?.()

    if (markdown) {
      // eslint-disable-next-line no-console
      console.log('Editor markdown:', markdown)
    }
  }

  const preSavedContent = `# Hello World

<h3 style="background-color: rgb(255, 235, 230);">This is a header with background color</h3>

This is a pre-saved content with **bold** text, _italic_ text, and a [link](https://www.example.com).

- Item 1
- Item 2
- Item 3

{customerName|Customer Name} owes us {amountDue|Amount Due}.


<!-- entity:plan:7a7ca2f6-a25d-406c-a021-b6e0b163c92f -->


Best,
{companyName|Company Name}
`

  return (
    <Container>
      <Typography className="mb-4" variant="headline">
        RichTextEditor
      </Typography>

      <Typography variant="subhead1">Simple &#60;RichTextEditor/&#62;</Typography>
      <EditorControls
        mode={mode1}
        onToggleMode={() => setMode1(mode1 === 'edit' ? 'preview' : 'edit')}
        onSave={() => handleSave(getMarkdownRef1)}
        onDownloadPdf={() => downloadPdfRef1.current?.()}
      />
      <Block>
        <RichTextEditor
          mode={mode1}
          mentionValues={mentionValues}
          getMarkdownRef={getMarkdownRef1}
          downloadPdfRef={downloadPdfRef1}
        />
      </Block>

      <Typography className="mt-4" variant="subhead1">
        &#60;RichTextEditor/&#62; with templates (fetched async)
      </Typography>
      <EditorControls
        mode={mode2}
        onToggleMode={() => setMode2(mode2 === 'edit' ? 'preview' : 'edit')}
        onSave={() => handleSave(getMarkdownRef2)}
        onDownloadPdf={() => downloadPdfRef2.current?.()}
      />
      <Block>
        {templatesLoading ? (
          <Typography variant="body">Loading templates...</Typography>
        ) : (
          <RichTextEditor
            mode={mode2}
            mentionValues={mentionValues}
            templates={templates}
            getMarkdownRef={getMarkdownRef2}
            downloadPdfRef={downloadPdfRef2}
          />
        )}
      </Block>

      <Typography className="mt-4" variant="subhead1">
        &#60;RichTextEditor/&#62; with pre-saved content
      </Typography>
      <EditorControls
        mode={mode3}
        onToggleMode={() => setMode3(mode3 === 'edit' ? 'preview' : 'edit')}
        onSave={() => handleSave(getMarkdownRef3)}
        onDownloadPdf={() => downloadPdfRef3.current?.()}
      />
      <Block>
        <RichTextEditor
          mode={mode3}
          mentionValues={mentionValues}
          content={preSavedContent}
          getMarkdownRef={getMarkdownRef3}
          downloadPdfRef={downloadPdfRef3}
        />
      </Block>

      <div className="mt-4 flex items-center gap-4">
        <Typography variant="subhead1">Standalone PDF download (no editor)</Typography>
        <Button
          variant="secondary"
          onClick={() =>
            downloadMarkdownPdf({
              markdown: preSavedContent,
              mentionValues,
            })
          }
        >
          Download PDF from Markdown
        </Button>
      </div>
    </Container>
  )
}

export default EditorTest
