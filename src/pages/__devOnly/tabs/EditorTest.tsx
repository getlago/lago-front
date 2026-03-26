import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
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

const EditorTest = () => {
  const [mode, setMode] = useState<RichTextEditorMode>('edit')
  const getMarkdownRef = useRef<(() => string) | null>(null)
  const [templates, setTemplates] = useState<EditorTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  useEffect(() => {
    fetchTemplates().then((data) => {
      setTemplates(data)
      setTemplatesLoading(false)
    })
  }, [])

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


<!-- entity:plan:7a7ca2f6-a25d-406c-a021-b6e0b163c92f -->


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
      <Typography className="mt-4" variant="subhead1">
        &#60;RichTextEditor/&#62; with templates (fetched async)
      </Typography>
      <Block>
        {templatesLoading ? (
          <Typography variant="body">Loading templates...</Typography>
        ) : (
          <RichTextEditor mode={mode} mentionValues={mentionValues} templates={templates} />
        )}
      </Block>
      <Typography variant="subhead1">&#60;RichTextEditor/&#62; with pre-saved content</Typography>
      <Block>
        <RichTextEditor mode={mode} mentionValues={mentionValues} content={preSavedContent} />
      </Block>
    </Container>
  )
}

export default EditorTest
