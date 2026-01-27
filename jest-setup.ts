// Console suppression is handled in jest-setup-early.ts (runs before imports)
import '@testing-library/jest-dom'

import muiSnapshotSerializer from './src/test-utils/snapshotSerializer'

expect.addSnapshotSerializer(muiSnapshotSerializer)
