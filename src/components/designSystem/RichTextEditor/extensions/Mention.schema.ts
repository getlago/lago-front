import Mention, { type MentionOptions } from '@tiptap/extension-mention'

/**
 * Escapes HTML-significant characters so a mention `id`/`label` parsed from
 * stored markdown cannot break out of the attribute/text context and inject
 * markup when written back via innerHTML.
 */
const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

/**
 * Shared Mention schema — markdown storage and resolution-aware renderHTML.
 * Used by both the editor (which adds addNodeView + suggestion) and headless consumers.
 *
 * When `mentionValues` is provided via configure(), renderHTML produces resolved output.
 * This is the single source of truth for how mentions look in both preview and PDF.
 */
export const MentionSchema = Mention.extend({
  addOptions() {
    return {
      ...(this as unknown as { parent: () => MentionOptions }).parent(),
      mentionValues: {} as Record<string, string>,
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (text: string) => void },
          node: { attrs: { id: string; label?: string } },
        ) {
          state.write(`{${node.attrs.id}|${node.attrs.label ?? node.attrs.id}}`)
        },
        parse: {
          updateDOM(element: HTMLElement) {
            // Safe: both interpolated captures pass through escapeHtml, so no
            // markup can be injected. The sink is flagged only because the
            // sanitizer is applied inside the replacer rather than wrapping the
            // whole expression, which the static check can't see.
            // react-doctor-disable-next-line react-doctor/dangerous-html-sink
            element.innerHTML = element.innerHTML.replaceAll(
              /\{(\w+)\|([^}]+)\}/g,
              (_match: string, id: string, label: string) =>
                `<span data-type="mention" data-id="${escapeHtml(id)}" data-label="${escapeHtml(label)}" class="variable-mention">@${escapeHtml(label)}</span>`,
            )
          },
        },
      },
    }
  },

  renderHTML({ node }) {
    const id = node.attrs.id as string
    const label = (node.attrs.label as string | undefined) ?? id
    const mentionValues = (this.options as { mentionValues?: Record<string, string> }).mentionValues
    // Resolution is keyed on the variable being present in mentionValues: a
    // present-but-empty/null value resolves to nothing (empty variables
    // disappear), while an absent id (unknown variable, or edit mode with no
    // configured values) keeps the @label token.
    const isResolved = !!mentionValues && Object.hasOwn(mentionValues, id)

    if (isResolved) {
      return [
        'span',
        {
          'data-type': 'mention',
          'data-id': id,
          class: 'variable-mention variable-mention--resolved',
        },
        mentionValues[id] ?? '',
      ]
    }

    return [
      'span',
      { 'data-type': 'mention', 'data-id': id, class: 'variable-mention' },
      `@${label}`,
    ]
  },
})

export interface MentionSchemaOptions extends Partial<MentionOptions> {
  mentionValues?: Record<string, string>
}

export const mentionBaseConfig: MentionSchemaOptions = {
  HTMLAttributes: { class: 'variable-mention' },
}

/**
 * Type-safe configure helper that accepts the extended MentionSchemaOptions.
 * TipTap's .configure() is typed for Partial<MentionOptions> which doesn't include
 * our custom `mentionValues` option, so this helper avoids type assertions at call sites.
 */
export const configureMention = (options: MentionSchemaOptions) =>
  MentionSchema.configure(options as Partial<MentionOptions>)
