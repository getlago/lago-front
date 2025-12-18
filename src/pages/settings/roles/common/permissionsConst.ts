import { PermissionGroupMapping, PermissionName } from './permissionsTypes'

export const hiddenPermissions: Array<PermissionName> = []

export const permissionGroupMapping: PermissionGroupMapping = {
  addons: ['addonsCreate', 'addonsDelete', 'addonsUpdate', 'addonsView'],
  analytics: ['analyticsView', 'analyticsOverdueBalancesView'],
  auditLogs: ['auditLogsView'],
  authenticationMethods: ['authenticationMethodsView', 'authenticationMethodsUpdate'],
  billableMetrics: [
    'billableMetricsCreate',
    'billableMetricsDelete',
    'billableMetricsUpdate',
    'billableMetricsView',
  ],
  billingEntities: [
    'billingEntitiesView',
    'billingEntitiesCreate',
    'billingEntitiesUpdate',
    'billingEntitiesDelete',
    'billingEntitiesInvoicesView',
    'billingEntitiesInvoicesUpdate',
    'billingEntitiesTaxesView',
    'billingEntitiesTaxesUpdate',
    'billingEntitiesEmailsView',
    'billingEntitiesEmailsUpdate',
    'billingEntitiesDunningCampaignsUpdate',
  ],
  coupons: [
    'couponsAttach',
    'couponsCreate',
    'couponsDelete',
    'couponsDetach',
    'couponsUpdate',
    'couponsView',
  ],
  creditNotes: ['creditNotesCreate', 'creditNotesView', 'creditNotesVoid'],
  customerSettings: [
    'customerSettingsUpdateGracePeriod',
    'customerSettingsUpdateIssuingDateAnchor',
    'customerSettingsUpdateIssuingDateAdjustment',
    'customerSettingsUpdateLang',
    'customerSettingsUpdatePaymentTerms',
    'customerSettingsUpdateTaxRates',
    'customerSettingsView',
  ],
  customers: ['customersCreate', 'customersDelete', 'customersUpdate', 'customersView'],
  dataApi: ['dataApiView'],
  developers: ['developersKeysManage', 'developersManage'],
  draftInvoices: ['draftInvoicesUpdate'],
  dunningCampaigns: ['dunningCampaignsCreate', 'dunningCampaignsUpdate', 'dunningCampaignsView'],
  features: ['featuresCreate', 'featuresDelete', 'featuresUpdate', 'featuresView'],
  invoiceCustomSections: ['invoiceCustomSectionsCreate', 'invoiceCustomSectionsUpdate'],
  invoices: ['invoicesCreate', 'invoicesSend', 'invoicesUpdate', 'invoicesView', 'invoicesVoid'],
  organization: [
    'organizationView',
    'organizationUpdate',
    'organizationEmailsView',
    'organizationEmailsUpdate',
    'organizationIntegrationsCreate',
    'organizationIntegrationsDelete',
    'organizationIntegrationsUpdate',
    'organizationIntegrationsView',
    'organizationInvoicesView',
    'organizationInvoicesUpdate',
    'organizationMembersCreate',
    'organizationMembersDelete',
    'organizationMembersUpdate',
    'organizationMembersView',
    'organizationTaxesView',
    'organizationTaxesUpdate',
  ],
  payments: ['paymentsCreate', 'paymentsView'],
  plans: ['plansCreate', 'plansDelete', 'plansUpdate', 'plansView'],
  pricingUnits: ['pricingUnitsCreate', 'pricingUnitsUpdate', 'pricingUnitsView'],
  subscriptions: ['subscriptionsCreate', 'subscriptionsUpdate', 'subscriptionsView'],
  wallets: ['walletsCreate', 'walletsTerminate', 'walletsTopUp', 'walletsUpdate'],
}

export const groupNameMapping: Record<string, string> = {
  addons: 'text_629728388c4d2300e2d3801a',
  analytics: 'text_6553885df387fd0097fd7384',
  auditLogs: 'text_1766071560701xrf1tn0w5wx',
  authenticationMethods: 'text_664c732c264d7eed1c74fd96',
  billableMetrics: 'text_623b497ad05b960101be3438',
  billingEntities: 'text_1743077296189ms0shds6g53',
  coupons: 'text_637ccf8133d2c9a7d11ce705',
  creditNotes: 'text_637ccf8133d2c9a7d11ce708',
  customerSettings: 'text_1765882497985wd35gnobdvl',
  customers: 'text_624efab67eb2570101d117a5',
  dataApi: 'text_1766071560701ud8peghugtg',
  developers: 'text_6271200984178801ba8bdeac',
  draftInvoices: 'text_17658824979850l2uroad1dz',
  dunningCampaigns: 'text_1728574726495w5aylnynne9',
  features: 'text_1752692673070k7z0mmf0494',
  invoiceCustomSections: 'text_1765882631575jrjzdfbdvn5',
  invoices: 'text_63ac86d797f728a87b2f9f85',
  organization: 'text_173289482048511y9ieyywq5',
  payments: 'text_6672ebb8b1b50be550eccbed',
  plans: 'text_62442e40cea25600b0b6d85a',
  pricingUnits: 'text_17502505476284yyq70yy6mx',
  subscriptions: 'text_6250304370f0f700a8fdc28d',
  wallets: 'text_62d175066d2dbf1d50bc937c',
}

