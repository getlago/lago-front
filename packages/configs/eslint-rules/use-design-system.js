/**
 * ESLint rule: new UI composes the design system, it never rebuilds it. Flags a raw
 * HTML element the design system already wraps, an import or re-export of an MUI
 * component it wraps, and the legacy drawer. Each message names what to use instead.
 *
 * The design-system folders implement these components, so the root
 * `eslint.config.mjs` does not run the rule there. Usages that predate the rule are
 * baselined in `eslint-suppressions.json`. When no component fits, ask the frontend
 * team, then opt out with `// eslint-disable-next-line lago/use-design-system -- <why>`.
 */

const TYPOGRAPHY = '`Typography` from `~/components/designSystem/Typography`'
const FORM_FIELD =
  '`field.<Name>Field` from `useAppForm` inside a form, or `TextInput`, `ComboBox`, `Checkbox`, `Radio` or `Switch` from `~/components/form` outside one (see the forms reference)'
const DATE_FIELD =
  '`field.DatePickerField` from `useAppForm` inside a form, or `DatePicker` from `~/components/form` outside one'
const DIALOG =
  '`useFormDialog` from `~/components/dialogs/FormDialog` for a form, or `useCentralizedDialog` from `~/components/dialogs/CentralizedDialog` otherwise (see the dialogs reference)'
const DRAWER =
  '`useFormDrawer` for a form, or `useDrawer` otherwise, both from `~/components/drawers/useDrawer` (see the drawers reference)'
const LINK =
  '`Link` from `~/core/router`, or `ButtonLink` from `~/components/designSystem/ButtonLink` (`external` for another site)'
const POPPER = '`Popper` from `~/components/designSystem/Popper`'

// Raw element -> what to use instead.
const ELEMENTS = {
  button:
    '`Button` from `~/components/designSystem/Button` (`ButtonLink` to navigate, `ButtonSelector` from `~/components/form` for a choice)',
  a: LINK,
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

// MUI component -> what to use instead. A name covers its parts (`Table` covers
// `TableCell`), and the longest match wins, so `Table` is never read as `Tab`.
const MUI = {
  Accordion: '`Accordion` from `~/components/designSystem/Accordion`',
  Alert: '`Alert` from `~/components/designSystem/Alert`',
  Autocomplete: FORM_FIELD,
  Avatar: '`Avatar` from `~/components/designSystem/Avatar`',
  Button: '`Button` from `~/components/designSystem/Button`',
  Card: '`Card` from `~/components/designSystem/Card`',
  Checkbox: FORM_FIELD,
  Chip: '`Chip` from `~/components/designSystem/Chip`',
  CircularProgress: '`Spinner` from `~/components/designSystem/Spinner`',
  Dialog: DIALOG,
  Drawer: DRAWER,
  FilledInput: FORM_FIELD,
  Icon: '`Icon` from `lago-design-system`',
  IconButton: '`Button` with `icon` from `~/components/designSystem/Button`',
  Input: FORM_FIELD,
  Link: LINK,
  Menu: POPPER,
  Modal: DIALOG,
  NativeSelect: FORM_FIELD,
  OutlinedInput: FORM_FIELD,
  Pagination: '`PaginatedContent` from `~/components/designSystem/Pagination`',
  Popover: POPPER,
  Popper: POPPER,
  Radio: FORM_FIELD,
  Select: FORM_FIELD,
  Skeleton: '`Skeleton` from `~/components/designSystem/Skeleton`',
  Snackbar: '`addToast` from `~/core/apolloClient`',
  SwipeableDrawer: DRAWER,
  SvgIcon: '`Icon` from `lago-design-system`',
  Switch: FORM_FIELD,
  Tab: '`NavigationTab` from `~/components/designSystem/NavigationTab`',
  Table: '`Table` from `~/components/designSystem/Table`',
  TextField: FORM_FIELD,
  TextareaAutosize: FORM_FIELD,
  ToggleButton: '`ButtonSelector` from `~/components/form`',
  Tooltip: '`Tooltip` from `~/components/designSystem/Tooltip`',
  Typography: TYPOGRAPHY,
}
const MUI_NAMES = Object.keys(MUI).sort((a, b) => b.length - a.length)
// Primitives the design system does not wrap stay free, even when a covered name prefixes them.
const MUI_FREE = new Set(['InputAdornment'])

// Package -> replacement for one of its exported names, or undefined when it is free.
const PACKAGES = {
  '@mui/material': (name) => {
    if (MUI_FREE.has(name)) return undefined
    const match = MUI_NAMES.find((key) => name.startsWith(key))

    return match && MUI[match]
  },
  '@mui/x-date-pickers': (name) => (/Picker|Calendar|Clock/.test(name) ? DATE_FIELD : undefined),
}

// Legacy module -> its replacement.
const LEGACY_SOURCES = {
  '~/components/designSystem/Drawer': DRAWER,
}

const isTypeOnly = (node) =>
  node.importKind === 'type' ||
  node.exportKind === 'type' ||
  (node.specifiers?.length > 0 &&
    node.specifiers.every((s) => s.importKind === 'type' || s.exportKind === 'type'))

// The names a statement takes from its source: the imported name of `{ X as Y }`.
const namesTaken = (node) =>
  (node.specifiers ?? [])
    .filter((s) => s.importKind !== 'type' && s.exportKind !== 'type')
    .map((s) => s.imported?.name ?? s.local?.name)
    .filter((name) => name && name !== 'default')

// `<button type="submit" hidden />` lets Enter submit a form with no visible submit
// button. It renders nothing, so there is nothing to swap for `Button`.
const isHiddenSubmit = (node) => {
  const attr = (name) =>
    node.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === name)
  const type = attr('type')
  const hidden = attr('hidden')
  const alwaysHidden =
    hidden &&
    (hidden.value === null ||
      (hidden.value.type === 'JSXExpressionContainer' && hidden.value.expression.value === true))

  return node.name.name === 'button' && type?.value?.value === 'submit' && alwaysHidden
}

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
      muiNamespace:
        'Import the {{source}} parts you need by name: a namespace import or `export *` also reaches the components the design system wraps.',
    },
  },
  create(context) {
    const checkSource = (node) => {
      if (!node.source || isTypeOnly(node)) return
      const source = node.source.value

      if (LEGACY_SOURCES[source]) {
        context.report({
          node,
          messageId: 'legacyImport',
          data: { source, use: LEGACY_SOURCES[source] },
        })

        return
      }

      for (const [pkg, replacementFor] of Object.entries(PACKAGES)) {
        if (source === pkg) {
          const takesAll =
            node.type === 'ExportAllDeclaration' ||
            node.specifiers?.some((s) => s.type === 'ImportNamespaceSpecifier')

          if (takesAll) {
            context.report({ node, messageId: 'muiNamespace', data: { source } })
            continue
          }
          // Barrel import: each named import is its own component.
          for (const name of namesTaken(node)) {
            const use = replacementFor(name)

            if (use) context.report({ node, messageId: 'muiImport', data: { name, use } })
          }
        } else if (source.startsWith(`${pkg}/`)) {
          const name = source.slice(pkg.length + 1).split('/')[0]
          const use = replacementFor(name)

          if (use) context.report({ node, messageId: 'muiImport', data: { name, use } })
        }
      }
    }

    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier') return
        const use = ELEMENTS[node.name.name]

        if (!use || isHiddenSubmit(node)) return

        context.report({
          node,
          messageId: 'rawElement',
          data: { element: node.name.name, use },
        })
      },
      ImportDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ExportAllDeclaration: checkSource,
    }
  },
}
