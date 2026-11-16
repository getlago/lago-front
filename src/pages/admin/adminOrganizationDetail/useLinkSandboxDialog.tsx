import { gql } from '@apollo/client'
import NiceModal from '@ebay/nice-modal-react'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useEffect, useRef } from 'react'
import { z } from 'zod'

import { REASON_MODAL_NAME } from '~/components/admin/const'
import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { dialogFormProps } from '~/components/dialogs/dialogFormProps'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast, getGraphQLErrorCode, hasDefinedGQLError } from '~/core/apolloClient'
import {
  LagoApiError,
  useAdminLinkSandboxOrganizationMutation,
  useGetAdminOrganizationsForLinkSandboxLazyQuery,
} from '~/generated/graphql'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'

gql`
  query getAdminOrganizationsForLinkSandbox($searchTerm: String, $page: Int, $limit: Int) {
    adminOrganizations(searchTerm: $searchTerm, page: $page, limit: $limit) {
      collection {
        id
        name
      }
    }
  }

  mutation adminLinkSandboxOrganization($input: AdminLinkSandboxOrganizationInput!) {
    adminLinkSandboxOrganization(input: $input) {
      organization {
        id
        environment
        sandboxOrganization {
          id
          name
        }
      }
      sandboxOrganization {
        id
        environment
        productionOrganization {
          id
          name
        }
      }
    }
  }
`

export const LINK_SANDBOX_FORM_ID = 'admin-link-sandbox-form'
const LINK_SANDBOX_SUBMIT_BUTTON_TEST_ID = 'admin-link-sandbox-submit-button'

const ORGANIZATIONS_PAGE_SIZE = 20
const REQUIRED_MESSAGE = 'text_1771342994699klxu2paz7g8'
const SAME_ORGANIZATION_MESSAGE = 'text_1794243204868luglbgacedo'

const linkSandboxValidationSchema = z
  .object({
    productionOrganizationId: z
      .string({ error: REQUIRED_MESSAGE })
      .min(1, { message: REQUIRED_MESSAGE }),
    sandboxOrganizationId: z
      .string({ error: REQUIRED_MESSAGE })
      .min(1, { message: REQUIRED_MESSAGE }),
  })
  .refine(
    ({ productionOrganizationId, sandboxOrganizationId }) =>
      productionOrganizationId !== sandboxOrganizationId,
    { message: SAME_ORGANIZATION_MESSAGE, path: ['sandboxOrganizationId'] },
  )

type LinkSandboxFormValues = z.infer<typeof linkSandboxValidationSchema>

const DEFAULT_VALUES: LinkSandboxFormValues = {
  productionOrganizationId: '',
  sandboxOrganizationId: '',
}

type LinkRefusalCode =
  | LagoApiError.SelfServeDisabled
  | LagoApiError.ProductionIsASandbox
  | LagoApiError.ProductionAlreadyHasSandbox
  | LagoApiError.SandboxAlreadyLinked
  | LagoApiError.SandboxHasSandbox
  | LagoApiError.SandboxIsSelfServe
  | LagoApiError.SandboxHasSsoIntegration
  | LagoApiError.SandboxHasExtraPremiumIntegrations
  | LagoApiError.SandboxHasExtraFeatureFlags
  | LagoApiError.SandboxHasStricterAuthentication
  | LagoApiError.SandboxHasPendingInvites
  | LagoApiError.SandboxHasOtherMembers
  | LagoApiError.LockAcquisitionFailed

