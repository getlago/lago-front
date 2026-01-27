// Console suppression is handled in jest-setup-early.ts (runs before imports)
import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

import muiSnapshotSerializer from './src/test-utils/snapshotSerializer'

configure({ testIdAttribute: 'data-test' })

expect.addSnapshotSerializer(muiSnapshotSerializer)
