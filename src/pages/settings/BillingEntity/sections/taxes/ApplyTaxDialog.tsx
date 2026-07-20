import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useMemo, useRef } from 'react'
import { z } from 'zod'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_APPLY_TAX_INPUT_CLASSNAME,
} from '~/core/constants/form'
import {
  useApplyBillingEntityTaxesMutation,
  useGetTaxesForApplyTaxLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  APPLY_TAX_DIALOG_SUBMIT_BUTTON_TEST_ID,
  APPLY_TAX_DIALOG_TEST_ID,
} from '~/pages/settings/BillingEntity/sections/taxes/dataTestConstants'

gql`
  fragment TaxItemForApplyTax on Tax {
    id
    code
    name
  }

  query getTaxesForApplyTax($limit: Int, $page: Int, $searchTerm: String) {
    taxes(limit: $limit, page: $page, order: "name", searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...TaxItemForApplyTax
      }
    }
  }

  mutation applyBillingEntityTaxes($input: ApplyTaxesInput!) {
    billingEntityApplyTaxes(input: $input) {
      __typename
    }
  }
`

export const APPLY_TAX_FORM_ID = 'apply-tax-form'

const applyTaxValidationSchema = z.object({
  taxCode: z.string().min(1),
})

export const useApplyTaxDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const billingEntityIdRef = useRef<string | null>(null)
  const successRef = useRef(false)

  const [getTaxes, { data, loading }] = useGetTaxesForApplyTaxLazyQuery({
    variables: {
      limit: 50,
    },
    notifyOnNetworkStatusChange: true,
  })

  const [applyTax] = useApplyBillingEntityTaxesMutation({
    onCompleted(_data) {
      if (_data?.billingEntityApplyTaxes) {
        successRef.current = true
        addToast({
          message: translate('text_1743600025133ouzufhpiyw8'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getBillingEntityTaxes'],
  })

  const taxes = useMemo(
    () =>
      data?.taxes?.collection?.map((item) => ({
        value: item.code,
        label: item.name,
        description: item.code,
      })) || [],
    [data],
  )

  const form = useAppForm({
    defaultValues: {
      taxCode: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: applyTaxValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const billingEntityId = billingEntityIdRef.current

      if (!billingEntityId || !value.taxCode) return

      await applyTax({
        variables: {
          input: {
            billingEntityId,
            taxCodes: [value.taxCode],
          },
        },
      })
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openApplyTaxDialog = (billingEntityId: string) => {
    billingEntityIdRef.current = billingEntityId
    form.reset()

    formDialog
      .open({
        title: translate('text_1743600025132l3aadb2il09'),
        description: <Typography>{translate('text_17436000251322d5x6wtpjq1')}</Typography>,
        closeOnError: false,
        onEntered: (container) => {
          container
            .querySelector<HTMLElement>(
              `.${SEARCH_APPLY_TAX_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            )
            ?.click()
        },
        children: (
          <div className="p-8" data-test={APPLY_TAX_DIALOG_TEST_ID}>
            <form.AppField name="taxCode">
              {(field) => (
                <field.ComboBoxField
                  className={SEARCH_APPLY_TAX_INPUT_CLASSNAME}
                  label={translate('text_1743241419870gwqt1b54uuq')}
                  loading={loading}
                  data={taxes}
                  searchQuery={getTaxes}
                  placeholder={translate('text_17436000251334xxp8qsljsk')}
                  PopperProps={{ displayInDialog: true }}
                  emptyText={translate('text_1743600025133454kb04evs6')}
                />
              )}
            </form.AppField>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest={APPLY_TAX_DIALOG_SUBMIT_BUTTON_TEST_ID}>
              {translate('text_1743600025133natje9qmw0q')}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: APPLY_TAX_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          billingEntityIdRef.current = null
        }
      })
  }

  return { openApplyTaxDialog }
}
