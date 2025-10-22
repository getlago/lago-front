import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps, useFormik } from 'formik'
import { object } from 'yup'

import { EditInvoiceDisplayNameDialogRef } from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { FixedChargeAccordion } from '~/components/plans/FixedChargeAccordion'
import { LocalFixedChargeInput, PlanFormInput } from '~/components/plans/types'
import { MUI_BUTTON_BASE_ROOT_CLASSNAME } from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { fixedChargeSchema } from '~/formValidation/chargeSchema'
import { CurrencyEnum, FixedChargeChargeModelEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

type PrepareProps = {
  properties?: LocalFixedChargeInput['properties']
}

async function prepare({ properties }: PrepareProps = {}) {
  const FixedChargeAccordionMock = () => {
    const formikProps = useFormik<Pick<PlanFormInput, 'fixedCharges'>>({
      initialValues: {
        fixedCharges: [
          {
            addOn: {
              id: '1234',
              name: 'addOn1',
              code: 'addOn1',
            },
            chargeModel: FixedChargeChargeModelEnum.Standard,
            properties,
          },
        ],
      },
      validationSchema: object().shape({
        fixedCharges: fixedChargeSchema,
      }),
      enableReinitialize: true,
      validateOnMount: true,
      onSubmit: () => {},
    })

    return (
      <FixedChargeAccordion
        alreadyUsedChargeAlertMessage={undefined}
        currency={CurrencyEnum.Usd}
        editInvoiceDisplayNameDialogRef={{} as React.RefObject<EditInvoiceDisplayNameDialogRef>}
        formikProps={formikProps as unknown as FormikProps<PlanFormInput>}
        id="0"
        index={0}
        isEdition={false}
      />
    )
  }

  await act(() => {
    render(<FixedChargeAccordionMock />)
  })
}
describe('FixedChargeAccordion', () => {
  afterEach(cleanup)

  describe('basic rendering with dom element assessment', () => {
    it('renders a charge with no properties', async () => {
      await prepare()

      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryAllByTestId('fixed-charge-accordion-0')).toHaveLength(1)
      expect(screen.queryByTestId('fixed-charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('default-fixed-charge-accordion-0')).not.toBeInTheDocument()
    })

    it('renders a charge with properties', async () => {
      await prepare({ properties: getPropertyShape({}) })

      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryAllByTestId('fixed-charge-accordion-0')).toHaveLength(1)
      expect(screen.queryByTestId('default-fixed-charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryAllByTestId('default-fixed-charge-accordion-0')).toHaveLength(1)
    })

    it('hides all sub components if the accordion is closed', async () => {
      await prepare({
        properties: getPropertyShape({}),
      })

      const elements = screen.getAllByTestId('fixed-charge-accordion-0')

      await waitFor(() =>
        userEvent.click(
          elements[0]?.querySelector(`.${MUI_BUTTON_BASE_ROOT_CLASSNAME}`) as HTMLElement,
        ),
      )

      // After closing, only the accordion wrapper should remain (not the inner content)
      expect(screen.getByTestId('fixed-charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryAllByTestId('fixed-charge-accordion-0')).toHaveLength(1)
      expect(screen.queryByTestId('default-fixed-charge-accordion-0')).not.toBeInTheDocument()
    })
  })
})