const LINK_REFUSAL_MESSAGES: Record<LinkRefusalCode, string> = {
  [LagoApiError.SelfServeDisabled]:
    'Self-serve is not enabled on this deployment, so organizations cannot be linked.',
  [LagoApiError.ProductionIsASandbox]:
    'The production organization is itself a sandbox. Pick its production organization instead.',
  [LagoApiError.ProductionAlreadyHasSandbox]: 'The production organization already has a sandbox.',
  [LagoApiError.SandboxAlreadyLinked]:
    'This organization is already the sandbox of another organization.',
  [LagoApiError.SandboxHasSandbox]:
    'This organization has its own sandbox, so it cannot become one.',
  [LagoApiError.SandboxIsSelfServe]: 'A self-serve organization cannot be linked as a sandbox.',
  [LagoApiError.SandboxHasSsoIntegration]:
    'This organization has its own Okta or Entra ID integration. Remove it before linking.',
  [LagoApiError.SandboxHasExtraPremiumIntegrations]:
    'This organization has premium integrations the production organization lacks. Linking would remove them: align them first.',
  [LagoApiError.SandboxHasExtraFeatureFlags]:
    'This organization has feature flags the production organization lacks. Linking would remove them: align them first.',
  [LagoApiError.SandboxHasStricterAuthentication]:
    'The production organization allows login methods this organization refuses. Align its login methods first.',
  [LagoApiError.SandboxHasPendingInvites]:
    'This organization has pending invites. Revoke them before linking.',
  [LagoApiError.SandboxHasOtherMembers]:
    'This organization has members the production organization lacks. Remove them before linking.',
  [LagoApiError.LockAcquisitionFailed]: 'Another link is in progress. Try again in a moment.',
}

const isLinkRefusalCode = (code: string): code is LinkRefusalCode =>
  Object.hasOwn(LINK_REFUSAL_MESSAGES, code)

const LINK_SILENT_ERROR_CODES: LagoApiError[] = [
  ...Object.values(LagoApiError).filter(isLinkRefusalCode),
  LagoApiError.NotFound,
  LagoApiError.UnprocessableEntity,
]

const GENERIC_LINK_ERROR_MESSAGE = 'Failed to link the organizations. Please try again.'

const getLinkErrorMessage = (errors: readonly GraphQLFormattedError[]): string | null => {
  if (hasDefinedGQLError('NotFound', errors, 'productionOrganization')) {
    return 'The production organization does not exist.'
  }

  if (hasDefinedGQLError('NotFound', errors, 'sandboxOrganization')) {
    return 'The organization to link does not exist.'
  }

  if (hasDefinedGQLError('CannotLinkOrganizationToItself', errors, 'sandboxOrganizationId')) {
    return 'An organization cannot be linked to itself.'
  }

  if (hasDefinedGQLError('ValueAlreadyExist', errors, 'productionOrganizationId')) {
    return LINK_REFUSAL_MESSAGES[LagoApiError.ProductionAlreadyHasSandbox]
  }

  const code = getGraphQLErrorCode(errors[0].extensions)

  if (isLinkRefusalCode(code)) return LINK_REFUSAL_MESSAGES[code]

  // Unsilenced codes already get the global error toast
  if (!LINK_SILENT_ERROR_CODES.some((silentCode) => silentCode === code)) return null

  return GENERIC_LINK_ERROR_MESSAGE
}

type OrganizationNames = Map<string, string>

const toOption = (id: string, name: string): { value: string; label: string } => ({
  value: id,
  label: `${name} (${id})`,
})

const useOrganizationOptions = (
  organizationNames: OrganizationNames,
  selectedId: string | undefined,
): {
  options: Array<{ value: string; label: string }>
  loading: boolean
  search: ReturnType<typeof useGetAdminOrganizationsForLinkSandboxLazyQuery>[0]
} => {
  const [search, { data, loading }] = useGetAdminOrganizationsForLinkSandboxLazyQuery({
    variables: { limit: ORGANIZATIONS_PAGE_SIZE },
    notifyOnNetworkStatusChange: true,
  })

  const collection = data?.adminOrganizations?.collection ?? []

  useEffect(() => {
    data?.adminOrganizations?.collection.forEach(({ id, name }) => organizationNames.set(id, name))
  }, [data, organizationNames])

  const options = collection.map(({ id, name }) => toOption(id, name))
  const selectedName = selectedId ? organizationNames.get(selectedId) : undefined

  if (selectedId && selectedName && !collection.some(({ id }) => id === selectedId)) {
    options.unshift(toOption(selectedId, selectedName))
  }

  return { options, loading, search }
}

