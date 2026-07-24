import { revalidateLogic } from '@tanstack/react-form'
import { forwardRef, ReactNode, useImperativeHandle, useState } from 'react'
import { z } from 'zod'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { ConnectionComboBoxDataItem } from './ConnectionComboBox'
import { ConnectionDrawerSection } from './ConnectionDrawerSection'
import { LockedConnectionSelection, ProviderSelectionSection } from './ProviderSelectionSection'
import { CONNECTION_CATEGORY_SHORT_LABEL_KEYS, ConnectionCategory } from './types'

const CUSTOMER_CONNECTION_FORM_ID = 'customer-connection-drawer-form'

/**
 * Provider types that don't support linking an existing provider customer id
 * (mirrors the customer-form rule for the payment section).
 */
const PROVIDERS_WITHOUT_EXTERNAL_ID: ReadonlySet<string> = new Set([
  ProviderTypeEnum.Cashfree,
  ProviderTypeEnum.Flutterwave,
])

const connectionValidationSchema = z
  .object({
    providerCode: z
      .string()
      .optional()
      .refine((value) => !!value, { message: 'text_624ea7c29103fd010732ab7d' }),
    /** Resolved provider/integration type of the selected code (set by the drawer content) */
    providerType: z.string().optional(),
    externalCustomerId: z.string().optional(),
    syncWithProvider: z.boolean().optional(),
    /** NetSuite only */
    subsidiaryId: z.string().optional(),
    /** Hubspot only */
    targetedObject: z.enum(HubspotTargetedObjectsEnum).optional(),
    /** Stripe only */
    providerPaymentMethods: z
      .partialRecord(z.enum(ProviderPaymentMethodsEnum), z.boolean())
      .optional(),
  })
  // externalCustomerId is required when not syncing with the provider
  // (except providers that don't support it) — mirrors the customer form
  .refine(
    (data) => {
      if (!data.providerType) return true
      if (PROVIDERS_WITHOUT_EXTERNAL_ID.has(data.providerType)) return true
      if (data.syncWithProvider) return true

      return !!data.externalCustomerId
    },
    { message: 'text_1764236242615sfcc7546vv8', path: ['externalCustomerId'] },
  )
  // NetSuite requires a subsidiary when syncing
  .refine(
    (data) => {
      if (data.providerType !== IntegrationTypeEnum.Netsuite) return true

      return !!data.subsidiaryId || !data.syncWithProvider
    },
    { message: 'text_1764249459826j3tkbn7s5ca', path: ['subsidiaryId'] },
  )
  // Hubspot requires a targeted object
  .refine(
    (data) => {
      if (data.providerType !== IntegrationTypeEnum.Hubspot) return true

      return !!data.targetedObject
    },
    { message: 'text_1764249563018adc7qy057at', path: ['targetedObject'] },
  )
  // Stripe requires at least one enabled payment method
  .refine(
    (data) => {
      if (data.providerType !== ProviderTypeEnum.Stripe) return true
      if (!data.providerPaymentMethods) return false

      return Object.values(data.providerPaymentMethods).some(Boolean)
    },
    { message: 'text_1764259518524a0hr3z00m7r', path: ['providerPaymentMethods'] },
  )

/**
 * Single-connection form values. The per-provider field groups mount on this
 * subtree with an identity `fields` mapping (they are form-agnostic — the
 * same groups were previously mounted on the customer form by the inline
 * accordions).
 */
export type ConnectionFormValues = z.infer<typeof connectionValidationSchema>

const DEFAULT_VALUES: ConnectionFormValues = {
  providerCode: undefined,
  providerType: undefined,
  externalCustomerId: '',
  syncWithProvider: false,
  subsidiaryId: '',
  targetedObject: undefined,
  providerPaymentMethods: {},
}

const useConnectionDrawerForm = ({
  defaultValues,
  onSubmit,
}: {
  defaultValues: ConnectionFormValues
  onSubmit: (values: ConnectionFormValues) => void | Promise<void>
}) => {
  return useAppForm({
    // Must be the CURRENTLY-OPENED values (not static empty defaults): the
    // react-form binding re-runs `formApi.update(options)` on every render,
    // and when options.defaultValues differs from the last reset() baseline
    // it wipes the untouched form state back to options.defaultValues.
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: connectionValidationSchema,
    },
    onSubmit: async ({ value }) => onSubmit(value),
  })
}

