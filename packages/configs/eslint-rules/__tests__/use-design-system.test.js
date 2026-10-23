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
  ],
})
