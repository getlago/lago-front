import { screen } from '@testing-library/react'
import { isValidElement } from 'react'

import {
  buildConnectionComboBoxData,
  ConnectionComboBoxDataItem,
  ConnectionComboBoxLabel,
} from '~/components/customerConnections/ConnectionComboBox'
import { render } from '~/test-utils'

describe('ConnectionComboBoxLabel', () => {
  describe('GIVEN a label and a subLabel are provided', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display both the label and the subLabel', () => {
        render(<ConnectionComboBoxLabel label="Stripe main" subLabel="stripe-1" />)

        expect(screen.getByText('Stripe main')).toBeInTheDocument()
        expect(screen.getByText('stripe-1')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN only a label is provided', () => {
    describe('WHEN the component is rendered without subLabel', () => {
      it('THEN should render the label and leave the caption slot empty', () => {
        const { container } = render(<ConnectionComboBoxLabel label="Stripe main" />)

        expect(screen.getByText('Stripe main')).toBeInTheDocument()
        // Two Typography nodes are always rendered; the caption is present but
        // has no text content when subLabel is undefined.
        const caption = container.querySelector('.MuiTypography-caption')

        expect(caption?.textContent).toBe('')
      })
    })
  })
})

describe('buildConnectionComboBoxData', () => {
  describe('GIVEN an empty items array', () => {
    describe('WHEN buildConnectionComboBoxData is called', () => {
      it('THEN should return an empty array', () => {
        expect(buildConnectionComboBoxData([])).toEqual([])
      })
    })
  })

  describe('GIVEN a list of items with full fields', () => {
    const items: ConnectionComboBoxDataItem[] = [
      {
        value: 'stripe-1',
        label: 'Stripe main',
        subLabel: 'stripe-1',
        group: 'stripe',
      },
      {
        value: 'netsuite-1',
        label: 'NetSuite prod',
        subLabel: 'netsuite-1',
        group: 'netsuite',
      },
    ]

    describe('WHEN buildConnectionComboBoxData is called', () => {
      const result = buildConnectionComboBoxData(items)

      it('THEN should preserve one output entry per input item', () => {
        expect(result).toHaveLength(items.length)
      })

      it.each([
        ['stripe-1', 'Stripe main', 'stripe'],
        ['netsuite-1', 'NetSuite prod', 'netsuite'],
      ])(
        'THEN should carry value=%s, label=%s and group=%s straight through',
        (value, label, group) => {
          const entry = result.find((r) => r.value === value)

          expect(entry).toMatchObject({ value, label, group })
        },
      )

      it('THEN should attach a ConnectionComboBoxLabel React node in labelNode', () => {
        result.forEach((entry, index) => {
          expect(isValidElement(entry.labelNode)).toBe(true)
          expect(entry.labelNode).toMatchObject({
            props: { label: items[index].label, subLabel: items[index].subLabel },
          })
        })
      })

      it('THEN the labelNode renders both the label and the subLabel', () => {
        const [first] = result

        render(<>{first.labelNode}</>)

        expect(screen.getByText('Stripe main')).toBeInTheDocument()
        expect(screen.getByText('stripe-1')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an item without a group', () => {
    describe('WHEN buildConnectionComboBoxData is called', () => {
      it('THEN should default the group to an empty string', () => {
        const [entry] = buildConnectionComboBoxData([{ value: 'v1', label: 'Provider A' }])

        expect(entry.group).toBe('')
      })
    })
  })

  describe('GIVEN an item without a subLabel', () => {
    describe('WHEN buildConnectionComboBoxData is called', () => {
      it('THEN should still build a labelNode that renders only the main label', () => {
        const [entry] = buildConnectionComboBoxData([{ value: 'v1', label: 'Provider A' }])

        render(<>{entry.labelNode}</>)

        expect(screen.getByText('Provider A')).toBeInTheDocument()
      })
    })
  })
})