export type CustomerConnectionDrawerFormApi = ReturnType<typeof useConnectionDrawerForm>

type RenderProviderContentArgs = {
  category: ConnectionCategory
  isEdition: boolean
}

type CustomerConnectionDrawerProps = {
  /**
   * Injected persistence strategy: on customer create/edit the values are
   * written into the customer form state (deferred to the customer save); on
   * the customer information view they are persisted immediately via the
   * dedicated mutations.
   */
  onSave: (
    category: ConnectionCategory,
    values: ConnectionFormValues,
    utils: { isEdition: boolean },
  ) => void | Promise<void>
  /** Org-level provider/integration options per category */
  connectionOptions: Partial<Record<ConnectionCategory, ConnectionComboBoxDataItem[]>>
  /**
   * Provider-specific content slot. The mount site knows the org integrations
   * and mounts the matching per-provider field group (with an identity
   * `fields` mapping onto this drawer's single-connection form).
   */
  renderProviderContent?: (
    form: CustomerConnectionDrawerFormApi,
    args: RenderProviderContentArgs,
  ) => ReactNode
}

export type CustomerConnectionDrawerRef = {
  openDrawer: (
    category: ConnectionCategory,
    initialValues?: Partial<ConnectionFormValues>,
    lockedSelection?: LockedConnectionSelection,
  ) => void
  closeDrawer: () => void
}

/**
 * The shared per-type connection editor drawer (create + edit), reused across
 * customer creation/edition and the customer information view.
 *
 * The `code` field and default selection are intentionally NOT part of this
 * phase (Milestone 2).
 */
export const CustomerConnectionDrawer = forwardRef<
  CustomerConnectionDrawerRef,
  CustomerConnectionDrawerProps
>(({ onSave, connectionOptions, renderProviderContent }, ref) => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const [context, setContext] = useState<{
    category: ConnectionCategory
    isEdition: boolean
    lockedSelection?: LockedConnectionSelection
  }>({
    category: ConnectionCategory.Payment,
    isEdition: false,
  })
  // The values the drawer was opened with — doubles as the form's
  // defaultValues so re-renders never wipe the untouched state (see
  // useConnectionDrawerForm) and the close-warning baseline is correct.
  const [openedValues, setOpenedValues] = useState<ConnectionFormValues>(DEFAULT_VALUES)

  const form = useConnectionDrawerForm({
    defaultValues: openedValues,
    onSubmit: async (values) => {
      await onSave(context.category, values, { isEdition: context.isEdition })
      drawer.close()
    },
  })

  const openConnectionDrawer = (
    category: ConnectionCategory,
    isEdition: boolean,
    lockedSelection?: LockedConnectionSelection,
  ): void => {
    drawer.open({
      title: translate(CONNECTION_CATEGORY_SHORT_LABEL_KEYS[category]),
      form: { id: CUSTOMER_CONNECTION_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: (container) => focusFirstInput(container),
      children: (
        <CenteredPage.SectionWrapper>
          <CenteredPage.PageTitle
            title={translate('text_1784537967970sdhggipd1s0')}
            description={translate('text_1784537967970afggowvwkgz')}
          />

          <div className="flex flex-col">
            <ConnectionDrawerSection>
              <ProviderSelectionSection
                form={form}
                category={category}
                options={connectionOptions[category] ?? []}
                lockedSelection={lockedSelection}
              />
            </ConnectionDrawerSection>

            {renderProviderContent?.(form, { category, isEdition })}
          </div>
        </CenteredPage.SectionWrapper>
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="customer-connection-drawer-save">
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  useImperativeHandle(ref, () => ({
    openDrawer: (category, initialValues, lockedSelection) => {
      const isEdition = !!initialValues
      // Single object shared by state (hook defaultValues) and reset: the
      // baseline for both the render-time update() comparison and isDirty
      const opened = { ...DEFAULT_VALUES, ...initialValues }

      setContext({ category, isEdition, lockedSelection })
      setOpenedValues(opened)
      form.reset(opened)
      openConnectionDrawer(category, isEdition, lockedSelection)
    },
    closeDrawer: () => {
      drawer.close()
    },
  }))

  return null
})

CustomerConnectionDrawer.displayName = 'CustomerConnectionDrawer'
