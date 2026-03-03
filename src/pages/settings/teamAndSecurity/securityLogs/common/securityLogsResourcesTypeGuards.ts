import {
  ApiKeyResource,
  BillingEntityResource,
  IntegrationResource,
  InviteResource,
  RoleEditedResource,
  RoleResource,
  RotatedApiKeyResource,
  WebhookEditedResource,
  WebhookResource,
} from './securityLogsTypes'

// Type guards
export const isApiKeyResource = (resources: unknown): resources is ApiKeyResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'name' in resources &&
    typeof resources.name === 'string' &&
    'value_ending' in resources &&
    (typeof resources.value_ending === 'number' || typeof resources.value_ending === 'string')
  )
}

export const isRotatedApiKeyResource = (resources: unknown): resources is RotatedApiKeyResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'name' in resources &&
    typeof resources.name === 'string' &&
    'value_ending' in resources &&
    typeof resources.value_ending === 'object' &&
    !!resources.value_ending &&
    'deleted' in resources.value_ending &&
    typeof resources.value_ending.deleted === 'string' &&
    'added' in resources.value_ending &&
    typeof resources.value_ending.added === 'string'
  )
}

export const isBillingEntityResource = (resources: unknown): resources is BillingEntityResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'billing_entity_name' in resources &&
    typeof resources.billing_entity_name === 'string'
  )
}

export const isIntegrationResource = (resources: unknown): resources is IntegrationResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'integration_name' in resources &&
    typeof resources.integration_name === 'string'
  )
}

export const isRoleResource = (resources: unknown): resources is RoleResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'role_code' in resources &&
    typeof resources.role_code === 'string'
  )
}

export const isInviteResource = (resources: unknown): resources is InviteResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'invitee_email' in resources &&
    typeof resources.invitee_email === 'string'
  )
}

export const isRoleEditedResource = (resources: unknown): resources is RoleEditedResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'email' in resources &&
    typeof resources.email === 'string' &&
    'roles' in resources &&
    typeof resources.roles === 'object' &&
    !!resources.roles &&
    'added' in resources.roles &&
    typeof resources.roles.added === 'string'
  )
}

export const isWebhookResource = (resources: unknown): resources is WebhookResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'webhook_url' in resources &&
    typeof resources.webhook_url === 'string'
  )
}

export const isWebhookEditedResource = (resources: unknown): resources is WebhookEditedResource => {
  return (
    !!resources &&
    typeof resources === 'object' &&
    'webhook_url' in resources &&
    typeof resources.webhook_url === 'object' &&
    !!resources.webhook_url &&
    'added' in resources.webhook_url &&
    typeof resources.webhook_url.added === 'string' &&
    'deleted' in resources.webhook_url &&
    typeof resources.webhook_url.deleted === 'string'
  )
}