export const permissionDescriptionMapping: Record<PermissionName, string> = {
  // Addons
  addonsCreate: 'text_1766047581847fumm5ku57ir',
  addonsDelete: 'text_17660475818471if48pmb0dl',
  addonsUpdate: 'text_17660475818475etknl1tlry',
  addonsView: 'text_1766047581847hb6797c3vuz',

  // AI Conversations
  aiConversationsCreate: 'text_17660475818478cmjmlb6yli',
  aiConversationsView: 'text_17660475818476qea85rok4v',

  // Analytics
  analyticsView: 'text_17660475818478stwv9xgjcy',
  analyticsOverdueBalancesView: 'text_1766047581847g5oodpiy6tz',

  // Audit Logs
  auditLogsView: 'text_1766047581847c14q5h7q7e9',

  // Authentication Methods
  authenticationMethodsView: 'text_1766047581848voqfdw1n16u',
  authenticationMethodsUpdate: 'text_1766047581848u1p4t9aq8cw',

  // Billable Metrics
  billableMetricsCreate: 'text_176604758184880rlput3rgm',
  billableMetricsDelete: 'text_17660475818481f10dsq5yh0',
  billableMetricsUpdate: 'text_1766047581848ghd2ui7xu89',
  billableMetricsView: 'text_1766047581848nwzt4s8mzcj',

  // Billing Entities
  billingEntitiesView: 'text_1766047581848drlfvsw4ztp',
  billingEntitiesCreate: 'text_1766047581848utclfbiju0p',
  billingEntitiesUpdate: 'text_1766047581848f4j4bz8lqg8',
  billingEntitiesDelete: 'text_17660475818481vz8uookjpd',
  billingEntitiesInvoicesView: 'text_1766047581848pg9e5ce0lrc',
  billingEntitiesInvoicesUpdate: 'text_1766047581848jq2tauvwet9',
  billingEntitiesTaxesView: 'text_1766047581848w9nbrd8szrv',
  billingEntitiesTaxesUpdate: 'text_1766047581848glb94bpx4r4',
  billingEntitiesEmailsView: 'text_1766047581848rcnco2ugb5s',
  billingEntitiesEmailsUpdate: 'text_1766047581848cpeb24fwlbr',
  billingEntitiesDunningCampaignsUpdate: 'text_1766047581848kxklc7ctt9m',

  // Coupons
  couponsAttach: 'text_17660475818481lrad2tzefh',
  couponsCreate: 'text_1766047581848eoo9h3lmrjk',
  couponsDelete: 'text_1766047581848jubqg1vytbe',
  couponsDetach: 'text_1766047581848foirk3ohptx',
  couponsUpdate: 'text_1766047581848w5w4ioj1x0s',
  couponsView: 'text_17660475818481lx6cod98vs',

  // Credit Notes
  creditNotesCreate: 'text_1766047581848q86w4sz1ccv',
  creditNotesExport: 'text_1766047581848cc5gc4hfp2r',
  creditNotesUpdate: 'text_1766047581848fjq7h53nksy',
  creditNotesView: 'text_17660475818489lrb93zbafu',
  creditNotesVoid: 'text_1766047581848azlox6rihlr',

  // Customer Settings
  customerSettingsUpdateGracePeriod: 'text_1766047581848i1plc1qxg5n',
  customerSettingsUpdateIssuingDateAnchor: 'text_1766047581848wv5t9vkjj3p',
  customerSettingsUpdateIssuingDateAdjustment: 'text_1766047581849jlkhl84xss4',
  customerSettingsUpdateLang: 'text_1766047581849ygottmecybq',
  customerSettingsUpdatePaymentTerms: 'text_1766047581849hh2nxq5ryl4',
  customerSettingsUpdateTaxRates: 'text_1766047581849fcg8eqldup8',
  customerSettingsView: 'text_1766047581849g2pqe23vpjj',

  // Customers
  customersCreate: 'text_17660475818490917oik1suj',
  customersDelete: 'text_1766047581849rxymid08aue',
  customersUpdate: 'text_1766047581849uf40youqly2',
  customersView: 'text_1766047581849vgr87putyw1',

  // Data API
  dataApiView: 'text_1766047581849maew761smvw',

  // Developers
  developersKeysManage: 'text_1766047581849yy0i21nnxj2',
  developersManage: 'text_1766047581849do7xbzegoz9',

  // Draft Invoices
  draftInvoicesUpdate: 'text_1766047581849evplz89r17u',

  // Dunning Campaigns
  dunningCampaignsCreate: 'text_17660475818496c0nexqgglo',
  dunningCampaignsDelete: 'text_1766047581849v64zabe7m7r',
  dunningCampaignsUpdate: 'text_17660475818499x85cwds9hm',
  dunningCampaignsView: 'text_17660475818497rzmqyxotn0',

  // Features
  featuresCreate: 'text_17660475818491b4ih8nmxj8',
  featuresDelete: 'text_17660475818496qrp4na70xh',
  featuresUpdate: 'text_1766047581849ewfuqgrctbp',
  featuresView: 'text_1766047581849yl02q8ddced',

  // Invoice Custom Sections
  invoiceCustomSectionsCreate: 'text_1766047581849xa20no7528c',
  invoiceCustomSectionsDelete: 'text_1766047581849mnidqgar7f3',
  invoiceCustomSectionsUpdate: 'text_1766047581849og4405s05wp',
  invoiceCustomSectionsView: 'text_17660475818494gap5htg4td',

  // Invoices
  invoicesCreate: 'text_1766047581849nemod0aclpk',
  invoicesExport: 'text_1766047581849shrzn6zz5pc',
  invoicesSend: 'text_1766047581849sruujz7kc7u',
  invoicesUpdate: 'text_1766047581849kg8h3krio7b',
  invoicesView: 'text_17660475818496eb8mnaygrc',
  invoicesVoid: 'text_1766047581850xfdxud1g9ic',

  // Organization
  organizationView: 'text_1766047581850c4xikdtb4v6',
  organizationUpdate: 'text_1766047581850ru00srfppl3',
  organizationEmailsView: 'text_1766047581850x7wxp8lj5pw',
  organizationEmailsUpdate: 'text_1766047581850k261kqzm3kx',
  organizationIntegrationsCreate: 'text_1766047581850kqjzi8026vl',
  organizationIntegrationsDelete: 'text_1766047581850e7vpp52f38b',
  organizationIntegrationsUpdate: 'text_1766047581850dwy6zqgknrg',
  organizationIntegrationsView: 'text_1766047581850qy1056vrym5',
  organizationInvoicesView: 'text_1766047581850dyl15icwf2u',
  organizationInvoicesUpdate: 'text_17660475818502tut62phbi4',
  organizationMembersCreate: 'text_17660475818509vupfh8b3re',
  organizationMembersDelete: 'text_17660475818505yilgjvwl4u',
  organizationMembersUpdate: 'text_1766047581850wbdrf26zeuw',
  organizationMembersView: 'text_1766047581850v1tbj62gphc',
  organizationTaxesView: 'text_1766047581850wufdxn8tnfc',
  organizationTaxesUpdate: 'text_17660475818502nin2bywo4x',

  // Payment Methods
  paymentMethodsCreate: 'text_1766047581850xfo6ml8ll9w',
  paymentMethodsDelete: 'text_1766047581850s9h3mkqc749',
  paymentMethodsUpdate: 'text_1766047581850pd2fl4vp3op',
  paymentMethodsView: 'text_1766047581850j2zvnyrxs3v',

  // Payment Requests
  paymentRequestsCreate: 'text_17660475818504u438p1vxlo',
  paymentRequestsView: 'text_1766047581850nhr0mzhyxs1',

  // Payments
  paymentsCreate: 'text_1766047581850ukn3u9te9qh',
  paymentsView: 'text_1766047581850xz434boveds',

  // Plans
  plansCreate: 'text_17660475818509g7q5akr5ux',
  plansDelete: 'text_1766047581850kqos81coudo',
  plansUpdate: 'text_1766047581850war432jrvfz',
  plansView: 'text_1766047581851nni5mneelo0',

  // Pricing Units
  pricingUnitsCreate: 'text_1766047581851sjxfx26kocx',
  pricingUnitsUpdate: 'text_1766047581851z3d9is40izc',
  pricingUnitsView: 'text_17660476446747j5vtzpcqea',

  // Subscriptions
  subscriptionsCreate: 'text_1766047644675i164ysmqiog',
  subscriptionsUpdate: 'text_17660476446752sbul6dha24',
  subscriptionsView: 'text_176604764467582epdk23rja',

  // Wallets
  walletsCreate: 'text_1766047644675qckx90hacmh',
  walletsTerminate: 'text_17660476446757dl68yksj13',
  walletsTopUp: 'text_17660476446757ovltb3ahdr',
  walletsUpdate: 'text_1766047644675mhoyd5oe387',
}
