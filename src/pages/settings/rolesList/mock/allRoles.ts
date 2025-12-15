export const allRoles = [
  {
    id: '1',
    organization: null,
    name: 'admin',
    description: 'Full access to all settings and data.',
    admin: true,
    deletedAt: null,
    members: [
      {
        id: '1',
        name: 'John Doe',
      },
      {
        id: '2',
        name: 'Jane Smith',
      },
    ],
  },
  {
    id: '2',
    organization: null,
    name: 'manager',
    description: 'Can manage most settings and data, but cannot access admin-only features.',
    admin: false,
    deletedAt: null,
    members: [],
  },
  {
    id: '3',
    organization: null,
    name: 'finance',
    description: 'Can view and manage billing and invoicing settings and data.',
    admin: false,
    deletedAt: null,
    members: [
      {
        id: '3',
        name: 'Alice Johnson',
      },
    ],
  },
]
