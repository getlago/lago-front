import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps, useFormik } from 'formik'
import { object } from 'yup'

import { EditInvoiceDisplayNameRef } from '~/components/invoices/EditInvoiceDisplayName'
import { MUI_BUTTON_BASE_ROOT_CLASSNAME } from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { chargeSchema } from '~/formValidation/chargeSchema'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  GroupProperties,
} from '~/generated/graphql'
import { Properties } from '~/generated/graphql'
import { render } from '~/test-utils'

import { ChargeAccordion } from '../ChargeAccordion'
import { PlanFormInput } from '../types'

type PrepareProps = {
  properties?: Properties
  groupProperties?: GroupProperties[]
}

async function prepare({ properties, groupProperties = [] }: PrepareProps = {}) {
  const ChargeAccordionMock = () => {
    const formikProps = useFormik<Pick<PlanFormInput, 'charges'>>({
      initialValues: {
        charges: [
          {
            billableMetric: {
              id: '1234',
              name: 'bm1',
              code: 'bm1',
              aggregationType: AggregationTypeEnum.CountAgg,
              recurring: false,
              flatGroups: !!groupProperties.length
                ? [
                    {
                      id: '4567',
                      value: 'group1',
                    },
                    {
                      id: '7890',
                      value: 'group2',
                    },
                  ]
                : undefined,
            },
            chargeModel: ChargeModelEnum.Standard,
            groupProperties,
            properties,
          },
        ],
      },
      validationSchema: object().shape({
        charges: chargeSchema,
      }),
      enableReinitialize: true,
      validateOnMount: true,
      onSubmit: () => {},
    })

    return (
      <ChargeAccordion
        id="0"
        index={0}
        currency={CurrencyEnum.Usd}
        shouldDisplayAlreadyUsedChargeAlert={false}
        formikProps={formikProps as unknown as FormikProps<PlanFormInput>}
        editInvoiceDisplayNameRef={{} as React.RefObject<EditInvoiceDisplayNameRef>}
      />
    )
  }

  await act(() => {
    render(<ChargeAccordionMock />)
  })
}
describe('ChargeAccordion', () => {
  afterEach(cleanup)

  describe('basic rendering with dom element assessment', () => {
    it('renders a charge with no property and no groupProperties', async () => {
      await prepare()

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-with-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-without-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-0')).not.toBeInTheDocument()
      expect(screen.queryByTestId('charge-with-group-actions-wrapper')).not.toBeInTheDocument()
    })

    it('renders a charge with property but no groupProperties', async () => {
      await prepare({ properties: getPropertyShape({}) })

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-with-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-without-group')).toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-0')).not.toBeInTheDocument()
      expect(screen.queryByTestId('charge-with-group-actions-wrapper')).not.toBeInTheDocument()
    })

    it('renders a charge with group property but no properties', async () => {
      await prepare({ groupProperties: [{ groupId: '4567', values: getPropertyShape({}) }] })

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-with-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-without-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-with-group-actions-wrapper')).toBeInTheDocument()
    })

    it('renders a charge with property and groupProperties', async () => {
      await prepare({
        properties: getPropertyShape({}),
        groupProperties: [{ groupId: '4567', values: getPropertyShape({}) }],
      })

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-with-group')).toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-without-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-with-group-actions-wrapper')).toBeInTheDocument()
    })

    it('hides all sub components if the accordion is closed', async () => {
      await prepare({
        properties: getPropertyShape({}),
        groupProperties: [{ groupId: '4567', values: getPropertyShape({}) }],
      })

      await waitFor(() =>
        userEvent.click(
          screen
            .queryByTestId('charge-accordion-0')
            ?.querySelector(`.${MUI_BUTTON_BASE_ROOT_CLASSNAME}`) as HTMLElement,
        ),
      )

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).not.toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-with-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-without-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-0')).not.toBeInTheDocument()
      expect(screen.queryByTestId('charge-with-group-actions-wrapper')).not.toBeInTheDocument()
    })

    it('adds all groups when button is pressed', async () => {
      await prepare({
        properties: getPropertyShape({}),
        groupProperties: [{ groupId: '4567', values: getPropertyShape({}) }],
      })

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-with-group')).toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-without-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('charge-with-group-actions-wrapper')).toBeInTheDocument()

      await waitFor(() => userEvent.click(screen.queryByTestId('add-all-group-cta') as HTMLElement))

      expect(screen.queryByTestId('group-charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-1')).toBeInTheDocument()
    })
  })
})
