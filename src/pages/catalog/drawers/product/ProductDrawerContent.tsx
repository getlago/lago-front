import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { BASE_DRAWER_CONTENT_ATTR } from '~/components/drawers/const'
import {
  CreateMoreResetSignal,
  useCreateMoreResetIteration,
} from '~/components/drawers/createMore/useCreateMore'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { tw } from '~/styles/utils'

import { PRODUCT_FORM_DEFAULTS } from './constants'

export const PRODUCT_DRAWER_REMOVE_DESCRIPTION_TEST_ID = 'product-drawer-remove-description'
export const PRODUCT_DRAWER_SHOW_DESCRIPTION_TEST_ID = 'product-drawer-show-description'

type ProductDrawerSectionsExtraProps = {
  isEdit: boolean
  disableCodeInput: boolean
}

const productDrawerSectionsDefaultProps: ProductDrawerSectionsExtraProps = {
  isEdit: false,
  disableCodeInput: false,
}

// Holds the description-reveal state so it resets alongside the form when the
// keyed wrapper remounts after a "create more" save.
const ProductDrawerFormSections = withForm({
  defaultValues: PRODUCT_FORM_DEFAULTS,
  props: productDrawerSectionsDefaultProps,
  render: function ProductDrawerFormSectionsRender({ form, isEdit, disableCodeInput }) {
    const { translate } = useInternationalization()
    const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
      () => !!form.state.values.description,
    )

    const handleHideDescription = () => {
      // Skip the write when already empty: setFieldValue always marks the
      // field dirty, which would arm the discard-changes prompt after a
      // no-op add-description -> trash round trip.
      if (form.state.values.description) {
        form.setFieldValue('description', '')
      }
      setShouldDisplayDescription(false)
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {translate(isEdit ? 'text_1783627031283awv8tgambrd' : 'text_1783622030703h5vhmp73muk')}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_1783627031282jq9sg0b691l')}
          </Typography>
        </div>

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_17836270312826gyudi4ayy2')}
            description={translate('text_1783627031283920r4ap3cwe')}
          />

          <NameAndCodeGroup
            form={form}
            fields={{ name: 'name', code: 'code' }}
            disableCodeInput={disableCodeInput}
            disableAutoGenerateCode={isEdit}
            nameProps={{
              autoFocus: true,
              placeholder: translate('text_17836270312839ylvd3gjr17'),
            }}
            codeProps={{
              placeholder: translate('text_178362703128304wpnxjmfnu'),
            }}
          />

          {shouldDisplayDescription && (
            <div className="flex items-center">
              <form.AppField name="description">
                {(field) => (
                  <field.TextInputField
                    multiline
                    className="mr-3 flex-1"
                    label={translate('text_629728388c4d2300e2d380f1')}
                    placeholder={translate('text_1750257831368ae3rtaclhjy')}
                    rows="3"
                  />
                )}
              </form.AppField>
              <Tooltip
                className="mt-6"
                placement="top-end"
                title={translate('text_63aa085d28b8510cd46443ff')}
              >
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={handleHideDescription}
                  data-test={PRODUCT_DRAWER_REMOVE_DESCRIPTION_TEST_ID}
                />
              </Tooltip>
            </div>
          )}
          {!shouldDisplayDescription && (
            <Button
              fitContent
              startIcon="plus"
              variant="inline"
              onClick={() => setShouldDisplayDescription(true)}
              data-test={PRODUCT_DRAWER_SHOW_DESCRIPTION_TEST_ID}
            >
              {translate('text_642d5eb2783a2ad10d670324')}
            </Button>
          )}
        </CenteredPage.PageSection>

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_17423672025282dl7iozy1ru')}
            description={translate('text_1783627031283g55tf6jjlg1')}
          />

          <form.AppField name="invoiceDisplayName">
            {(field) => (
              <field.TextInputField
                label={translate('text_65a6b4e2cb38d9b70ec53d39')}
                placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
                description={translate('text_1771963033467yduu33x3qw9')}
              />
            )}
          </form.AppField>
        </CenteredPage.PageSection>
      </>
    )
  },
})

type ProductDrawerContentExtraProps = ProductDrawerSectionsExtraProps & {
  resetSignal?: CreateMoreResetSignal
}

const productDrawerContentDefaultProps: ProductDrawerContentExtraProps = {
  ...productDrawerSectionsDefaultProps,
  resetSignal: undefined,
}

// Drawer body: `children` is captured once at open(), so reactive state lives
// here; `form` is the data-passing seam. After a "create more" save the reset
// signal remounts the sections (fresh form fields + description state) with a
// fade-in, scrolls the drawer back to the top, and refocuses the Name input.
export const ProductDrawerContent = withForm({
  defaultValues: PRODUCT_FORM_DEFAULTS,
  props: productDrawerContentDefaultProps,
  render: function ProductDrawerContentRender({ form, isEdit, disableCodeInput, resetSignal }) {
    const rootRef = useRef<HTMLDivElement>(null)
    const resetIteration = useCreateMoreResetIteration(resetSignal)

    useEffect(() => {
      if (resetIteration === 0) return

      rootRef.current
        ?.closest<HTMLElement>(`[${BASE_DRAWER_CONTENT_ATTR}]`)
        ?.scrollTo({ top: 0, behavior: 'smooth' })
      focusFirstInput(rootRef.current)
    }, [resetIteration])

    return (
      <div ref={rootRef}>
        <div
          key={resetIteration}
          className={tw('flex flex-col gap-12', resetIteration > 0 && 'animate-fade-in-right')}
        >
          <ProductDrawerFormSections
            form={form}
            isEdit={isEdit}
            disableCodeInput={disableCodeInput}
          />
        </div>
      </div>
    )
  },
})
