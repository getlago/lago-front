---
name: create-rich-text-editor-custom-node
description: Create a new custom TipTap node for the Rich Text Editor that works in edit mode, on-screen preview, and PDF download. Generates the schema, editor extension, NodeView component, CSS styles, tests, and registers the extension.
user-invocable: true
argument-hint: '<node-name and description of what it does>'
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, AskUserQuestion
---

# Create Rich Text Editor Custom Node

**Node to create:** `$ARGUMENTS`

> **Important:** If no node name or description was provided above (empty or missing), use the AskUserQuestion tool to ask the user what custom node they want to create, what data it represents, and how it should render in preview/PDF.

This skill creates a new custom TipTap node for the Rich Text Editor following the project's architecture conventions. The node will work across all three rendering contexts: edit mode (interactive), on-screen preview, and PDF download.

## Prerequisites

Before starting, read these reference files to understand the existing patterns:

### Architecture

1. **Base extensions**: `src/components/designSystem/RichTextEditor/extensions/baseExtensions.ts`
2. **Editor component**: `src/components/designSystem/RichTextEditor/RichTextEditor.tsx`
3. **PDF download**: `src/components/designSystem/RichTextEditor/downloadMarkdownPdf.ts`
4. **Editor context**: `src/components/designSystem/RichTextEditor/RichTextEditorContext.tsx`
5. **CSS styles**: `src/components/designSystem/RichTextEditor/richTextEditor.css`

### Existing custom node examples

6. **Schema with resolution data**: `src/components/designSystem/RichTextEditor/extensions/PlanBlock.schema.ts`
7. **Schema extending TipTap built-in**: `src/components/designSystem/RichTextEditor/extensions/Mention.schema.ts`
8. **Editor extension wrapping schema**: `src/components/designSystem/RichTextEditor/extensions/PlanBlock.ts`
9. **Simple node (no NodeView)**: `src/components/designSystem/RichTextEditor/extensions/LinkCard.ts`
10. **NodeView (edit mode only)**: `src/components/designSystem/RichTextEditor/PlanBlock/PlanBlockView.tsx`
11. **Schema test**: `src/components/designSystem/RichTextEditor/__tests__/PlanBlock.test.ts`
12. **NodeView test**: `src/components/designSystem/RichTextEditor/__tests__/PlanBlockView.test.tsx`

---

## Key Rules

These rules are non-negotiable. Violating them breaks the preview/PDF architecture:

1. **`renderHTML` is the single source of truth** for preview and PDF appearance. Both use `editor.getHTML()` which calls `renderHTML`. Never duplicate rendering logic in NodeViews.
2. **NodeViews are for edit mode only.** No `if (isPreview)` branches. Preview is handled by `renderHTML`.
3. **Split schema from view:** The `.schema.ts` file must have **zero React imports** (headless-safe). The `.ts` file extends it with `addNodeView()`.
4. **Resolution data flows via `addOptions()` + `.configure()`**. The schema declares options with defaults, consumers pass data at configuration time.
5. **Styles go in `richTextEditor.css`** scoped to `.ProseMirror`. They apply to both the editor and PDF automatically (stylesheets are copied into the print iframe).

---

## Implementation Steps

### Phase 1: Gather Requirements

#### Step 1.1: Determine node characteristics

Before writing code, determine:

| Question | Impact |
|---|---|
| What data does the node store? | Defines `addAttributes()` |
| Does it need external resolution data for preview/PDF? (e.g., fetching a name from an ID) | Determines if you need `addOptions()` |
| What markdown format should it serialize to? | Defines `addStorage()` |
| Does it need interactive edit mode UI? (e.g., drawer, popover) | Determines if you need a NodeView |
| Is it inline or block-level? | Sets `group: 'block'` or `group: 'inline'` |

#### Step 1.2: Choose the extension pattern

| Pattern | When to use | Files to create |
|---|---|---|
| **Schema only** (like LinkCard) | No interactive edit UI needed, no resolution data | `extensions/YourNode.ts` only |
| **Schema + NodeView** (like PlanBlock) | Needs interactive edit UI (drawer, click handlers) and/or resolution data | `extensions/YourNode.schema.ts` + `extensions/YourNode.ts` + `YourNode/YourNodeView.tsx` |

---

### Phase 2: Create the Schema

Create `src/components/designSystem/RichTextEditor/extensions/{NodeName}.schema.ts`.

The schema must include:

1. **`addOptions()`** (if the node needs resolution data for preview/PDF)
2. **`addAttributes()`** -- the node's data model with `parseHTML` for each attribute
3. **`addStorage()`** -- markdown serialization (`serialize`) and deserialization (`parse.updateDOM`)
4. **`parseHTML()`** -- how to recognize this node in HTML (tag selector)
5. **`renderHTML()`** -- how to render this node to HTML. This is the **single source of truth** for preview and PDF.

`renderHTML` guidelines:
- Check `this.options` for resolution data. If available, render the resolved view. If not, render a fallback.
- Use `mergeAttributes()` for the wrapper element to preserve TipTap's internal attributes.
- Always set `data-type` and any `data-*` attributes needed for `parseHTML` round-tripping.
- Add a CSS class for styling.

