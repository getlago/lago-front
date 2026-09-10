import { useEffect, useMemo, useRef, useState } from 'react'

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
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { tw } from '~/styles/utils'

import {
  CATALOG_PLAN_DRAWER_REMOVE_DESCRIPTION_TEST_ID,
  CATALOG_PLAN_DRAWER_SHOW_DESCRIPTION_TEST_ID,
  CATALOG_PLAN_DRAWER_TITLE_CREATE_KEY,
  CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY,
  CATALOG_PLAN_FORM_DEFAULTS,
} from './constants'

type CatalogPlanDrawerSectionsExtraProps = {
  isEdit: boolean
  disableCodeInput: boolean
  disableCurrencyInput: boolean
}

const catalogPlanDrawerSectionsDefaultProps: CatalogPlanDrawerSectionsExtraProps = {
  isEdit: false,
  disableCodeInput: false,
  disableCurrencyInput: false,
}

const CatalogPlanDrawerFormSections = withForm({
  defaultValues: CATALOG_PLAN_FORM_DEFAULTS,
  props: catalogPlanDrawerSectionsDefaultProps,
  render: function CatalogPlanDrawerFormSectionsRender({
    form,
    isEdit,
    disableCodeInput,
    disableCurrencyInput,
  }) {
    const { translate } = useInternationalization()
    const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
      () => !!form.state.values.description,
    )

    const currencyComboboxData = useMemo(
      () => Object.values(CurrencyEnum).map((currency) => ({ value: currency, label: currency })),
      [],
    )

    const handleHideDescription = (): void => {
      // Skip the write when already empty: setFieldValue always marks the field
      // dirty, which would arm the discard prompt after a no-op round trip.
      if (form.state.values.description) {
        form.setFieldValue('description', '')
      }
      setShouldDisplayDescription(false)
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {translate(
              isEdit ? CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY : CATALOG_PLAN_DRAWER_TITLE_CREATE_KEY,
            )}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_17890300495297g290y7et77')}
          </Typography>
        </div>

        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_1789030049529u3ir4amu9hm')}
              description={translate('text_1789030049529625oe5wbt34')}
            />

            <NameAndCodeGroup
              form={form}
              fields={{ name: 'name', code: 'code' }}
              disableCodeInput={disableCodeInput}
              disableAutoGenerateCode={isEdit}
              nameProps={{
                autoFocus: true,
                placeholder: translate('text_17890300495297ou6ajze8ia'),
              }}
              codeProps={{
                placeholder: translate('text_17890300495294bo4562celz'),
                ...(disableCodeInput && {
                  helperText: translate('text_1789030049529z3g1y1pk6ko'),
                }),
              }}
            />

            {shouldDisplayDescription && (
              <div className="flex items-center">
                <form.AppField name="description">
                  {(field) => (
                    <field.TextInputField
                      multiline
                      className="mr-3 flex-1"
                      label={translate('text_6388b923e514213fed58331c')}
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
                    data-test={CATALOG_PLAN_DRAWER_REMOVE_DESCRIPTION_TEST_ID}
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
                data-test={CATALOG_PLAN_DRAWER_SHOW_DESCRIPTION_TEST_ID}
              >
                {translate('text_642d5eb2783a2ad10d670324')}
              </Button>
            )}

            <form.AppField name="currency">
              {(field) => (
                <field.ComboBoxField
                  disableClearable
                  label={translate('text_1789030049529w52cf8ux80o')}
                  data={currencyComboboxData}
                  disabled={disableCurrencyInput}
                  {...(disableCurrencyInput && {
                    helperText: translate('text_1789030049529qgfhsggx3r0'),
                  })}
                />
              )}
            </form.AppField>
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
        </CenteredPage.SubsectionWrapper>
      </>
    )
  },
})

type CatalogPlanDrawerContentExtraProps = CatalogPlanDrawerSectionsExtraProps & {
  resetSignal?: CreateMoreResetSignal
}

const catalogPlanDrawerContentDefaultProps: CatalogPlanDrawerContentExtraProps = {
  ...catalogPlanDrawerSectionsDefaultProps,
  resetSignal: undefined,
}

// `children` is captured once at open(), so reactive state (the remount below)
// has to live in this body, not the hook that opens the drawer.
export const CatalogPlanDrawerContent = withForm({
  defaultValues: CATALOG_PLAN_FORM_DEFAULTS,
  props: catalogPlanDrawerContentDefaultProps,
  render: function CatalogPlanDrawerContentRender({
    form,
    isEdit,
    disableCodeInput,
    disableCurrencyInput,
    resetSignal,
  }) {
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
          <CatalogPlanDrawerFormSections
            form={form}
            isEdit={isEdit}
            disableCodeInput={disableCodeInput}
            disableCurrencyInput={disableCurrencyInput}
          />
        </div>
      </div>
    )
  },
})
