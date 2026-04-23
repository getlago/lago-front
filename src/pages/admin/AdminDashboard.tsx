import Box from '@mui/material/Box'
import { useNavigate } from 'react-router-dom'

import { Typography } from '~/components/designSystem/Typography'

const AdminDashboard = () => {
  const navigate = useNavigate()

  const cards = [
    {
      title: 'Organizations',
      description: 'Search and manage organization features',
      path: '/admin/organizations',
    },
    {
      title: 'Create Organization',
      description: 'Provision a new organization with features',
      path: '/admin/organizations/new',
    },
    {
      title: 'Compare Organizations',
      description: 'Side-by-side feature comparison',
      path: '/admin/compare',
    },
    {
      title: 'Audit Log',
      description: 'View all admin actions and changes',
      path: '/admin/audit-log',
    },
  ]

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="headline" sx={{ mb: 4 }}>
        CS Admin Panel
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
        {cards.map((card) => (
          <Box
            key={card.path}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
            }}
            onClick={() => navigate(card.path)}
          >
            <Typography variant="subhead1" sx={{ mb: 1 }}>
              {card.title}
            </Typography>
            <Typography variant="body">{card.description}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default AdminDashboard
