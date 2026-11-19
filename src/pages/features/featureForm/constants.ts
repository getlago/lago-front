// `Entitlement::PrivilegeCreateService::MAX_PRIVILEGES` in lago-api guards the REST privilege
// create; `createFeature`/`updateFeature` do not count, so this is the only guard on this form.
export const MAX_FEATURE_PRIVILEGES = 50
