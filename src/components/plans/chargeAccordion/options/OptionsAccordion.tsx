import { AccordionDetails, AccordionSummary, Accordion as MuiAccordion } from '@mui/material'
import { ReactNode, useState } from 'react'

import { NAV_HEIGHT, theme } from '~/styles'

export type OptionsAccordionProps = {
  children: ReactNode | ((args: { isOpen: boolean }) => ReactNode)
  summary: ReactNode
}

export const OptionsAccordion = ({ children, summary }: OptionsAccordionProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-b-xl border-t border-grey-400">
      <MuiAccordion
        expanded={isOpen}
        onChange={(_, expanded) => setIsOpen(expanded)}
        TransitionProps={{ unmountOnExit: true }}
        square
      >
        <AccordionSummary
          className="min-h-18 rounded-b-xl"
          sx={{
            '&.Mui-expanded': {
              borderRadius: 0,
            },
            '&.MuiAccordionSummary-root.Mui-focusVisible': {
              backgroundColor: 'inherit',
              boxShadow: `0px 0px 0px 4px ${theme.palette.primary[200]}`,
            },
            '&:hover': {
              backgroundColor: theme.palette.grey[100],
            },
            '&:active': {
              backgroundColor: theme.palette.grey[200],
            },
            '.MuiAccordionSummary-content': {
              minHeight: `${NAV_HEIGHT}px`,
              padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
            },
          }}
        >
          {summary}
        </AccordionSummary>
        <AccordionDetails className="flex flex-col gap-6 p-4 shadow-t">
          {typeof children === 'function' ? children({ isOpen }) : children}
        </AccordionDetails>
      </MuiAccordion>
    </div>
  )
}