Markdown format guidelines:
- Use HTML comments for block nodes: `<!-- entity:type:id -->`
- Use inline syntax for inline nodes: `{id|label}`
- The `parse.updateDOM` regex must produce an HTML element that `parseHTML` can match.

---

### Phase 3: Create the Editor Extension (if NodeView needed)

Create `src/components/designSystem/RichTextEditor/extensions/{NodeName}.ts`.

This file:
- Imports the schema from `.schema.ts`
- Extends it with `addNodeView()` using `ReactNodeViewRenderer`
- Re-exports the attributes type

```ts
import { ReactNodeViewRenderer } from '@tiptap/react'
import { YourNodeSchema } from './YourNode.schema'
import { YourNodeView } from '../YourNode/YourNodeView'

export type { YourNodeAttributes } from './YourNode.schema'

export const YourNode = YourNodeSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(YourNodeView)
  },
})
```

---

### Phase 4: Create the NodeView Component (if needed)

Create `src/components/designSystem/RichTextEditor/{NodeName}/{NodeName}View.tsx`.

The NodeView handles **edit mode only**:
- Use `NodeViewWrapper` as the root element
- Use `node.attrs` to read the node's data
- Use `updateAttributes()` to modify the node
- Use `selected` prop for selection styling
- Access shared state via `useRichTextEditorContext()` if needed
- **Do NOT add preview branches.** Preview is handled by `renderHTML`.

If the NodeView needs a selection drawer/form:
- Create a separate `{NodeName}DrawerContent.tsx` component
- Use `useFormDrawer()` from `~/components/drawers/useDrawer`

---

### Phase 5: Add CSS Styles

Add styles in `src/components/designSystem/RichTextEditor/richTextEditor.css` inside the `.ProseMirror` scope.

Use BEM-like naming: `.node-name`, `.node-name__element`, `.node-name--modifier`.

These styles apply to both the editor and PDF automatically.

---

### Phase 6: Register the Extension

#### 6a: If the node needs resolution data

**In `RichTextEditor.tsx`** -- add to the `useEditor` extensions array:

```ts
import { YourNode } from './extensions/YourNode'

// In extensions array:
YourNode.configure({ yourData: dataFromProps }),
```

**In `downloadMarkdownPdf.ts`** -- add to the headless Editor extensions array:

```ts
import { YourNodeSchema } from './extensions/YourNode.schema'

// In extensions array:
YourNodeSchema.configure({ yourData }),
```

If the resolution data is a new prop on `RichTextEditor`, add it to `RichTextEditorProps` and pass it through. If it also needs to be available in the NodeView via context, add it to `RichTextEditorContext.tsx` and the `contextValue` in `RichTextEditor.tsx`.

Also update `DownloadMarkdownPdfOptions` in `downloadMarkdownPdf.ts` to accept the new data.

#### 6b: If the node does NOT need resolution data

Add it directly to `baseExtensions.ts`:

```ts
import { YourNode } from './YourNode'

export const getBaseExtensions = (): Extensions => [
  // ...existing extensions...
  YourNode,
]
```

This makes it available everywhere automatically -- no changes needed in `RichTextEditor.tsx` or `downloadMarkdownPdf.ts`.

---

### Phase 7: Add Tests

Create two test files:

#### Schema test: `__tests__/{NodeName}.test.ts`

Test via a real `Editor` instance (not direct `renderHTML` calls, since `renderHTML` uses `this.options`):

```ts
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { YourNodeSchema } from '../extensions/YourNode.schema'

const getHtml = (attrs: Record<string, unknown>, options?: Record<string, unknown>) => {
  const editor = new Editor({
    extensions: [StarterKit, YourNodeSchema.configure(options)],
    content: { type: 'doc', content: [{ type: 'yourNode', attrs }] },
  })
  const html = editor.getHTML()
  editor.destroy()
  return html
}
```

Test cases:
- `renderHTML` without resolution data (fallback rendering)
- `renderHTML` with resolution data (resolved rendering)
- `addStorage` markdown serialize
- `addStorage` markdown parse (updateDOM)
- `parseHTML` tag matching

#### NodeView test: `__tests__/{NodeName}View.test.tsx`

Test edit mode interactions only. No preview mode tests.

---

### Phase 8: Verification

Run all checks:

```bash
# TypeScript
npx tsc --noEmit

# All RTE tests
npx jest --no-coverage src/components/designSystem/RichTextEditor/__tests__/

# Verify the node works in PDF
# (manual: use downloadMarkdownPdf with your node's markdown format)
```

Verify:
- [ ] Schema has zero React imports
- [ ] `renderHTML` handles both resolved and fallback cases
- [ ] NodeView has no `if (isPreview)` branches
- [ ] Markdown round-trips correctly (serialize -> parse -> same node)
- [ ] CSS is scoped inside `.ProseMirror`
- [ ] Extension is registered in both `RichTextEditor.tsx` and `downloadMarkdownPdf.ts` (or in `baseExtensions.ts`)
- [ ] All existing tests still pass
- [ ] TypeScript compiles with no errors
