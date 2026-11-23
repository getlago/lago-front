import { ESLint } from 'eslint'
import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const eslint = new ESLint({ cwd: fileURLToPath(new URL('../../', import.meta.url)) })
const restrictionRules = new Set([
  'no-restricted-imports',
  'no-restricted-syntax',
  'lago/no-direct-rrd-nav-import',
])

const cases = [
  ['MUI named imports', "import { Button } from '@mui/material'", 2],
  ['MUI namespace imports', "import * as Material from '@mui/material'", 2],
  ['MUI named re-exports', "export { Button } from '@mui/material'", 2],
  ['MUI star re-exports', "export * from '@mui/material'", 2],
  ['direct MUI imports', "import Button from '@mui/material/Button'", undefined],
  ['Formik imports', "import { useFormik } from 'formik'", 1],
  [
    'legacy dialog imports',
    "import { AddCustomerDialog } from '~/components/customers/AddCustomerDialog'",
    1,
  ],
  [
    'migrated dialog hooks',
    "import { useAddCustomerDialog } from '~/components/customers/AddCustomerDialog'",
    undefined,
  ],
  ['direct router navigation', "import { useNavigate } from 'react-router-dom'", 2],
  ['slug-aware router navigation', "import { useNavigate } from '~/core/router'", undefined],
]

for (const [name, source, severity] of cases) {
  test(`effective import policy: ${name}`, async () => {
    const [result] = await eslint.lintText(`${source}\n`, {
      filePath: 'src/import-policy-probe.tsx',
    })
    const restrictions = result.messages.filter(({ ruleId }) => restrictionRules.has(ruleId))

    assert.deepEqual(
      restrictions.map((message) => message.severity),
      severity === undefined ? [] : [severity],
    )
  })
}
