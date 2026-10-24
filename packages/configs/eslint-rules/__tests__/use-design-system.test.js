import { RuleTester } from 'eslint'
import { describe, it } from 'node:test'
import tseslint from 'typescript-eslint'

import rule from '../use-design-system.js'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const rawElement = { messageId: 'rawElement' }

ruleTester.run('use-design-system', rule, {
  valid: [
    "import { Button } from '~/components/designSystem/Button'\nconst C = () => <Button />",
    'const C = () => <div><span>text</span></div>',
    'const C = () => <form><button type="submit" hidden /></form>',
    "import Stack from '@mui/material/Stack'",
    "import InputAdornment from '@mui/material/InputAdornment'",
    "import { styled } from '@mui/material/styles'",
    "import type { SelectChangeEvent } from '@mui/material/Select'",
    'const C = () => <Table.Row />',
    'const C = () => <form><button type="submit" hidden={true} /></form>',
    "import { type SelectChangeEvent } from '@mui/material/Select'",
    "import { InputAdornment } from '@mui/material'",
    "import type {} from '@mui/x-date-pickers/themeAugmentation'",
    "import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon'",
    "export { Button } from '~/components/designSystem/Button'",
  ],
  invalid: [
    {
      code: 'const C = () => <button onClick={go}>Go</button>',
      errors: [
        {
          message:
            'Use `Button` from `~/components/designSystem/Button` (`ButtonLink` to navigate, `ButtonSelector` from `~/components/form` for a choice) instead of a raw <button>.',
        },
      ],
    },
    {
      code: 'const C = () => <button\n  onClick={go}\n>\n  Go\n</button>',
      errors: [rawElement],
    },
    { code: 'const C = () => <a href="/x">x</a>', errors: [rawElement] },
    { code: 'const C = () => <input />', errors: [rawElement] },
    { code: 'const C = () => <table />', errors: [rawElement] },
    { code: 'const C = () => <svg />', errors: [rawElement] },
    { code: 'const C = () => <h2>Title</h2>', errors: [rawElement] },
    {
      code: "import Tabs from '@mui/material/Tabs'",
      errors: [
        {
          message:
            'Use `NavigationTab` from `~/components/designSystem/NavigationTab` instead of importing Tabs from MUI.',
        },
      ],
    },
    {
      code: "import TableCell from '@mui/material/TableCell'",
      errors: [
        {
          message:
            'Use `Table` from `~/components/designSystem/Table` instead of importing TableCell from MUI.',
        },
      ],
    },
    {
      code: "import MenuItem from '@mui/material/MenuItem'",
      errors: [{ messageId: 'muiImport' }],
    },
    {
      code: "import { Drawer, DrawerRef } from '~/components/designSystem/Drawer'",
      errors: [{ messageId: 'legacyImport' }],
    },
    { code: 'const C = () => <button hidden={!isOpen}>Go</button>', errors: [rawElement] },
    { code: 'const C = () => <button hidden>Go</button>', errors: [rawElement] },
    {
      code: 'const C = () => <input type="text" />',
      errors: [
        {
          message:
            'Use `field.<Name>Field` from `useAppForm` inside a form, or `TextInput`, `ComboBox`, `Checkbox`, `Radio` or `Switch` from `~/components/form` outside one (see the forms reference) instead of a raw <input>.',
        },
      ],
    },
    {
      code: "import Dialog from '@mui/material/Dialog'",
      errors: [
        {
          message:
            'Use `useFormDialog` from `~/components/dialogs/FormDialog` for a form, or `useCentralizedDialog` from `~/components/dialogs/CentralizedDialog` otherwise (see the dialogs reference) instead of importing Dialog from MUI.',
        },
      ],
    },
    {
      code: "import { Button, Tabs, InputAdornment } from '@mui/material'",
      errors: [
        {
          messageId: 'muiImport',
          data: { name: 'Button', use: '`Button` from `~/components/designSystem/Button`' },
        },
        {
          messageId: 'muiImport',
          data: {
            name: 'Tabs',
            use: '`NavigationTab` from `~/components/designSystem/NavigationTab`',
          },
        },
      ],
    },
    { code: "import Link from '@mui/material/Link'", errors: [{ messageId: 'muiImport' }] },
    {
      code: "import InputBase from '@mui/material/InputBase'",
      errors: [{ messageId: 'muiImport' }],
    },
    {
      code: "import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'",
      errors: [{ messageId: 'muiImport' }],
    },
    {
      code: "import { DatePicker } from '@mui/x-date-pickers/DatePicker'",
      errors: [{ messageId: 'muiImport' }],
    },
    {
      code: "export { default as Tabs } from '@mui/material/Tabs'",
      errors: [{ messageId: 'muiImport' }],
    },
    {
      code: "import { Card, CardContent } from '@mui/material'",
      errors: [{ messageId: 'muiImport' }, { messageId: 'muiImport' }],
    },
    {
      code: "import SvgIcon from '@mui/material/SvgIcon'",
      errors: [
        {
          messageId: 'muiImport',
          data: { name: 'SvgIcon', use: '`Icon` from `lago-design-system`' },
        },
      ],
    },
    {
      code: "import IconButton from '@mui/material/IconButton'",
      errors: [
        {
          messageId: 'muiImport',
          data: {
            name: 'IconButton',
            use: '`Button` with `icon` from `~/components/designSystem/Button`',
          },
        },
      ],
    },
    {
      code: "import NativeSelect from '@mui/material/NativeSelect'",
      errors: [{ messageId: 'muiImport' }],
    },
    {
      code: "import Select, { type SelectChangeEvent } from '@mui/material/Select'",
      errors: [{ messageId: 'muiImport' }],
    },
    {
      code: "import * as Mui from '@mui/material'\nconst C = () => <Mui.Button />",
      errors: [{ messageId: 'muiNamespace' }],
    },
    { code: "export * from '@mui/material'", errors: [{ messageId: 'muiNamespace' }] },
    { code: "export * as Mui from '@mui/material'", errors: [{ messageId: 'muiNamespace' }] },
    {
      code: "export * from '~/components/designSystem/Drawer'",
      errors: [{ messageId: 'legacyImport' }],
    },
  ],
})
