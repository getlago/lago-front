import { Extension } from '@tiptap/core'
import { Editor, Range, ReactRenderer } from '@tiptap/react'
import Suggestion, { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import tippy, { type Instance as TippyInstance } from 'tippy.js'

import { SlashMenu, type SlashMenuRef } from '../SlashMenu'

export interface SlashCommandItem {
  title: string
  description: string
  command: (editor: Editor) => void
}

interface SlashCommandDefinition {
  titleKey: string
  descriptionKey: string
  command: (editor: Editor) => void
}

export const slashCommandDefinitions: SlashCommandDefinition[] = [
  {
    titleKey: 'text_1774281559656dn2u208gh80',
    descriptionKey: 'text_1774281559656pla0xamsvmf',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    titleKey: 'text_1774281559657ec0exeaqqd3',
    descriptionKey: 'text_1774281559657q7h8pu6455p',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    titleKey: 'text_1774281559657t0kkn628zdy',
    descriptionKey: 'text_1774281559657o48ilt0rq5y',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    titleKey: 'text_1774281559657cbz20fzcjka',
    descriptionKey: 'text_17742815596575m8mqwrg1qy',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    titleKey: 'text_1774281559657yc3z031hm6x',
    descriptionKey: 'text_1774281559657y9saycc2aev',
    command: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    titleKey: 'text_1774281559657l4kkx9ws4mz',
    descriptionKey: 'text_1774281559657qdknwsvn5ka',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    titleKey: 'text_1774369903715y1h6gjc2bmd',
    descriptionKey: 'text_1774369903715o2j58u6slmw',
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'planBlock',
          attrs: { planId: '' },
        })
        .run()
    },
  },
]

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      translate: ((key: string) => key) as (key: string) => string,
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: Range
          props: SlashCommandItem
        }) => {
          editor.chain().focus().deleteRange(range).run()
          props.command(editor)
        },
        render: () => {
          let renderer: ReactRenderer<SlashMenuRef>
          let popup: TippyInstance[]

          return {
            onStart: (props: SuggestionProps<SlashCommandItem>) => {
              renderer = new ReactRenderer(SlashMenu, {
                props,
                editor: props.editor,
              })

              popup = tippy('body', {
                getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
                appendTo: () => document.body,
                content: renderer.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },
            onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
              renderer.updateProps(props)

              popup[0].setProps({
                getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
              })
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                popup[0].hide()
                return true
              }

              return renderer.ref?.onKeyDown(props) ?? false
            },
            onExit: () => {
              popup[0].destroy()
              renderer.destroy()
            },
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    const { translate } = this.options

    const resolvedItems: SlashCommandItem[] = slashCommandDefinitions.map((def) => ({
      title: translate(def.titleKey),
      description: translate(def.descriptionKey),
      command: def.command,
    }))

    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          return resolvedItems.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()),
          )
        },
      }),
    ]
  },
})
