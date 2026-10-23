/**
 * ESLint rule: new UI composes the design system, it never rebuilds it. Flags a raw
 * HTML element the design system already wraps, a direct import of an MUI component
 * it wraps, and the legacy drawer. Each message names what to use instead.
 *
 * The design-system folders implement these components, so the root
 * `eslint.config.mjs` does not run the rule there. Usages that predate the rule are
 * baselined in `eslint-suppressions.json`. When no component fits, ask the frontend
 * team, then opt out with `// eslint-disable-next-line lago/use-design-system -- <why>`.
 */

const TYPOGRAPHY = '`Typography` from `~/components/designSystem/Typography`'
const FORM_FIELD =
  'a field from `~/components/form`, or `field.<Name>` inside `useAppForm` (see the forms reference)'
const DIALOG = '`useCentralizedDialog` from `~/components/dialogs/CentralizedDialog`'
const POPPER = '`Popper` from `~/components/designSystem/Popper`'

// Raw element -> what to use instead.
const ELEMENTS = {
  button:
    '`Button` from `~/components/designSystem/Button` (`ButtonLink` to navigate, `ButtonSelector` from `~/components/form` for a choice)',
  a: '`Link` from `~/core/router`, or `ButtonLink` from `~/components/designSystem/ButtonLink` (`external` for another site)',
  input: FORM_FIELD,
  select: FORM_FIELD,
  textarea: FORM_FIELD,
  table: '`Table` from `~/components/designSystem/Table`',
  svg: '`Icon` from `lago-design-system`, or a chart from `~/components/designSystem/graphs`',
  p: TYPOGRAPHY,
  h1: TYPOGRAPHY,
  h2: TYPOGRAPHY,
  h3: TYPOGRAPHY,
  h4: TYPOGRAPHY,
  h5: TYPOGRAPHY,
  h6: TYPOGRAPHY,
}

// `@mui/material/<Name>` -> what to use instead. A name also covers its parts
// (`Table` covers `TableCell`, `Menu` covers `MenuItem`); the longest match wins, so
// `Table` is never read as `Tab`. `Stack`, `Box`, `InputAdornment`, `styles` and other
// layout primitives stay free.
const MUI = {
  Accordion: '`Accordion` from `~/components/designSystem/Accordion`',
  Alert: '`Alert` from `~/components/designSystem/Alert`',
  Autocomplete: FORM_FIELD,
  Avatar: '`Avatar` from `~/components/designSystem/Avatar`',
  Button: '`Button` from `~/components/designSystem/Button`',
  Checkbox: FORM_FIELD,
  Chip: '`Chip` from `~/components/designSystem/Chip`',
  CircularProgress: '`Spinner` from `~/components/designSystem/Spinner`',
  Dialog: DIALOG,
  Drawer: '`useDrawer` from `~/components/drawers/useDrawer`',
  IconButton: '`Button` with `icon` from `~/components/designSystem/Button`',
  Menu: POPPER,
  Modal: DIALOG,
  Pagination: '`PaginatedContent` from `~/components/designSystem/Pagination`',
  Popover: POPPER,
  Popper: POPPER,
  Radio: FORM_FIELD,
  Select: FORM_FIELD,
  Skeleton: '`Skeleton` from `~/components/designSystem/Skeleton`',
  Snackbar: '`addToast` from `~/core/apolloClient`',
  Switch: FORM_FIELD,
  Tab: '`NavigationTab` from `~/components/designSystem/NavigationTab`',
  Table: '`Table` from `~/components/designSystem/Table`',
  TextField: FORM_FIELD,
  Tooltip: '`Tooltip` from `~/components/designSystem/Tooltip`',
  Typography: TYPOGRAPHY,
}

// Legacy module -> its replacement.
const LEGACY_SOURCES = {
  '~/components/designSystem/Drawer':
    '`useDrawer` from `~/components/drawers/useDrawer` (see the drawers reference)',
}

const MUI_PREFIX = '@mui/material/'
const MUI_NAMES = Object.keys(MUI).sort((a, b) => b.length - a.length)

const muiReplacement = (source) => {
  if (!source.startsWith(MUI_PREFIX)) return undefined
  const name = source.slice(MUI_PREFIX.length).split('/')[0]
  const match = MUI_NAMES.find((key) => name.startsWith(key))

  return match && { name, use: MUI[match] }
}

// `<button type="submit" hidden />` lets Enter submit a form that has no visible submit
// button. It renders nothing, so there is nothing to swap for `Button`.
const isHiddenButton = (node) =>
  node.name.name === 'button' &&
  node.attributes.some((attr) => attr.type === 'JSXAttribute' && attr.name.name === 'hidden')

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Use design-system components instead of raw HTML elements, wrapped MUI components or the legacy drawer.',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      rawElement: 'Use {{use}} instead of a raw <{{element}}>.',
      muiImport: 'Use {{use}} instead of importing {{name}} from MUI.',
      legacyImport: 'Use {{use}} instead of the legacy {{source}}.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier') return
        const use = ELEMENTS[node.name.name]

        if (!use || isHiddenButton(node)) return

        context.report({
          node,
          messageId: 'rawElement',
          data: { element: node.name.name, use },
        })
      },
      ImportDeclaration(node) {
        // `import type { SelectChangeEvent } from '@mui/material/Select'` renders nothing.
        if (node.importKind === 'type') return
        const source = node.source.value

        if (LEGACY_SOURCES[source]) {
          context.report({
            node,
            messageId: 'legacyImport',
            data: { source, use: LEGACY_SOURCES[source] },
          })

          return
        }

        const mui = muiReplacement(source)

        if (mui) {
          context.report({ node, messageId: 'muiImport', data: mui })
        }
      },
    }
  },
}
