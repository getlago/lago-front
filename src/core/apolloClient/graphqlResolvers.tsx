import { gql } from '@apollo/client'

export const typeDefs = gql`
  enum LagoApiError {
    internal_error
    unauthorized
    forbidden
    not_found
    unprocessable_entity

    # Authentication & authentication errors
    token_encoding_error
    expired_jwt_token
    incorrect_login_or_password
    not_organization_member
    login_method_not_authorized

    # Validation errors
    invite_email_mistmatch
    user_already_exists
    user_does_not_exist
    coupon_is_not_reusable
    currencies_does_not_match
    invite_not_found
    value_already_exist
    value_is_duplicated
    value_is_invalid
    value_is_out_of_range
    url_is_invalid
    invite_already_exists
    email_already_used
    does_not_match_item_amounts
    payment_processor_is_currently_handling_payment
    plan_overlapping
    invoices_not_overdue

    # Object not found
    missing_payment_provider_customer
    plan_not_found

    # SSO errors
    invalid_google_code
    invalid_google_token
    google_auth_missing_setup
    google_login_method_not_authorized
    domain_not_configured
    okta_login_method_not_authorized
    okta_userinfo_error

    # Anrok errors
    currencyCodeNotSupported
    customerAddressCountryNotSupported
    customerAddressCouldNotResolve
    productExternalIdUnknown

    # Avalara errors
    InvalidEnumValue
    MissingAddress
    NotEnoughAddressesInfo
    InvalidAddress
    InvalidPostalCode
    AddressLocationNotFound
    TaxCodeAssociatedWithItemCodeNotFound
    EntityNotFoundError
  }

  enum ApiKeysPermissionsEnum {
    activity_log
    add_on
    alert
    analytic
    applied_coupon
    billable_metric
    billing_entity
    coupon
    credit_note
    customer
    customer_usage
    event
    feature
    fee
    invoice
    invoice_custom_section
    lifetime_usage
    organization
    payment
    payment_receipt
    payment_request
    plan
    subscription
    tax
    wallet
    wallet_transaction
    webhook_endpoint
    webhook_jwt_public_key
  }
`

export const resolvers = {}
