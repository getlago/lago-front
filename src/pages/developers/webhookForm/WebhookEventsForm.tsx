import { type FieldGroupApi, GroupedCheckboxList } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { useWebhookEventTypes, webhookEventsEmptyValues } from '~/hooks/useWebhookEventTypes'

type WebhookEventsFormProps = {
  isEditable?: boolean
  isLoading?: boolean
  errors?: Array<string>
}

const defaultProps: WebhookEventsFormProps = {
  isEditable: true,
  isLoading: false,
  errors: [],
}

type WebhookEventValues = Record<string, boolean>

const WebhookEventsForm = withFieldGroup({
  defaultValues: { ...webhookEventsEmptyValues },
  props: defaultProps,
  render: function Render({ group, isLoading, errors }) {
    const { translate } = useInternationalization()
    const { groups, loading: eventsLoading } = useWebhookEventTypes()

    // Cast to FieldGroupApi - the TanStack Form group API is structurally compatible
    // but has more complex generic types that don't align directly
    const typedGroup = group as unknown as FieldGroupApi<WebhookEventValues>

    return (
      <GroupedCheckboxList
        group={typedGroup}
        title={translate('text_1770822522307127vc3bt81b')}
        subtitle={translate('text_1770822522308ndyb2bewmvs')}
        searchPlaceholder={translate('text_1770822522308u2ptsqw79ns')}
        groups={groups}
        isLoading={isLoading || eventsLoading}
        errors={errors}
      />
    )
  },
})

export default WebhookEventsForm
