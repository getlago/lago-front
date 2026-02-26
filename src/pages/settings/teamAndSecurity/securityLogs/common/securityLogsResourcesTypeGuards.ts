import {
  ApiKeyResource,
  BillingEntityResource,
  IntegrationResource,
  InviteResource,
  RoleEditedResource,
  RoleResource,
  RotatedApiKeyResource,
  WebhookResource,
} from './securityLogsTypes'

// Type guards
export const isApiKeyResource = (resources: unknown): resources is ApiKeyResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'name' in resources &&
    typeof (resources as ApiKeyResource).name === 'string' &&
    'value_ending' in resources &&
    typeof (resources as ApiKeyResource).value_ending === 'string'
  )
}

export const isRotatedApiKeyResource = (resources: unknown): resources is RotatedApiKeyResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'name' in resources &&
    typeof (resources as RotatedApiKeyResource).name === 'string' &&
    'value_ending' in resources &&
    typeof (resources as RotatedApiKeyResource).value_ending === 'object' &&
    !!(resources as RotatedApiKeyResource).value_ending &&
    'deleted' in (resources as RotatedApiKeyResource).value_ending &&
    typeof (resources as RotatedApiKeyResource).value_ending.deleted === 'string' &&
    'added' in (resources as RotatedApiKeyResource).value_ending &&
    typeof (resources as RotatedApiKeyResource).value_ending.added === 'string'
  )
}

export const isBillingEntityResource = (resources: unknown): resources is BillingEntityResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'billing_entity_name' in resources &&
    typeof (resources as BillingEntityResource).billing_entity_name === 'string'
  )
}

export const isIntegrationResource = (resources: unknown): resources is IntegrationResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'integration_name' in resources &&
    typeof (resources as IntegrationResource).integration_name === 'string'
  )
}

export const isRoleResource = (resources: unknown): resources is RoleResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'role_code' in resources &&
    typeof (resources as RoleResource).role_code === 'string'
  )
}

export const isInviteResource = (resources: unknown): resources is InviteResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'invitee_email' in resources &&
    typeof (resources as InviteResource).invitee_email === 'string'
  )
}

export const isRoleEditedResource = (resources: unknown): resources is RoleEditedResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'email' in resources &&
    typeof (resources as RoleEditedResource).email === 'string' &&
    'roles' in resources &&
    typeof (resources as RoleEditedResource).roles === 'object' &&
    !!(resources as RoleEditedResource).roles &&
    'added' in (resources as RoleEditedResource).roles &&
    typeof (resources as RoleEditedResource).roles.added === 'string'
  )
}

export const isWebhookResource = (resources: unknown): resources is WebhookResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'webhook_url' in resources &&
    typeof (resources as WebhookResource).webhook_url === 'string'
  )
}