const LinkSandboxForm = withForm({
  defaultValues: DEFAULT_VALUES,
  props: { organizationNames: new Map<string, string>() },
  render: function Render({ form, organizationNames }): JSX.Element {
    const productionOrganizationId = useStore(
      form.store,
      (state) => state.values.productionOrganizationId,
    )
    const sandboxOrganizationId = useStore(
      form.store,
      (state) => state.values.sandboxOrganizationId,
    )
    const production = useOrganizationOptions(organizationNames, productionOrganizationId)
    const sandbox = useOrganizationOptions(organizationNames, sandboxOrganizationId)

    return (
      <div className="flex flex-col gap-6 p-8">
        <form.AppField name="productionOrganizationId">
          {(field) => (
            <field.ComboBoxField
              label="Production organization"
              placeholder="Search the production organization"
              loading={production.loading}
              data={production.options}
              searchQuery={production.search}
              PopperProps={{ displayInDialog: true }}
            />
          )}
        </form.AppField>
        <form.AppField name="sandboxOrganizationId">
          {(field) => (
            <field.ComboBoxField
              label="Organization to link as its sandbox"
              placeholder="Search the organization to link"
              loading={sandbox.loading}
              data={sandbox.options}
              searchQuery={sandbox.search}
              PopperProps={{ displayInDialog: true }}
            />
          )}
        </form.AppField>
      </div>
    )
  },
})

type UseLinkSandboxDialogProps = {
  onLinked: () => void
}

export const useLinkSandboxDialog = ({
  onLinked,
}: UseLinkSandboxDialogProps): {
  openLinkSandboxDialog: (productionOrganization: { id: string; name: string }) => void
} => {
  const formDialog = useFormDialog()
  const organizationNamesRef = useRef<OrganizationNames>(new Map())
  const [linkSandbox] = useAdminLinkSandboxOrganizationMutation()
  const linkedRef = useRef(false)

  const confirmLink = async (reason: string): Promise<void> => {
    const { productionOrganizationId, sandboxOrganizationId } = form.state.values

    const result = await linkSandbox({
      variables: { input: { productionOrganizationId, sandboxOrganizationId, reason } },
      context: { silentErrorCodes: LINK_SILENT_ERROR_CODES },
      errorPolicy: 'all',
    })

    if (result.errors?.length) {
      const message = getLinkErrorMessage(result.errors)

      if (message) addToast({ severity: 'danger', message })

      return
    }

    linkedRef.current = true
    addToast({ severity: 'success', message: 'Organizations linked.' })
    onLinked()
  }

  const getOrganizationName = (organizationId: string): string =>
    organizationNamesRef.current.get(organizationId) ?? organizationId

  const openConfirmation = (): void => {
    linkedRef.current = false

    const { productionOrganizationId, sandboxOrganizationId } = form.state.values
    const productionName = getOrganizationName(productionOrganizationId)
    const sandboxName = getOrganizationName(sandboxOrganizationId)

    NiceModal.show<DialogResult, ReasonModalProps>(REASON_MODAL_NAME, {
      title: 'Link as sandbox',
      description: `"${sandboxName}" becomes the sandbox of "${productionName}" and takes its premium integrations, feature flags, login methods, custom roles and members. This is permanent: there is no unlink, and the audit rows cannot be rolled back.`,
      showNotifyCheckbox: false,
      onConfirm: confirmLink,
    }).then(() => {
      if (!linkedRef.current) openPicker()
    })
  }

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: linkSandboxValidationSchema },
    onSubmit: openConfirmation,
  })

  const openPicker = (): void => {
    void formDialog.open({
      title: 'Link a sandbox',
      description: 'Pick the production organization and the organization to link as its sandbox.',
      children: <LinkSandboxForm form={form} organizationNames={organizationNamesRef.current} />,
      form: dialogFormProps(LINK_SANDBOX_FORM_ID, form),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={LINK_SANDBOX_SUBMIT_BUTTON_TEST_ID}>
            Continue
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  const openLinkSandboxDialog = (productionOrganization: { id: string; name: string }): void => {
    organizationNamesRef.current.set(productionOrganization.id, productionOrganization.name)
    form.reset(
      { ...DEFAULT_VALUES, productionOrganizationId: productionOrganization.id },
      { keepDefaultValues: true },
    )
    openPicker()
  }

  return { openLinkSandboxDialog }
}
