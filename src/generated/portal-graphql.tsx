import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Represents non-fractional signed whole numeric values. Since the value may exceed the size of a 32-bit integer, it's encoded as a string. */
  BigInt: { input: any; output: any; }
  ChargeFilterValues: { input: any; output: any; }
  /** An ISO 8601-encoded date */
  ISO8601Date: { input: any; output: any; }
  /** An ISO 8601-encoded datetime */
  ISO8601DateTime: { input: any; output: any; }
  /** Represents untyped JSON */
  JSON: { input: any; output: any; }
};

export type AddOn = {
  __typename?: 'AddOn';
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  appliedAddOnsCount: Scalars['Int']['output'];
  code: Scalars['String']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** Number of customers using this add-on */
  customersCount: Scalars['Int']['output'];
  deletedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  integrationMappings?: Maybe<Array<Mapping>>;
  invoiceDisplayName?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  taxes?: Maybe<Array<Tax>>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};


export type AddOnIntegrationMappingsArgs = {
  integrationId?: InputMaybe<Scalars['ID']['input']>;
};

export enum AdjustedFeeTypeEnum {
  AdjustedAmount = 'adjusted_amount',
  AdjustedUnits = 'adjusted_units'
}

export enum AggregationTypeEnum {
  CountAgg = 'count_agg',
  CustomAgg = 'custom_agg',
  LatestAgg = 'latest_agg',
  MaxAgg = 'max_agg',
  SumAgg = 'sum_agg',
  UniqueCountAgg = 'unique_count_agg',
  WeightedSumAgg = 'weighted_sum_agg'
}

export type AnrokCustomer = {
  __typename?: 'AnrokCustomer';
  externalAccountId?: Maybe<Scalars['String']['output']>;
  externalCustomerId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  integrationCode?: Maybe<Scalars['String']['output']>;
  integrationId?: Maybe<Scalars['ID']['output']>;
  integrationType?: Maybe<IntegrationTypeEnum>;
  syncWithProvider?: Maybe<Scalars['Boolean']['output']>;
};

export type AppliedAddOn = {
  __typename?: 'AppliedAddOn';
  addOn: AddOn;
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  createdAt: Scalars['ISO8601DateTime']['output'];
  id: Scalars['ID']['output'];
};

export type AppliedCoupon = {
  __typename?: 'AppliedCoupon';
  amountCents?: Maybe<Scalars['BigInt']['output']>;
  amountCentsRemaining?: Maybe<Scalars['BigInt']['output']>;
  amountCurrency?: Maybe<CurrencyEnum>;
  coupon: Coupon;
  createdAt: Scalars['ISO8601DateTime']['output'];
  frequency: CouponFrequency;
  frequencyDuration?: Maybe<Scalars['Int']['output']>;
  frequencyDurationRemaining?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  percentageRate?: Maybe<Scalars['Float']['output']>;
  terminatedAt: Scalars['ISO8601DateTime']['output'];
};

export type AppliedTax = {
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  createdAt: Scalars['ISO8601DateTime']['output'];
  id: Scalars['ID']['output'];
  tax?: Maybe<Tax>;
  taxCode: Scalars['String']['output'];
  taxDescription?: Maybe<Scalars['String']['output']>;
  taxName: Scalars['String']['output'];
  taxRate: Scalars['Float']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** Base billable metric */
export type BillableMetric = {
  __typename?: 'BillableMetric';
  activeSubscriptionsCount: Scalars['Int']['output'];
  aggregationType: AggregationTypeEnum;
  code: Scalars['String']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  deletedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  draftInvoicesCount: Scalars['Int']['output'];
  fieldName?: Maybe<Scalars['String']['output']>;
  filters?: Maybe<Array<BillableMetricFilter>>;
  id: Scalars['ID']['output'];
  integrationMappings?: Maybe<Array<Mapping>>;
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  plansCount: Scalars['Int']['output'];
  recurring: Scalars['Boolean']['output'];
  subscriptionsCount: Scalars['Int']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
  weightedInterval?: Maybe<WeightedIntervalEnum>;
};


/** Base billable metric */
export type BillableMetricIntegrationMappingsArgs = {
  integrationId?: InputMaybe<Scalars['ID']['input']>;
};

/** Billable metric filters */
export type BillableMetricFilter = {
  __typename?: 'BillableMetricFilter';
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  values: Array<Scalars['String']['output']>;
};

export enum BillingTimeEnum {
  Anniversary = 'anniversary',
  Calendar = 'calendar'
}

export type Charge = {
  __typename?: 'Charge';
  billableMetric: BillableMetric;
  chargeModel: ChargeModelEnum;
  createdAt: Scalars['ISO8601DateTime']['output'];
  deletedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  filters?: Maybe<Array<ChargeFilter>>;
  id: Scalars['ID']['output'];
  invoiceDisplayName?: Maybe<Scalars['String']['output']>;
  invoiceable: Scalars['Boolean']['output'];
  minAmountCents: Scalars['BigInt']['output'];
  payInAdvance: Scalars['Boolean']['output'];
  properties?: Maybe<Properties>;
  prorated: Scalars['Boolean']['output'];
  regroupPaidFees?: Maybe<RegroupPaidFeesEnum>;
  taxes?: Maybe<Array<Tax>>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** Charge filters object */
export type ChargeFilter = {
  __typename?: 'ChargeFilter';
  id: Scalars['ID']['output'];
  invoiceDisplayName?: Maybe<Scalars['String']['output']>;
  properties: Properties;
  values: Scalars['ChargeFilterValues']['output'];
};

export enum ChargeModelEnum {
  Custom = 'custom',
  Graduated = 'graduated',
  GraduatedPercentage = 'graduated_percentage',
  Package = 'package',
  Percentage = 'percentage',
  Standard = 'standard',
  Volume = 'volume'
}

/** Type for CollectionMetadataType */
export type CollectionMetadata = {
  __typename?: 'CollectionMetadata';
  /** Current Page of loaded data */
  currentPage: Scalars['Int']['output'];
  /** The number of items per page */
  limitValue: Scalars['Int']['output'];
  /** The total number of items to be paginated */
  totalCount: Scalars['Int']['output'];
  /** The total number of pages in the pagination */
  totalPages: Scalars['Int']['output'];
};

export type Commitment = {
  __typename?: 'Commitment';
  amountCents: Scalars['BigInt']['output'];
  commitmentType: CommitmentTypeEnum;
  createdAt: Scalars['ISO8601DateTime']['output'];
  id: Scalars['ID']['output'];
  invoiceDisplayName?: Maybe<Scalars['String']['output']>;
  plan: Plan;
  taxes?: Maybe<Array<Tax>>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export enum CommitmentTypeEnum {
  MinimumCommitment = 'minimum_commitment'
}

export enum CountryCode {
  /** Andorra */
  Ad = 'AD',
  /** United Arab Emirates */
  Ae = 'AE',
  /** Afghanistan */
  Af = 'AF',
  /** Antigua and Barbuda */
  Ag = 'AG',
  /** Anguilla */
  Ai = 'AI',
  /** Albania */
  Al = 'AL',
  /** Armenia */
  Am = 'AM',
  /** Angola */
  Ao = 'AO',
  /** Antarctica */
  Aq = 'AQ',
  /** Argentina */
  Ar = 'AR',
  /** American Samoa */
  As = 'AS',
  /** Austria */
  At = 'AT',
  /** Australia */
  Au = 'AU',
  /** Aruba */
  Aw = 'AW',
  /** Åland Islands */
  Ax = 'AX',
  /** Azerbaijan */
  Az = 'AZ',
  /** Bosnia and Herzegovina */
  Ba = 'BA',
  /** Barbados */
  Bb = 'BB',
  /** Bangladesh */
  Bd = 'BD',
  /** Belgium */
  Be = 'BE',
  /** Burkina Faso */
  Bf = 'BF',
  /** Bulgaria */
  Bg = 'BG',
  /** Bahrain */
  Bh = 'BH',
  /** Burundi */
  Bi = 'BI',
  /** Benin */
  Bj = 'BJ',
  /** Saint Barthélemy */
  Bl = 'BL',
  /** Bermuda */
  Bm = 'BM',
  /** Brunei Darussalam */
  Bn = 'BN',
  /** Bolivia (Plurinational State of) */
  Bo = 'BO',
  /** Bonaire, Sint Eustatius and Saba */
  Bq = 'BQ',
  /** Brazil */
  Br = 'BR',
  /** Bahamas */
  Bs = 'BS',
  /** Bhutan */
  Bt = 'BT',
  /** Bouvet Island */
  Bv = 'BV',
  /** Botswana */
  Bw = 'BW',
  /** Belarus */
  By = 'BY',
  /** Belize */
  Bz = 'BZ',
  /** Canada */
  Ca = 'CA',
  /** Cocos (Keeling) Islands */
  Cc = 'CC',
  /** Congo (Democratic Republic of the) */
  Cd = 'CD',
  /** Central African Republic */
  Cf = 'CF',
  /** Congo */
  Cg = 'CG',
  /** Switzerland */
  Ch = 'CH',
  /** Côte d'Ivoire */
  Ci = 'CI',
  /** Cook Islands */
  Ck = 'CK',
  /** Chile */
  Cl = 'CL',
  /** Cameroon */
  Cm = 'CM',
  /** China */
  Cn = 'CN',
  /** Colombia */
  Co = 'CO',
  /** Costa Rica */
  Cr = 'CR',
  /** Cuba */
  Cu = 'CU',
  /** Cabo Verde */
  Cv = 'CV',
  /** Curaçao */
  Cw = 'CW',
  /** Christmas Island */
  Cx = 'CX',
  /** Cyprus */
  Cy = 'CY',
  /** Czechia */
  Cz = 'CZ',
  /** Germany */
  De = 'DE',
  /** Djibouti */
  Dj = 'DJ',
  /** Denmark */
  Dk = 'DK',
  /** Dominica */
  Dm = 'DM',
  /** Dominican Republic */
  Do = 'DO',
  /** Algeria */
  Dz = 'DZ',
  /** Ecuador */
  Ec = 'EC',
  /** Estonia */
  Ee = 'EE',
  /** Egypt */
  Eg = 'EG',
  /** Western Sahara */
  Eh = 'EH',
  /** Eritrea */
  Er = 'ER',
  /** Spain */
  Es = 'ES',
  /** Ethiopia */
  Et = 'ET',
  /** Finland */
  Fi = 'FI',
  /** Fiji */
  Fj = 'FJ',
  /** Falkland Islands (Malvinas) */
  Fk = 'FK',
  /** Micronesia (Federated States of) */
  Fm = 'FM',
  /** Faroe Islands */
  Fo = 'FO',
  /** France */
  Fr = 'FR',
  /** Gabon */
  Ga = 'GA',
  /** United Kingdom of Great Britain and Northern Ireland */
  Gb = 'GB',
  /** Grenada */
  Gd = 'GD',
  /** Georgia */
  Ge = 'GE',
  /** French Guiana */
  Gf = 'GF',
  /** Guernsey */
  Gg = 'GG',
  /** Ghana */
  Gh = 'GH',
  /** Gibraltar */
  Gi = 'GI',
  /** Greenland */
  Gl = 'GL',
  /** Gambia */
  Gm = 'GM',
  /** Guinea */
  Gn = 'GN',
  /** Guadeloupe */
  Gp = 'GP',
  /** Equatorial Guinea */
  Gq = 'GQ',
  /** Greece */
  Gr = 'GR',
  /** South Georgia and the South Sandwich Islands */
  Gs = 'GS',
  /** Guatemala */
  Gt = 'GT',
  /** Guam */
  Gu = 'GU',
  /** Guinea-Bissau */
  Gw = 'GW',
  /** Guyana */
  Gy = 'GY',
  /** Hong Kong */
  Hk = 'HK',
  /** Heard Island and McDonald Islands */
  Hm = 'HM',
  /** Honduras */
  Hn = 'HN',
  /** Croatia */
  Hr = 'HR',
  /** Haiti */
  Ht = 'HT',
  /** Hungary */
  Hu = 'HU',
  /** Indonesia */
  Id = 'ID',
  /** Ireland */
  Ie = 'IE',
  /** Israel */
  Il = 'IL',
  /** Isle of Man */
  Im = 'IM',
  /** India */
  In = 'IN',
  /** British Indian Ocean Territory */
  Io = 'IO',
  /** Iraq */
  Iq = 'IQ',
  /** Iran (Islamic Republic of) */
  Ir = 'IR',
  /** Iceland */
  Is = 'IS',
  /** Italy */
  It = 'IT',
  /** Jersey */
  Je = 'JE',
  /** Jamaica */
  Jm = 'JM',
  /** Jordan */
  Jo = 'JO',
  /** Japan */
  Jp = 'JP',
  /** Kenya */
  Ke = 'KE',
  /** Kyrgyzstan */
  Kg = 'KG',
  /** Cambodia */
  Kh = 'KH',
  /** Kiribati */
  Ki = 'KI',
  /** Comoros */
  Km = 'KM',
  /** Saint Kitts and Nevis */
  Kn = 'KN',
  /** Korea (Democratic People's Republic of) */
  Kp = 'KP',
  /** Korea (Republic of) */
  Kr = 'KR',
  /** Kuwait */
  Kw = 'KW',
  /** Cayman Islands */
  Ky = 'KY',
  /** Kazakhstan */
  Kz = 'KZ',
  /** Lao People's Democratic Republic */
  La = 'LA',
  /** Lebanon */
  Lb = 'LB',
  /** Saint Lucia */
  Lc = 'LC',
  /** Liechtenstein */
  Li = 'LI',
  /** Sri Lanka */
  Lk = 'LK',
  /** Liberia */
  Lr = 'LR',
  /** Lesotho */
  Ls = 'LS',
  /** Lithuania */
  Lt = 'LT',
  /** Luxembourg */
  Lu = 'LU',
  /** Latvia */
  Lv = 'LV',
  /** Libya */
  Ly = 'LY',
  /** Morocco */
  Ma = 'MA',
  /** Monaco */
  Mc = 'MC',
  /** Moldova (Republic of) */
  Md = 'MD',
  /** Montenegro */
  Me = 'ME',
  /** Saint Martin (French part) */
  Mf = 'MF',
  /** Madagascar */
  Mg = 'MG',
  /** Marshall Islands */
  Mh = 'MH',
  /** North Macedonia */
  Mk = 'MK',
  /** Mali */
  Ml = 'ML',
  /** Myanmar */
  Mm = 'MM',
  /** Mongolia */
  Mn = 'MN',
  /** Macao */
  Mo = 'MO',
  /** Northern Mariana Islands */
  Mp = 'MP',
  /** Martinique */
  Mq = 'MQ',
  /** Mauritania */
  Mr = 'MR',
  /** Montserrat */
  Ms = 'MS',
  /** Malta */
  Mt = 'MT',
  /** Mauritius */
  Mu = 'MU',
  /** Maldives */
  Mv = 'MV',
  /** Malawi */
  Mw = 'MW',
  /** Mexico */
  Mx = 'MX',
  /** Malaysia */
  My = 'MY',
  /** Mozambique */
  Mz = 'MZ',
  /** Namibia */
  Na = 'NA',
  /** New Caledonia */
  Nc = 'NC',
  /** Niger */
  Ne = 'NE',
  /** Norfolk Island */
  Nf = 'NF',
  /** Nigeria */
  Ng = 'NG',
  /** Nicaragua */
  Ni = 'NI',
  /** Netherlands */
  Nl = 'NL',
  /** Norway */
  No = 'NO',
  /** Nepal */
  Np = 'NP',
  /** Nauru */
  Nr = 'NR',
  /** Niue */
  Nu = 'NU',
  /** New Zealand */
  Nz = 'NZ',
  /** Oman */
  Om = 'OM',
  /** Panama */
  Pa = 'PA',
  /** Peru */
  Pe = 'PE',
  /** French Polynesia */
  Pf = 'PF',
  /** Papua New Guinea */
  Pg = 'PG',
  /** Philippines */
  Ph = 'PH',
  /** Pakistan */
  Pk = 'PK',
  /** Poland */
  Pl = 'PL',
  /** Saint Pierre and Miquelon */
  Pm = 'PM',
  /** Pitcairn */
  Pn = 'PN',
  /** Puerto Rico */
  Pr = 'PR',
  /** Palestine, State of */
  Ps = 'PS',
  /** Portugal */
  Pt = 'PT',
  /** Palau */
  Pw = 'PW',
  /** Paraguay */
  Py = 'PY',
  /** Qatar */
  Qa = 'QA',
  /** Réunion */
  Re = 'RE',
  /** Romania */
  Ro = 'RO',
  /** Serbia */
  Rs = 'RS',
  /** Russian Federation */
  Ru = 'RU',
  /** Rwanda */
  Rw = 'RW',
  /** Saudi Arabia */
  Sa = 'SA',
  /** Solomon Islands */
  Sb = 'SB',
  /** Seychelles */
  Sc = 'SC',
  /** Sudan */
  Sd = 'SD',
  /** Sweden */
  Se = 'SE',
  /** Singapore */
  Sg = 'SG',
  /** Saint Helena, Ascension and Tristan da Cunha */
  Sh = 'SH',
  /** Slovenia */
  Si = 'SI',
  /** Svalbard and Jan Mayen */
  Sj = 'SJ',
  /** Slovakia */
  Sk = 'SK',
  /** Sierra Leone */
  Sl = 'SL',
  /** San Marino */
  Sm = 'SM',
  /** Senegal */
  Sn = 'SN',
  /** Somalia */
  So = 'SO',
  /** Suriname */
  Sr = 'SR',
  /** South Sudan */
  Ss = 'SS',
  /** Sao Tome and Principe */
  St = 'ST',
  /** El Salvador */
  Sv = 'SV',
  /** Sint Maarten (Dutch part) */
  Sx = 'SX',
  /** Syrian Arab Republic */
  Sy = 'SY',
  /** Eswatini */
  Sz = 'SZ',
  /** Turks and Caicos Islands */
  Tc = 'TC',
  /** Chad */
  Td = 'TD',
  /** French Southern Territories */
  Tf = 'TF',
  /** Togo */
  Tg = 'TG',
  /** Thailand */
  Th = 'TH',
  /** Tajikistan */
  Tj = 'TJ',
  /** Tokelau */
  Tk = 'TK',
  /** Timor-Leste */
  Tl = 'TL',
  /** Turkmenistan */
  Tm = 'TM',
  /** Tunisia */
  Tn = 'TN',
  /** Tonga */
  To = 'TO',
  /** Türkiye */
  Tr = 'TR',
  /** Trinidad and Tobago */
  Tt = 'TT',
  /** Tuvalu */
  Tv = 'TV',
  /** Taiwan, Province of China */
  Tw = 'TW',
  /** Tanzania, United Republic of */
  Tz = 'TZ',
  /** Ukraine */
  Ua = 'UA',
  /** Uganda */
  Ug = 'UG',
  /** United States Minor Outlying Islands */
  Um = 'UM',
  /** United States of America */
  Us = 'US',
  /** Uruguay */
  Uy = 'UY',
  /** Uzbekistan */
  Uz = 'UZ',
  /** Holy See */
  Va = 'VA',
  /** Saint Vincent and the Grenadines */
  Vc = 'VC',
  /** Venezuela (Bolivarian Republic of) */
  Ve = 'VE',
  /** Virgin Islands (British) */
  Vg = 'VG',
  /** Virgin Islands (U.S.) */
  Vi = 'VI',
  /** Viet Nam */
  Vn = 'VN',
  /** Vanuatu */
  Vu = 'VU',
  /** Wallis and Futuna */
  Wf = 'WF',
  /** Samoa */
  Ws = 'WS',
  /** Yemen */
  Ye = 'YE',
  /** Mayotte */
  Yt = 'YT',
  /** South Africa */
  Za = 'ZA',
  /** Zambia */
  Zm = 'ZM',
  /** Zimbabwe */
  Zw = 'ZW'
}

export type Coupon = {
  __typename?: 'Coupon';
  amountCents?: Maybe<Scalars['BigInt']['output']>;
  amountCurrency?: Maybe<CurrencyEnum>;
  appliedCouponsCount: Scalars['Int']['output'];
  billableMetrics?: Maybe<Array<BillableMetric>>;
  code?: Maybe<Scalars['String']['output']>;
  couponType: CouponTypeEnum;
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** Number of customers using this coupon */
  customersCount: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  expiration: CouponExpiration;
  expirationAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  frequency: CouponFrequency;
  frequencyDuration?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  limitedBillableMetrics: Scalars['Boolean']['output'];
  limitedPlans: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  percentageRate?: Maybe<Scalars['Float']['output']>;
  plans?: Maybe<Array<Plan>>;
  reusable: Scalars['Boolean']['output'];
  status: CouponStatusEnum;
  terminatedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export enum CouponExpiration {
  NoExpiration = 'no_expiration',
  TimeLimit = 'time_limit'
}

export enum CouponFrequency {
  Forever = 'forever',
  Once = 'once',
  Recurring = 'recurring'
}

export enum CouponStatusEnum {
  Active = 'active',
  Terminated = 'terminated'
}

export enum CouponTypeEnum {
  FixedAmount = 'fixed_amount',
  Percentage = 'percentage'
}

/** CreditNote */
export type CreditNote = {
  __typename?: 'CreditNote';
  appliedTaxes?: Maybe<Array<CreditNoteAppliedTax>>;
  balanceAmountCents: Scalars['BigInt']['output'];
  /** Check if credit note can be voided */
  canBeVoided: Scalars['Boolean']['output'];
  couponsAdjustmentAmountCents: Scalars['BigInt']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  creditAmountCents: Scalars['BigInt']['output'];
  creditStatus?: Maybe<CreditNoteCreditStatusEnum>;
  currency: CurrencyEnum;
  customer: Customer;
  description?: Maybe<Scalars['String']['output']>;
  errorDetails?: Maybe<Array<ErrorDetail>>;
  externalIntegrationId?: Maybe<Scalars['String']['output']>;
  fileUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  integrationSyncable: Scalars['Boolean']['output'];
  invoice?: Maybe<Invoice>;
  issuingDate: Scalars['ISO8601Date']['output'];
  items: Array<CreditNoteItem>;
  number: Scalars['String']['output'];
  reason: CreditNoteReasonEnum;
  refundAmountCents: Scalars['BigInt']['output'];
  refundStatus?: Maybe<CreditNoteRefundStatusEnum>;
  refundedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  sequentialId: Scalars['ID']['output'];
  subTotalExcludingTaxesAmountCents: Scalars['BigInt']['output'];
  taxProviderId?: Maybe<Scalars['String']['output']>;
  taxProviderSyncable: Scalars['Boolean']['output'];
  taxesAmountCents: Scalars['BigInt']['output'];
  taxesRate: Scalars['Float']['output'];
  totalAmountCents: Scalars['BigInt']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
  voidedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

export type CreditNoteAppliedTax = AppliedTax & {
  __typename?: 'CreditNoteAppliedTax';
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  baseAmountCents: Scalars['BigInt']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  creditNote: CreditNote;
  id: Scalars['ID']['output'];
  tax?: Maybe<Tax>;
  taxCode: Scalars['String']['output'];
  taxDescription?: Maybe<Scalars['String']['output']>;
  taxName: Scalars['String']['output'];
  taxRate: Scalars['Float']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export enum CreditNoteCreditStatusEnum {
  Available = 'available',
  Consumed = 'consumed',
  Voided = 'voided'
}

export type CreditNoteItem = {
  __typename?: 'CreditNoteItem';
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  createdAt: Scalars['ISO8601DateTime']['output'];
  fee: Fee;
  id: Scalars['ID']['output'];
};

export enum CreditNoteReasonEnum {
  DuplicatedCharge = 'duplicated_charge',
  FraudulentCharge = 'fraudulent_charge',
  OrderCancellation = 'order_cancellation',
  OrderChange = 'order_change',
  Other = 'other',
  ProductUnsatisfactory = 'product_unsatisfactory'
}

export enum CreditNoteRefundStatusEnum {
  Failed = 'failed',
  Pending = 'pending',
  Succeeded = 'succeeded'
}

export enum CurrencyEnum {
  /** United Arab Emirates Dirham */
  Aed = 'AED',
  /** Afghan Afghani */
  Afn = 'AFN',
  /** Albanian Lek */
  All = 'ALL',
  /** Armenian Dram */
  Amd = 'AMD',
  /** Netherlands Antillean Gulden */
  Ang = 'ANG',
  /** Angolan Kwanza */
  Aoa = 'AOA',
  /** Argentine Peso */
  Ars = 'ARS',
  /** Australian Dollar */
  Aud = 'AUD',
  /** Aruban Florin */
  Awg = 'AWG',
  /** Azerbaijani Manat */
  Azn = 'AZN',
  /** Bosnia and Herzegovina Convertible Mark */
  Bam = 'BAM',
  /** Barbadian Dollar */
  Bbd = 'BBD',
  /** Bangladeshi Taka */
  Bdt = 'BDT',
  /** Bulgarian Lev */
  Bgn = 'BGN',
  /** Burundian Franc */
  Bif = 'BIF',
  /** Bermudian Dollar */
  Bmd = 'BMD',
  /** Brunei Dollar */
  Bnd = 'BND',
  /** Bolivian Boliviano */
  Bob = 'BOB',
  /** Brazilian Real */
  Brl = 'BRL',
  /** Bahamian Dollar */
  Bsd = 'BSD',
  /** Botswana Pula */
  Bwp = 'BWP',
  /** Belarusian Ruble */
  Byn = 'BYN',
  /** Belize Dollar */
  Bzd = 'BZD',
  /** Canadian Dollar */
  Cad = 'CAD',
  /** Congolese Franc */
  Cdf = 'CDF',
  /** Swiss Franc */
  Chf = 'CHF',
  /** Unidad de Fomento */
  Clf = 'CLF',
  /** Chilean Peso */
  Clp = 'CLP',
  /** Chinese Renminbi Yuan */
  Cny = 'CNY',
  /** Colombian Peso */
  Cop = 'COP',
  /** Costa Rican Colón */
  Crc = 'CRC',
  /** Cape Verdean Escudo */
  Cve = 'CVE',
  /** Czech Koruna */
  Czk = 'CZK',
  /** Djiboutian Franc */
  Djf = 'DJF',
  /** Danish Krone */
  Dkk = 'DKK',
  /** Dominican Peso */
  Dop = 'DOP',
  /** Algerian Dinar */
  Dzd = 'DZD',
  /** Egyptian Pound */
  Egp = 'EGP',
  /** Ethiopian Birr */
  Etb = 'ETB',
  /** Euro */
  Eur = 'EUR',
  /** Fijian Dollar */
  Fjd = 'FJD',
  /** Falkland Pound */
  Fkp = 'FKP',
  /** British Pound */
  Gbp = 'GBP',
  /** Georgian Lari */
  Gel = 'GEL',
  /** Gibraltar Pound */
  Gip = 'GIP',
  /** Gambian Dalasi */
  Gmd = 'GMD',
  /** Guinean Franc */
  Gnf = 'GNF',
  /** Guatemalan Quetzal */
  Gtq = 'GTQ',
  /** Guyanese Dollar */
  Gyd = 'GYD',
  /** Hong Kong Dollar */
  Hkd = 'HKD',
  /** Honduran Lempira */
  Hnl = 'HNL',
  /** Croatian Kuna */
  Hrk = 'HRK',
  /** Haitian Gourde */
  Htg = 'HTG',
  /** Hungarian Forint */
  Huf = 'HUF',
  /** Indonesian Rupiah */
  Idr = 'IDR',
  /** Israeli New Sheqel */
  Ils = 'ILS',
  /** Indian Rupee */
  Inr = 'INR',
  /** Iranian Rial */
  Irr = 'IRR',
  /** Icelandic Króna */
  Isk = 'ISK',
  /** Jamaican Dollar */
  Jmd = 'JMD',
  /** Jordanian Dinar */
  Jod = 'JOD',
  /** Japanese Yen */
  Jpy = 'JPY',
  /** Kenyan Shilling */
  Kes = 'KES',
  /** Kyrgyzstani Som */
  Kgs = 'KGS',
  /** Cambodian Riel */
  Khr = 'KHR',
  /** Comorian Franc */
  Kmf = 'KMF',
  /** South Korean Won */
  Krw = 'KRW',
  /** Kuwaiti Dinar */
  Kwd = 'KWD',
  /** Cayman Islands Dollar */
  Kyd = 'KYD',
  /** Kazakhstani Tenge */
  Kzt = 'KZT',
  /** Lao Kip */
  Lak = 'LAK',
  /** Lebanese Pound */
  Lbp = 'LBP',
  /** Sri Lankan Rupee */
  Lkr = 'LKR',
  /** Liberian Dollar */
  Lrd = 'LRD',
  /** Lesotho Loti */
  Lsl = 'LSL',
  /** Moroccan Dirham */
  Mad = 'MAD',
  /** Moldovan Leu */
  Mdl = 'MDL',
  /** Malagasy Ariary */
  Mga = 'MGA',
  /** Macedonian Denar */
  Mkd = 'MKD',
  /** Myanmar Kyat */
  Mmk = 'MMK',
  /** Mongolian Tögrög */
  Mnt = 'MNT',
  /** Macanese Pataca */
  Mop = 'MOP',
  /** Mauritanian Ouguiya */
  Mro = 'MRO',
  /** Mauritian Rupee */
  Mur = 'MUR',
  /** Maldivian Rufiyaa */
  Mvr = 'MVR',
  /** Malawian Kwacha */
  Mwk = 'MWK',
  /** Mexican Peso */
  Mxn = 'MXN',
  /** Malaysian Ringgit */
  Myr = 'MYR',
  /** Mozambican Metical */
  Mzn = 'MZN',
  /** Namibian Dollar */
  Nad = 'NAD',
  /** Nigerian Naira */
  Ngn = 'NGN',
  /** Nicaraguan Córdoba */
  Nio = 'NIO',
  /** Norwegian Krone */
  Nok = 'NOK',
  /** Nepalese Rupee */
  Npr = 'NPR',
  /** New Zealand Dollar */
  Nzd = 'NZD',
  /** Panamanian Balboa */
  Pab = 'PAB',
  /** Peruvian Sol */
  Pen = 'PEN',
  /** Papua New Guinean Kina */
  Pgk = 'PGK',
  /** Philippine Peso */
  Php = 'PHP',
  /** Pakistani Rupee */
  Pkr = 'PKR',
  /** Polish Złoty */
  Pln = 'PLN',
  /** Paraguayan Guaraní */
  Pyg = 'PYG',
  /** Qatari Riyal */
  Qar = 'QAR',
  /** Romanian Leu */
  Ron = 'RON',
  /** Serbian Dinar */
  Rsd = 'RSD',
  /** Russian Ruble */
  Rub = 'RUB',
  /** Rwandan Franc */
  Rwf = 'RWF',
  /** Saudi Riyal */
  Sar = 'SAR',
  /** Solomon Islands Dollar */
  Sbd = 'SBD',
  /** Seychellois Rupee */
  Scr = 'SCR',
  /** Swedish Krona */
  Sek = 'SEK',
  /** Singapore Dollar */
  Sgd = 'SGD',
  /** Saint Helenian Pound */
  Shp = 'SHP',
  /** Sierra Leonean Leone */
  Sll = 'SLL',
  /** Somali Shilling */
  Sos = 'SOS',
  /** Surinamese Dollar */
  Srd = 'SRD',
  /** São Tomé and Príncipe Dobra */
  Std = 'STD',
  /** Swazi Lilangeni */
  Szl = 'SZL',
  /** Thai Baht */
  Thb = 'THB',
  /** Tajikistani Somoni */
  Tjs = 'TJS',
  /** Tongan Paʻanga */
  Top = 'TOP',
  /** Turkish Lira */
  Try = 'TRY',
  /** Trinidad and Tobago Dollar */
  Ttd = 'TTD',
  /** New Taiwan Dollar */
  Twd = 'TWD',
  /** Tanzanian Shilling */
  Tzs = 'TZS',
  /** Ukrainian Hryvnia */
  Uah = 'UAH',
  /** Ugandan Shilling */
  Ugx = 'UGX',
  /** United States Dollar */
  Usd = 'USD',
  /** Uruguayan Peso */
  Uyu = 'UYU',
  /** Uzbekistan Som */
  Uzs = 'UZS',
  /** Vietnamese Đồng */
  Vnd = 'VND',
  /** Vanuatu Vatu */
  Vuv = 'VUV',
  /** Samoan Tala */
  Wst = 'WST',
  /** Central African Cfa Franc */
  Xaf = 'XAF',
  /** East Caribbean Dollar */
  Xcd = 'XCD',
  /** West African Cfa Franc */
  Xof = 'XOF',
  /** Cfp Franc */
  Xpf = 'XPF',
  /** Yemeni Rial */
  Yer = 'YER',
  /** South African Rand */
  Zar = 'ZAR',
  /** Zambian Kwacha */
  Zmw = 'ZMW'
}

export type Customer = {
  __typename?: 'Customer';
  /** Number of active subscriptions per customer */
  activeSubscriptionsCount: Scalars['Int']['output'];
  addressLine1?: Maybe<Scalars['String']['output']>;
  addressLine2?: Maybe<Scalars['String']['output']>;
  anrokCustomer?: Maybe<AnrokCustomer>;
  applicableTimezone: TimezoneEnum;
  appliedAddOns?: Maybe<Array<AppliedAddOn>>;
  appliedCoupons?: Maybe<Array<AppliedCoupon>>;
  billingConfiguration?: Maybe<CustomerBillingConfiguration>;
  /** Check if customer attributes are editable */
  canEditAttributes: Scalars['Boolean']['output'];
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<CountryCode>;
  createdAt: Scalars['ISO8601DateTime']['output'];
  creditNotes?: Maybe<Array<CreditNote>>;
  /** Credit notes credits balance available per customer */
  creditNotesBalanceAmountCents: Scalars['BigInt']['output'];
  /** Number of available credits from credit notes per customer */
  creditNotesCreditsAvailableCount: Scalars['Int']['output'];
  currency?: Maybe<CurrencyEnum>;
  customerType?: Maybe<CustomerTypeEnum>;
  deletedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  displayName: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  externalId: Scalars['String']['output'];
  externalSalesforceId?: Maybe<Scalars['String']['output']>;
  /** Options for handling invoices with a zero total amount. */
  finalizeZeroAmountInvoice?: Maybe<FinalizeZeroAmountInvoiceEnum>;
  firstname?: Maybe<Scalars['String']['output']>;
  /** Define if a customer has an active wallet */
  hasActiveWallet: Scalars['Boolean']['output'];
  /** Define if a customer has any credit note */
  hasCreditNotes: Scalars['Boolean']['output'];
  /** Define if a customer has overdue invoices */
  hasOverdueInvoices: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  invoiceGracePeriod?: Maybe<Scalars['Int']['output']>;
  invoices?: Maybe<Array<Invoice>>;
  lastname?: Maybe<Scalars['String']['output']>;
  legalName?: Maybe<Scalars['String']['output']>;
  legalNumber?: Maybe<Scalars['String']['output']>;
  logoUrl?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Array<CustomerMetadata>>;
  name?: Maybe<Scalars['String']['output']>;
  netPaymentTerm?: Maybe<Scalars['Int']['output']>;
  netsuiteCustomer?: Maybe<NetsuiteCustomer>;
  paymentProvider?: Maybe<ProviderTypeEnum>;
  paymentProviderCode?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  providerCustomer?: Maybe<ProviderCustomer>;
  sequentialId: Scalars['String']['output'];
  shippingAddress?: Maybe<CustomerAddress>;
  slug: Scalars['String']['output'];
  state?: Maybe<Scalars['String']['output']>;
  /** Query subscriptions of a customer */
  subscriptions: Array<Subscription>;
  taxIdentificationNumber?: Maybe<Scalars['String']['output']>;
  taxes?: Maybe<Array<Tax>>;
  timezone?: Maybe<TimezoneEnum>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
  url?: Maybe<Scalars['String']['output']>;
  xeroCustomer?: Maybe<XeroCustomer>;
  zipcode?: Maybe<Scalars['String']['output']>;
};


export type CustomerSubscriptionsArgs = {
  status?: InputMaybe<Array<StatusTypeEnum>>;
};

export type CustomerAddress = {
  __typename?: 'CustomerAddress';
  addressLine1?: Maybe<Scalars['String']['output']>;
  addressLine2?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<CountryCode>;
  state?: Maybe<Scalars['String']['output']>;
  zipcode?: Maybe<Scalars['String']['output']>;
};

export type CustomerBillingConfiguration = {
  __typename?: 'CustomerBillingConfiguration';
  documentLocale?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
};

export type CustomerMetadata = {
  __typename?: 'CustomerMetadata';
  createdAt: Scalars['ISO8601DateTime']['output'];
  displayInInvoice: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
  value: Scalars['String']['output'];
};

export enum CustomerTypeEnum {
  Company = 'company',
  Individual = 'individual'
}

/** Autogenerated input type of DownloadCustomerPortalInvoice */
export type DownloadCustomerPortalInvoiceInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
};

export enum ErrorCodesEnum {
  NotProvided = 'not_provided',
  TaxError = 'tax_error',
  TaxVoidingError = 'tax_voiding_error'
}

export type ErrorDetail = {
  __typename?: 'ErrorDetail';
  errorCode: ErrorCodesEnum;
  errorDetails?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
};

export type Fee = InvoiceItem & {
  __typename?: 'Fee';
  adjustedFee: Scalars['Boolean']['output'];
  adjustedFeeType?: Maybe<AdjustedFeeTypeEnum>;
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  amountDetails?: Maybe<FeeAmountDetails>;
  appliedTaxes?: Maybe<Array<FeeAppliedTax>>;
  charge?: Maybe<Charge>;
  chargeFilter?: Maybe<ChargeFilter>;
  creditableAmountCents: Scalars['BigInt']['output'];
  currency: CurrencyEnum;
  description?: Maybe<Scalars['String']['output']>;
  eventsCount?: Maybe<Scalars['BigInt']['output']>;
  feeType: FeeTypesEnum;
  groupedBy: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  invoiceDisplayName?: Maybe<Scalars['String']['output']>;
  invoiceName?: Maybe<Scalars['String']['output']>;
  itemCode: Scalars['String']['output'];
  itemName: Scalars['String']['output'];
  itemType: Scalars['String']['output'];
  preciseUnitAmount: Scalars['Float']['output'];
  subscription?: Maybe<Subscription>;
  succeededAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  taxesAmountCents: Scalars['BigInt']['output'];
  taxesRate?: Maybe<Scalars['Float']['output']>;
  trueUpFee?: Maybe<Fee>;
  trueUpParentFee?: Maybe<Fee>;
  units: Scalars['Float']['output'];
};

export type FeeAmountDetails = {
  __typename?: 'FeeAmountDetails';
  fixedFeeTotalAmount?: Maybe<Scalars['String']['output']>;
  fixedFeeUnitAmount?: Maybe<Scalars['String']['output']>;
  flatUnitAmount?: Maybe<Scalars['String']['output']>;
  freeEvents?: Maybe<Scalars['Int']['output']>;
  freeUnits?: Maybe<Scalars['String']['output']>;
  graduatedPercentageRanges?: Maybe<Array<FeeAmountDetailsGraduatedPercentageRange>>;
  graduatedRanges?: Maybe<Array<FeeAmountDetailsGraduatedRange>>;
  minMaxAdjustmentTotalAmount?: Maybe<Scalars['String']['output']>;
  paidEvents?: Maybe<Scalars['Int']['output']>;
  paidUnits?: Maybe<Scalars['String']['output']>;
  perPackageSize?: Maybe<Scalars['Int']['output']>;
  perPackageUnitAmount?: Maybe<Scalars['String']['output']>;
  perUnitAmount?: Maybe<Scalars['String']['output']>;
  perUnitTotalAmount?: Maybe<Scalars['String']['output']>;
  rate?: Maybe<Scalars['String']['output']>;
  units?: Maybe<Scalars['String']['output']>;
};

export type FeeAmountDetailsGraduatedPercentageRange = {
  __typename?: 'FeeAmountDetailsGraduatedPercentageRange';
  flatUnitAmount?: Maybe<Scalars['String']['output']>;
  fromValue?: Maybe<Scalars['BigInt']['output']>;
  perUnitTotalAmount?: Maybe<Scalars['String']['output']>;
  rate?: Maybe<Scalars['String']['output']>;
  toValue?: Maybe<Scalars['BigInt']['output']>;
  totalWithFlatAmount?: Maybe<Scalars['String']['output']>;
  units?: Maybe<Scalars['String']['output']>;
};

export type FeeAmountDetailsGraduatedRange = {
  __typename?: 'FeeAmountDetailsGraduatedRange';
  flatUnitAmount?: Maybe<Scalars['String']['output']>;
  fromValue?: Maybe<Scalars['BigInt']['output']>;
  perUnitAmount?: Maybe<Scalars['String']['output']>;
  perUnitTotalAmount?: Maybe<Scalars['String']['output']>;
  toValue?: Maybe<Scalars['BigInt']['output']>;
  totalWithFlatAmount?: Maybe<Scalars['String']['output']>;
  units?: Maybe<Scalars['String']['output']>;
};

export type FeeAppliedTax = AppliedTax & {
  __typename?: 'FeeAppliedTax';
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  createdAt: Scalars['ISO8601DateTime']['output'];
  fee: Fee;
  id: Scalars['ID']['output'];
  tax?: Maybe<Tax>;
  taxCode: Scalars['String']['output'];
  taxDescription?: Maybe<Scalars['String']['output']>;
  taxName: Scalars['String']['output'];
  taxRate: Scalars['Float']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export enum FeeTypesEnum {
  AddOn = 'add_on',
  Charge = 'charge',
  Commitment = 'commitment',
  Credit = 'credit',
  Subscription = 'subscription'
}

export enum FinalizeZeroAmountInvoiceEnum {
  Finalize = 'finalize',
  Inherit = 'inherit',
  Skip = 'skip'
}

export type FinalizedInvoiceCollection = {
  __typename?: 'FinalizedInvoiceCollection';
  amountCents: Scalars['BigInt']['output'];
  currency?: Maybe<CurrencyEnum>;
  invoicesCount: Scalars['BigInt']['output'];
  month: Scalars['ISO8601DateTime']['output'];
  paymentStatus?: Maybe<InvoicePaymentStatusTypeEnum>;
};

/** FinalizedInvoiceCollectionCollection type */
export type FinalizedInvoiceCollectionCollection = {
  __typename?: 'FinalizedInvoiceCollectionCollection';
  /** A collection of paginated FinalizedInvoiceCollectionCollection */
  collection: Array<FinalizedInvoiceCollection>;
  /** Pagination Metadata for navigating the Pagination */
  metadata: CollectionMetadata;
};

export type GraduatedPercentageRange = {
  __typename?: 'GraduatedPercentageRange';
  flatAmount: Scalars['String']['output'];
  fromValue: Scalars['BigInt']['output'];
  rate: Scalars['String']['output'];
  toValue?: Maybe<Scalars['BigInt']['output']>;
};

export type GraduatedRange = {
  __typename?: 'GraduatedRange';
  flatAmount: Scalars['String']['output'];
  fromValue: Scalars['BigInt']['output'];
  perUnitAmount: Scalars['String']['output'];
  toValue?: Maybe<Scalars['BigInt']['output']>;
};

export enum IntegrationTypeEnum {
  Anrok = 'anrok',
  Hubspot = 'hubspot',
  Netsuite = 'netsuite',
  Okta = 'okta',
  ProgressiveBilling = 'progressive_billing',
  Xero = 'xero'
}

/** Invoice */
export type Invoice = {
  __typename?: 'Invoice';
  appliedTaxes?: Maybe<Array<InvoiceAppliedTax>>;
  chargeAmountCents: Scalars['BigInt']['output'];
  couponsAmountCents: Scalars['BigInt']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  creditNotes?: Maybe<Array<CreditNote>>;
  creditNotesAmountCents: Scalars['BigInt']['output'];
  creditableAmountCents: Scalars['BigInt']['output'];
  currency?: Maybe<CurrencyEnum>;
  customer: Customer;
  errorDetails?: Maybe<Array<ErrorDetail>>;
  externalIntegrationId?: Maybe<Scalars['String']['output']>;
  fees?: Maybe<Array<Fee>>;
  feesAmountCents: Scalars['BigInt']['output'];
  fileUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  integrationSyncable: Scalars['Boolean']['output'];
  invoiceSubscriptions?: Maybe<Array<InvoiceSubscription>>;
  invoiceType: InvoiceTypeEnum;
  issuingDate: Scalars['ISO8601Date']['output'];
  metadata?: Maybe<Array<InvoiceMetadata>>;
  number: Scalars['String']['output'];
  paymentDisputeLosable: Scalars['Boolean']['output'];
  paymentDisputeLostAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  paymentDueDate: Scalars['ISO8601Date']['output'];
  paymentOverdue: Scalars['Boolean']['output'];
  paymentStatus: InvoicePaymentStatusTypeEnum;
  prepaidCreditAmountCents: Scalars['BigInt']['output'];
  progressiveBillingCreditAmountCents: Scalars['BigInt']['output'];
  refundableAmountCents: Scalars['BigInt']['output'];
  sequentialId: Scalars['ID']['output'];
  status: InvoiceStatusTypeEnum;
  subTotalExcludingTaxesAmountCents: Scalars['BigInt']['output'];
  subTotalIncludingTaxesAmountCents: Scalars['BigInt']['output'];
  subscriptions?: Maybe<Array<Subscription>>;
  taxProviderVoidable: Scalars['Boolean']['output'];
  taxesAmountCents: Scalars['BigInt']['output'];
  taxesRate: Scalars['Float']['output'];
  totalAmountCents: Scalars['BigInt']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
  versionNumber: Scalars['Int']['output'];
  voidable: Scalars['Boolean']['output'];
};

export type InvoiceAppliedTax = AppliedTax & {
  __typename?: 'InvoiceAppliedTax';
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  appliedOnWholeInvoice: Scalars['Boolean']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  enumedTaxCode?: Maybe<InvoiceAppliedTaxOnWholeInvoiceCodeEnum>;
  feesAmountCents: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  invoice: Invoice;
  tax?: Maybe<Tax>;
  taxCode: Scalars['String']['output'];
  taxDescription?: Maybe<Scalars['String']['output']>;
  taxName: Scalars['String']['output'];
  taxRate: Scalars['Float']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export enum InvoiceAppliedTaxOnWholeInvoiceCodeEnum {
  CustomerExempt = 'customer_exempt',
  JurisHasNoTax = 'juris_has_no_tax',
  JurisNotTaxed = 'juris_not_taxed',
  NotCollecting = 'not_collecting',
  ReverseCharge = 'reverse_charge',
  TransactionExempt = 'transaction_exempt',
  UnknownTaxation = 'unknown_taxation'
}

/** InvoiceCollection type */
export type InvoiceCollection = {
  __typename?: 'InvoiceCollection';
  /** A collection of paginated InvoiceCollection */
  collection: Array<Invoice>;
  /** Pagination Metadata for navigating the Pagination */
  metadata: CollectionMetadata;
};

/** Invoice Item */
export type InvoiceItem = {
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  id: Scalars['ID']['output'];
  itemCode: Scalars['String']['output'];
  itemName: Scalars['String']['output'];
  itemType: Scalars['String']['output'];
};

/** Attributes for invoice metadata object */
export type InvoiceMetadata = {
  __typename?: 'InvoiceMetadata';
  createdAt: Scalars['ISO8601DateTime']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
  value: Scalars['String']['output'];
};

export enum InvoicePaymentStatusTypeEnum {
  Failed = 'failed',
  Pending = 'pending',
  Succeeded = 'succeeded'
}

export enum InvoiceStatusTypeEnum {
  Closed = 'closed',
  Draft = 'draft',
  Failed = 'failed',
  Finalized = 'finalized',
  Generating = 'generating',
  Open = 'open',
  Voided = 'voided'
}

export type InvoiceSubscription = {
  __typename?: 'InvoiceSubscription';
  chargeAmountCents: Scalars['BigInt']['output'];
  chargesFromDatetime?: Maybe<Scalars['ISO8601DateTime']['output']>;
  chargesToDatetime?: Maybe<Scalars['ISO8601DateTime']['output']>;
  fees?: Maybe<Array<Fee>>;
  fromDatetime?: Maybe<Scalars['ISO8601DateTime']['output']>;
  inAdvanceChargesFromDatetime?: Maybe<Scalars['ISO8601DateTime']['output']>;
  inAdvanceChargesToDatetime?: Maybe<Scalars['ISO8601DateTime']['output']>;
  invoice: Invoice;
  subscription: Subscription;
  subscriptionAmountCents: Scalars['BigInt']['output'];
  toDatetime?: Maybe<Scalars['ISO8601DateTime']['output']>;
  totalAmountCents: Scalars['BigInt']['output'];
};

export enum InvoiceTypeEnum {
  AddOn = 'add_on',
  AdvanceCharges = 'advance_charges',
  Credit = 'credit',
  OneOff = 'one_off',
  ProgressiveBilling = 'progressive_billing',
  Subscription = 'subscription'
}

export enum LagoApiError {
  AccountingTimeZoneNotSetForSeller = 'accountingTimeZoneNotSetForSeller',
  AccountingTimeZoneNotSupported = 'accountingTimeZoneNotSupported',
  CouponIsNotReusable = 'coupon_is_not_reusable',
  CurrenciesDoesNotMatch = 'currencies_does_not_match',
  CurrencyCodeNotSupported = 'currencyCodeNotSupported',
  CustomerAddressCouldNotResolve = 'customerAddressCouldNotResolve',
  CustomerAddressCountryNotSupported = 'customerAddressCountryNotSupported',
  CustomerIdNotFound = 'customerIdNotFound',
  DoesNotMatchItemAmounts = 'does_not_match_item_amounts',
  DomainNotConfigured = 'domain_not_configured',
  EmailAlreadyUsed = 'email_already_used',
  ExpiredJwtToken = 'expired_jwt_token',
  ExternalServiceError = 'externalServiceError',
  Forbidden = 'forbidden',
  GoogleAuthMissingSetup = 'google_auth_missing_setup',
  IncorrectLoginOrPassword = 'incorrect_login_or_password',
  InternalError = 'internal_error',
  InvalidGoogleCode = 'invalid_google_code',
  InvalidGoogleToken = 'invalid_google_token',
  InviteAlreadyExists = 'invite_already_exists',
  InviteEmailMistmatch = 'invite_email_mistmatch',
  InviteNotFound = 'invite_not_found',
  InvoicesNotOverdue = 'invoices_not_overdue',
  NotFound = 'not_found',
  NotOrganizationMember = 'not_organization_member',
  OktaUserinfoError = 'okta_userinfo_error',
  PaymentProcessorIsCurrentlyHandlingPayment = 'payment_processor_is_currently_handling_payment',
  PlanNotFound = 'plan_not_found',
  PlanOverlapping = 'plan_overlapping',
  ProductExternalIdUnknown = 'productExternalIdUnknown',
  TaxDateTooFarInFuture = 'taxDateTooFarInFuture',
  TaxDateTooFarInPast = 'taxDateTooFarInPast',
  TokenEncodingError = 'token_encoding_error',
  Unauthorized = 'unauthorized',
  UnprocessableEntity = 'unprocessable_entity',
  UrlIsInvalid = 'url_is_invalid',
  UserAlreadyExists = 'user_already_exists',
  UserDoesNotExist = 'user_does_not_exist',
  ValueAlreadyExist = 'value_already_exist',
  ValueIsInvalid = 'value_is_invalid',
  ValueIsOutOfRange = 'value_is_out_of_range'
}

export enum MappableTypeEnum {
  AddOn = 'AddOn',
  BillableMetric = 'BillableMetric'
}

export type Mapping = {
  __typename?: 'Mapping';
  externalAccountCode?: Maybe<Scalars['String']['output']>;
  externalId: Scalars['String']['output'];
  externalName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  integrationId: Scalars['ID']['output'];
  mappableId: Scalars['ID']['output'];
  mappableType: MappableTypeEnum;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Download customer portal invoice PDF */
  downloadCustomerPortalInvoice?: Maybe<Invoice>;
};


export type MutationDownloadCustomerPortalInvoiceArgs = {
  input: DownloadCustomerPortalInvoiceInput;
};

export type NetsuiteCustomer = {
  __typename?: 'NetsuiteCustomer';
  externalCustomerId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  integrationCode?: Maybe<Scalars['String']['output']>;
  integrationId?: Maybe<Scalars['ID']['output']>;
  integrationType?: Maybe<IntegrationTypeEnum>;
  subsidiaryId?: Maybe<Scalars['String']['output']>;
  syncWithProvider?: Maybe<Scalars['Boolean']['output']>;
};

/** Safe Organization Type */
export type Organization = {
  __typename?: 'Organization';
  billingConfiguration?: Maybe<OrganizationBillingConfiguration>;
  defaultCurrency: CurrencyEnum;
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  timezone?: Maybe<TimezoneEnum>;
};

export type OrganizationBillingConfiguration = {
  __typename?: 'OrganizationBillingConfiguration';
  documentLocale?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  invoiceFooter?: Maybe<Scalars['String']['output']>;
  invoiceGracePeriod: Scalars['Int']['output'];
};

export type OverdueBalance = {
  __typename?: 'OverdueBalance';
  amountCents: Scalars['BigInt']['output'];
  currency: CurrencyEnum;
  lagoInvoiceIds: Array<Scalars['String']['output']>;
  month: Scalars['ISO8601DateTime']['output'];
};

/** OverdueBalanceCollection type */
export type OverdueBalanceCollection = {
  __typename?: 'OverdueBalanceCollection';
  /** A collection of paginated OverdueBalanceCollection */
  collection: Array<OverdueBalance>;
  /** Pagination Metadata for navigating the Pagination */
  metadata: CollectionMetadata;
};

export type Plan = {
  __typename?: 'Plan';
  activeSubscriptionsCount: Scalars['Int']['output'];
  amountCents: Scalars['BigInt']['output'];
  amountCurrency: CurrencyEnum;
  billChargesMonthly?: Maybe<Scalars['Boolean']['output']>;
  charges?: Maybe<Array<Charge>>;
  /** Number of charges attached to a plan */
  chargesCount: Scalars['Int']['output'];
  code: Scalars['String']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** Number of customers attached to a plan */
  customersCount: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  draftInvoicesCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  interval: PlanInterval;
  invoiceDisplayName?: Maybe<Scalars['String']['output']>;
  minimumCommitment?: Maybe<Commitment>;
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  parent?: Maybe<Plan>;
  payInAdvance: Scalars['Boolean']['output'];
  subscriptionsCount: Scalars['Int']['output'];
  taxes?: Maybe<Array<Tax>>;
  trialPeriod?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
  usageThresholds?: Maybe<Array<UsageThreshold>>;
};

export enum PlanInterval {
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Weekly = 'weekly',
  Yearly = 'yearly'
}

export type Properties = {
  __typename?: 'Properties';
  amount?: Maybe<Scalars['String']['output']>;
  customProperties?: Maybe<Scalars['JSON']['output']>;
  fixedAmount?: Maybe<Scalars['String']['output']>;
  freeUnits?: Maybe<Scalars['BigInt']['output']>;
  freeUnitsPerEvents?: Maybe<Scalars['BigInt']['output']>;
  freeUnitsPerTotalAggregation?: Maybe<Scalars['String']['output']>;
  graduatedPercentageRanges?: Maybe<Array<GraduatedPercentageRange>>;
  graduatedRanges?: Maybe<Array<GraduatedRange>>;
  groupedBy?: Maybe<Array<Scalars['String']['output']>>;
  packageSize?: Maybe<Scalars['BigInt']['output']>;
  perTransactionMaxAmount?: Maybe<Scalars['String']['output']>;
  perTransactionMinAmount?: Maybe<Scalars['String']['output']>;
  rate?: Maybe<Scalars['String']['output']>;
  volumeRanges?: Maybe<Array<VolumeRange>>;
};

export type ProviderCustomer = {
  __typename?: 'ProviderCustomer';
  id: Scalars['ID']['output'];
  providerCustomerId?: Maybe<Scalars['ID']['output']>;
  providerPaymentMethods?: Maybe<Array<ProviderPaymentMethodsEnum>>;
  syncWithProvider?: Maybe<Scalars['Boolean']['output']>;
};

export enum ProviderPaymentMethodsEnum {
  BacsDebit = 'bacs_debit',
  Card = 'card',
  Link = 'link',
  SepaDebit = 'sepa_debit',
  UsBankAccount = 'us_bank_account'
}

export enum ProviderTypeEnum {
  Adyen = 'adyen',
  Gocardless = 'gocardless',
  Stripe = 'stripe'
}

export type Query = {
  __typename?: 'Query';
  /** Query invoice collections of a customer portal user */
  customerPortalInvoiceCollections: FinalizedInvoiceCollectionCollection;
  /** Query invoices of a customer */
  customerPortalInvoices: InvoiceCollection;
  /** Query customer portal organization */
  customerPortalOrganization?: Maybe<Organization>;
  /** Query overdue balances of a customer portal user */
  customerPortalOverdueBalances: OverdueBalanceCollection;
  /** Query a customer portal user */
  customerPortalUser?: Maybe<Customer>;
};


export type QueryCustomerPortalInvoiceCollectionsArgs = {
  expireCache?: InputMaybe<Scalars['Boolean']['input']>;
  months?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCustomerPortalInvoicesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<InvoiceStatusTypeEnum>>;
};


export type QueryCustomerPortalOverdueBalancesArgs = {
  expireCache?: InputMaybe<Scalars['Boolean']['input']>;
  months?: InputMaybe<Scalars['Int']['input']>;
};

export enum RegroupPaidFeesEnum {
  Invoice = 'invoice'
}

export enum StatusTypeEnum {
  Active = 'active',
  Canceled = 'canceled',
  Pending = 'pending',
  Terminated = 'terminated'
}

export type Subscription = {
  __typename?: 'Subscription';
  billingTime?: Maybe<BillingTimeEnum>;
  canceledAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  createdAt: Scalars['ISO8601DateTime']['output'];
  customer: Customer;
  endingAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  externalId: Scalars['String']['output'];
  fees?: Maybe<Array<Fee>>;
  id: Scalars['ID']['output'];
  lifetimeUsage?: Maybe<SubscriptionLifetimeUsage>;
  name?: Maybe<Scalars['String']['output']>;
  nextName?: Maybe<Scalars['String']['output']>;
  nextPendingStartDate?: Maybe<Scalars['ISO8601Date']['output']>;
  nextPlan?: Maybe<Plan>;
  nextSubscription?: Maybe<Subscription>;
  periodEndDate?: Maybe<Scalars['ISO8601Date']['output']>;
  plan: Plan;
  startedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  status?: Maybe<StatusTypeEnum>;
  subscriptionAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  terminatedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export type SubscriptionLifetimeUsage = {
  __typename?: 'SubscriptionLifetimeUsage';
  lastThresholdAmountCents?: Maybe<Scalars['BigInt']['output']>;
  nextThresholdAmountCents?: Maybe<Scalars['BigInt']['output']>;
  nextThresholdRatio?: Maybe<Scalars['Float']['output']>;
  totalUsageAmountCents: Scalars['BigInt']['output'];
  totalUsageFromDatetime: Scalars['ISO8601DateTime']['output'];
  totalUsageToDatetime: Scalars['ISO8601DateTime']['output'];
};

export type Tax = {
  __typename?: 'Tax';
  /** Number of add ons using this tax */
  addOnsCount: Scalars['Int']['output'];
  appliedToOrganization: Scalars['Boolean']['output'];
  autoGenerated: Scalars['Boolean']['output'];
  /** Number of charges using this tax */
  chargesCount: Scalars['Int']['output'];
  code: Scalars['String']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** Number of customers using this tax */
  customersCount: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  /** Number of plans using this tax */
  plansCount: Scalars['Int']['output'];
  rate: Scalars['Float']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export enum TimezoneEnum {
  /** Africa/Algiers */
  TzAfricaAlgiers = 'TZ_AFRICA_ALGIERS',
  /** Africa/Cairo */
  TzAfricaCairo = 'TZ_AFRICA_CAIRO',
  /** Africa/Casablanca */
  TzAfricaCasablanca = 'TZ_AFRICA_CASABLANCA',
  /** Africa/Harare */
  TzAfricaHarare = 'TZ_AFRICA_HARARE',
  /** Africa/Johannesburg */
  TzAfricaJohannesburg = 'TZ_AFRICA_JOHANNESBURG',
  /** Africa/Monrovia */
  TzAfricaMonrovia = 'TZ_AFRICA_MONROVIA',
  /** Africa/Nairobi */
  TzAfricaNairobi = 'TZ_AFRICA_NAIROBI',
  /** America/Argentina/Buenos_Aires */
  TzAmericaArgentinaBuenosAires = 'TZ_AMERICA_ARGENTINA_BUENOS_AIRES',
  /** America/Bogota */
  TzAmericaBogota = 'TZ_AMERICA_BOGOTA',
  /** America/Caracas */
  TzAmericaCaracas = 'TZ_AMERICA_CARACAS',
  /** America/Chicago */
  TzAmericaChicago = 'TZ_AMERICA_CHICAGO',
  /** America/Chihuahua */
  TzAmericaChihuahua = 'TZ_AMERICA_CHIHUAHUA',
  /** America/Denver */
  TzAmericaDenver = 'TZ_AMERICA_DENVER',
  /** America/Godthab */
  TzAmericaGodthab = 'TZ_AMERICA_GODTHAB',
  /** America/Guatemala */
  TzAmericaGuatemala = 'TZ_AMERICA_GUATEMALA',
  /** America/Guyana */
  TzAmericaGuyana = 'TZ_AMERICA_GUYANA',
  /** America/Halifax */
  TzAmericaHalifax = 'TZ_AMERICA_HALIFAX',
  /** America/Indiana/Indianapolis */
  TzAmericaIndianaIndianapolis = 'TZ_AMERICA_INDIANA_INDIANAPOLIS',
  /** America/Juneau */
  TzAmericaJuneau = 'TZ_AMERICA_JUNEAU',
  /** America/La_Paz */
  TzAmericaLaPaz = 'TZ_AMERICA_LA_PAZ',
  /** America/Lima */
  TzAmericaLima = 'TZ_AMERICA_LIMA',
  /** America/Los_Angeles */
  TzAmericaLosAngeles = 'TZ_AMERICA_LOS_ANGELES',
  /** America/Mazatlan */
  TzAmericaMazatlan = 'TZ_AMERICA_MAZATLAN',
  /** America/Mexico_City */
  TzAmericaMexicoCity = 'TZ_AMERICA_MEXICO_CITY',
  /** America/Monterrey */
  TzAmericaMonterrey = 'TZ_AMERICA_MONTERREY',
  /** America/Montevideo */
  TzAmericaMontevideo = 'TZ_AMERICA_MONTEVIDEO',
  /** America/New_York */
  TzAmericaNewYork = 'TZ_AMERICA_NEW_YORK',
  /** America/Phoenix */
  TzAmericaPhoenix = 'TZ_AMERICA_PHOENIX',
  /** America/Puerto_Rico */
  TzAmericaPuertoRico = 'TZ_AMERICA_PUERTO_RICO',
  /** America/Regina */
  TzAmericaRegina = 'TZ_AMERICA_REGINA',
  /** America/Santiago */
  TzAmericaSantiago = 'TZ_AMERICA_SANTIAGO',
  /** America/Sao_Paulo */
  TzAmericaSaoPaulo = 'TZ_AMERICA_SAO_PAULO',
  /** America/St_Johns */
  TzAmericaStJohns = 'TZ_AMERICA_ST_JOHNS',
  /** America/Tijuana */
  TzAmericaTijuana = 'TZ_AMERICA_TIJUANA',
  /** Asia/Almaty */
  TzAsiaAlmaty = 'TZ_ASIA_ALMATY',
  /** Asia/Baghdad */
  TzAsiaBaghdad = 'TZ_ASIA_BAGHDAD',
  /** Asia/Baku */
  TzAsiaBaku = 'TZ_ASIA_BAKU',
  /** Asia/Bangkok */
  TzAsiaBangkok = 'TZ_ASIA_BANGKOK',
  /** Asia/Chongqing */
  TzAsiaChongqing = 'TZ_ASIA_CHONGQING',
  /** Asia/Colombo */
  TzAsiaColombo = 'TZ_ASIA_COLOMBO',
  /** Asia/Dhaka */
  TzAsiaDhaka = 'TZ_ASIA_DHAKA',
  /** Asia/Hong_Kong */
  TzAsiaHongKong = 'TZ_ASIA_HONG_KONG',
  /** Asia/Irkutsk */
  TzAsiaIrkutsk = 'TZ_ASIA_IRKUTSK',
  /** Asia/Jakarta */
  TzAsiaJakarta = 'TZ_ASIA_JAKARTA',
  /** Asia/Jerusalem */
  TzAsiaJerusalem = 'TZ_ASIA_JERUSALEM',
  /** Asia/Kabul */
  TzAsiaKabul = 'TZ_ASIA_KABUL',
  /** Asia/Kamchatka */
  TzAsiaKamchatka = 'TZ_ASIA_KAMCHATKA',
  /** Asia/Karachi */
  TzAsiaKarachi = 'TZ_ASIA_KARACHI',
  /** Asia/Kathmandu */
  TzAsiaKathmandu = 'TZ_ASIA_KATHMANDU',
  /** Asia/Kolkata */
  TzAsiaKolkata = 'TZ_ASIA_KOLKATA',
  /** Asia/Krasnoyarsk */
  TzAsiaKrasnoyarsk = 'TZ_ASIA_KRASNOYARSK',
  /** Asia/Kuala_Lumpur */
  TzAsiaKualaLumpur = 'TZ_ASIA_KUALA_LUMPUR',
  /** Asia/Kuwait */
  TzAsiaKuwait = 'TZ_ASIA_KUWAIT',
  /** Asia/Magadan */
  TzAsiaMagadan = 'TZ_ASIA_MAGADAN',
  /** Asia/Muscat */
  TzAsiaMuscat = 'TZ_ASIA_MUSCAT',
  /** Asia/Novosibirsk */
  TzAsiaNovosibirsk = 'TZ_ASIA_NOVOSIBIRSK',
  /** Asia/Rangoon */
  TzAsiaRangoon = 'TZ_ASIA_RANGOON',
  /** Asia/Riyadh */
  TzAsiaRiyadh = 'TZ_ASIA_RIYADH',
  /** Asia/Seoul */
  TzAsiaSeoul = 'TZ_ASIA_SEOUL',
  /** Asia/Shanghai */
  TzAsiaShanghai = 'TZ_ASIA_SHANGHAI',
  /** Asia/Singapore */
  TzAsiaSingapore = 'TZ_ASIA_SINGAPORE',
  /** Asia/Srednekolymsk */
  TzAsiaSrednekolymsk = 'TZ_ASIA_SREDNEKOLYMSK',
  /** Asia/Taipei */
  TzAsiaTaipei = 'TZ_ASIA_TAIPEI',
  /** Asia/Tashkent */
  TzAsiaTashkent = 'TZ_ASIA_TASHKENT',
  /** Asia/Tbilisi */
  TzAsiaTbilisi = 'TZ_ASIA_TBILISI',
  /** Asia/Tehran */
  TzAsiaTehran = 'TZ_ASIA_TEHRAN',
  /** Asia/Tokyo */
  TzAsiaTokyo = 'TZ_ASIA_TOKYO',
  /** Asia/Ulaanbaatar */
  TzAsiaUlaanbaatar = 'TZ_ASIA_ULAANBAATAR',
  /** Asia/Urumqi */
  TzAsiaUrumqi = 'TZ_ASIA_URUMQI',
  /** Asia/Vladivostok */
  TzAsiaVladivostok = 'TZ_ASIA_VLADIVOSTOK',
  /** Asia/Yakutsk */
  TzAsiaYakutsk = 'TZ_ASIA_YAKUTSK',
  /** Asia/Yekaterinburg */
  TzAsiaYekaterinburg = 'TZ_ASIA_YEKATERINBURG',
  /** Asia/Yerevan */
  TzAsiaYerevan = 'TZ_ASIA_YEREVAN',
  /** Atlantic/Azores */
  TzAtlanticAzores = 'TZ_ATLANTIC_AZORES',
  /** Atlantic/Cape_Verde */
  TzAtlanticCapeVerde = 'TZ_ATLANTIC_CAPE_VERDE',
  /** Atlantic/South_Georgia */
  TzAtlanticSouthGeorgia = 'TZ_ATLANTIC_SOUTH_GEORGIA',
  /** Australia/Adelaide */
  TzAustraliaAdelaide = 'TZ_AUSTRALIA_ADELAIDE',
  /** Australia/Brisbane */
  TzAustraliaBrisbane = 'TZ_AUSTRALIA_BRISBANE',
  /** Australia/Canberra */
  TzAustraliaCanberra = 'TZ_AUSTRALIA_CANBERRA',
  /** Australia/Darwin */
  TzAustraliaDarwin = 'TZ_AUSTRALIA_DARWIN',
  /** Australia/Hobart */
  TzAustraliaHobart = 'TZ_AUSTRALIA_HOBART',
  /** Australia/Melbourne */
  TzAustraliaMelbourne = 'TZ_AUSTRALIA_MELBOURNE',
  /** Australia/Perth */
  TzAustraliaPerth = 'TZ_AUSTRALIA_PERTH',
  /** Australia/Sydney */
  TzAustraliaSydney = 'TZ_AUSTRALIA_SYDNEY',
  /** Etc/GMT+12 */
  TzEtcGmt_12 = 'TZ_ETC_GMT_12',
  /** Europe/Amsterdam */
  TzEuropeAmsterdam = 'TZ_EUROPE_AMSTERDAM',
  /** Europe/Athens */
  TzEuropeAthens = 'TZ_EUROPE_ATHENS',
  /** Europe/Belgrade */
  TzEuropeBelgrade = 'TZ_EUROPE_BELGRADE',
  /** Europe/Berlin */
  TzEuropeBerlin = 'TZ_EUROPE_BERLIN',
  /** Europe/Bratislava */
  TzEuropeBratislava = 'TZ_EUROPE_BRATISLAVA',
  /** Europe/Brussels */
  TzEuropeBrussels = 'TZ_EUROPE_BRUSSELS',
  /** Europe/Bucharest */
  TzEuropeBucharest = 'TZ_EUROPE_BUCHAREST',
  /** Europe/Budapest */
  TzEuropeBudapest = 'TZ_EUROPE_BUDAPEST',
  /** Europe/Copenhagen */
  TzEuropeCopenhagen = 'TZ_EUROPE_COPENHAGEN',
  /** Europe/Dublin */
  TzEuropeDublin = 'TZ_EUROPE_DUBLIN',
  /** Europe/Helsinki */
  TzEuropeHelsinki = 'TZ_EUROPE_HELSINKI',
  /** Europe/Istanbul */
  TzEuropeIstanbul = 'TZ_EUROPE_ISTANBUL',
  /** Europe/Kaliningrad */
  TzEuropeKaliningrad = 'TZ_EUROPE_KALININGRAD',
  /** Europe/Kiev */
  TzEuropeKiev = 'TZ_EUROPE_KIEV',
  /** Europe/Lisbon */
  TzEuropeLisbon = 'TZ_EUROPE_LISBON',
  /** Europe/Ljubljana */
  TzEuropeLjubljana = 'TZ_EUROPE_LJUBLJANA',
  /** Europe/London */
  TzEuropeLondon = 'TZ_EUROPE_LONDON',
  /** Europe/Madrid */
  TzEuropeMadrid = 'TZ_EUROPE_MADRID',
  /** Europe/Minsk */
  TzEuropeMinsk = 'TZ_EUROPE_MINSK',
  /** Europe/Moscow */
  TzEuropeMoscow = 'TZ_EUROPE_MOSCOW',
  /** Europe/Paris */
  TzEuropeParis = 'TZ_EUROPE_PARIS',
  /** Europe/Prague */
  TzEuropePrague = 'TZ_EUROPE_PRAGUE',
  /** Europe/Riga */
  TzEuropeRiga = 'TZ_EUROPE_RIGA',
  /** Europe/Rome */
  TzEuropeRome = 'TZ_EUROPE_ROME',
  /** Europe/Samara */
  TzEuropeSamara = 'TZ_EUROPE_SAMARA',
  /** Europe/Sarajevo */
  TzEuropeSarajevo = 'TZ_EUROPE_SARAJEVO',
  /** Europe/Skopje */
  TzEuropeSkopje = 'TZ_EUROPE_SKOPJE',
  /** Europe/Sofia */
  TzEuropeSofia = 'TZ_EUROPE_SOFIA',
  /** Europe/Stockholm */
  TzEuropeStockholm = 'TZ_EUROPE_STOCKHOLM',
  /** Europe/Tallinn */
  TzEuropeTallinn = 'TZ_EUROPE_TALLINN',
  /** Europe/Vienna */
  TzEuropeVienna = 'TZ_EUROPE_VIENNA',
  /** Europe/Vilnius */
  TzEuropeVilnius = 'TZ_EUROPE_VILNIUS',
  /** Europe/Volgograd */
  TzEuropeVolgograd = 'TZ_EUROPE_VOLGOGRAD',
  /** Europe/Warsaw */
  TzEuropeWarsaw = 'TZ_EUROPE_WARSAW',
  /** Europe/Zagreb */
  TzEuropeZagreb = 'TZ_EUROPE_ZAGREB',
  /** Europe/Zurich */
  TzEuropeZurich = 'TZ_EUROPE_ZURICH',
  /** Pacific/Apia */
  TzPacificApia = 'TZ_PACIFIC_APIA',
  /** Pacific/Auckland */
  TzPacificAuckland = 'TZ_PACIFIC_AUCKLAND',
  /** Pacific/Chatham */
  TzPacificChatham = 'TZ_PACIFIC_CHATHAM',
  /** Pacific/Fakaofo */
  TzPacificFakaofo = 'TZ_PACIFIC_FAKAOFO',
  /** Pacific/Fiji */
  TzPacificFiji = 'TZ_PACIFIC_FIJI',
  /** Pacific/Guadalcanal */
  TzPacificGuadalcanal = 'TZ_PACIFIC_GUADALCANAL',
  /** Pacific/Guam */
  TzPacificGuam = 'TZ_PACIFIC_GUAM',
  /** Pacific/Honolulu */
  TzPacificHonolulu = 'TZ_PACIFIC_HONOLULU',
  /** Pacific/Majuro */
  TzPacificMajuro = 'TZ_PACIFIC_MAJURO',
  /** Pacific/Midway */
  TzPacificMidway = 'TZ_PACIFIC_MIDWAY',
  /** Pacific/Noumea */
  TzPacificNoumea = 'TZ_PACIFIC_NOUMEA',
  /** Pacific/Pago_Pago */
  TzPacificPagoPago = 'TZ_PACIFIC_PAGO_PAGO',
  /** Pacific/Port_Moresby */
  TzPacificPortMoresby = 'TZ_PACIFIC_PORT_MORESBY',
  /** Pacific/Tongatapu */
  TzPacificTongatapu = 'TZ_PACIFIC_TONGATAPU',
  /** UTC */
  TzUtc = 'TZ_UTC'
}

export type UsageThreshold = {
  __typename?: 'UsageThreshold';
  amountCents: Scalars['BigInt']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  id: Scalars['ID']['output'];
  recurring: Scalars['Boolean']['output'];
  thresholdDisplayName?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export type VolumeRange = {
  __typename?: 'VolumeRange';
  flatAmount: Scalars['String']['output'];
  fromValue: Scalars['BigInt']['output'];
  perUnitAmount: Scalars['String']['output'];
  toValue?: Maybe<Scalars['BigInt']['output']>;
};

export enum WeightedIntervalEnum {
  Seconds = 'seconds'
}

export type XeroCustomer = {
  __typename?: 'XeroCustomer';
  externalCustomerId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  integrationCode?: Maybe<Scalars['String']['output']>;
  integrationId?: Maybe<Scalars['ID']['output']>;
  integrationType?: Maybe<IntegrationTypeEnum>;
  syncWithProvider?: Maybe<Scalars['Boolean']['output']>;
};

export type GetPortalCustomerInfosQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPortalCustomerInfosQuery = { __typename?: 'Query', customerPortalUser?: { __typename?: 'Customer', id: string, name?: string | null, legalName?: string | null, legalNumber?: string | null, taxIdentificationNumber?: string | null, email?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null } | null };

export type PortalInvoiceListItemFragment = { __typename?: 'Invoice', id: string, paymentStatus: InvoicePaymentStatusTypeEnum, paymentOverdue: boolean, paymentDisputeLostAt?: any | null, number: string, issuingDate: any, totalAmountCents: any, currency?: CurrencyEnum | null };

export type CustomerPortalInvoicesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<InvoiceStatusTypeEnum> | InvoiceStatusTypeEnum>;
}>;


export type CustomerPortalInvoicesQuery = { __typename?: 'Query', customerPortalInvoices: { __typename?: 'InvoiceCollection', metadata: { __typename?: 'CollectionMetadata', currentPage: number, totalPages: number, totalCount: number }, collection: Array<{ __typename?: 'Invoice', id: string, paymentStatus: InvoicePaymentStatusTypeEnum, paymentOverdue: boolean, paymentDisputeLostAt?: any | null, number: string, issuingDate: any, totalAmountCents: any, currency?: CurrencyEnum | null }> } };

export type DownloadCustomerPortalInvoiceMutationVariables = Exact<{
  input: DownloadCustomerPortalInvoiceInput;
}>;


export type DownloadCustomerPortalInvoiceMutation = { __typename?: 'Mutation', downloadCustomerPortalInvoice?: { __typename?: 'Invoice', id: string, fileUrl?: string | null } | null };

export type GetCustomerPortalInvoicesCollectionQueryVariables = Exact<{
  expireCache?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetCustomerPortalInvoicesCollectionQuery = { __typename?: 'Query', customerPortalInvoiceCollections: { __typename?: 'FinalizedInvoiceCollectionCollection', collection: Array<{ __typename?: 'FinalizedInvoiceCollection', amountCents: any, invoicesCount: any, currency?: CurrencyEnum | null }> } };

export type GetCustomerPortalOverdueBalancesQueryVariables = Exact<{
  expireCache?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetCustomerPortalOverdueBalancesQuery = { __typename?: 'Query', customerPortalOverdueBalances: { __typename?: 'OverdueBalanceCollection', collection: Array<{ __typename?: 'OverdueBalance', amountCents: any, currency: CurrencyEnum, lagoInvoiceIds: Array<string> }> } };

export type GetCustomerPortalUserCurrencyQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCustomerPortalUserCurrencyQuery = { __typename?: 'Query', customerPortalUser?: { __typename?: 'Customer', currency?: CurrencyEnum | null } | null };

export type GetPortalLocaleQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPortalLocaleQuery = { __typename?: 'Query', customerPortalOrganization?: { __typename?: 'Organization', id: string, billingConfiguration?: { __typename?: 'OrganizationBillingConfiguration', id: string, documentLocale?: string | null } | null } | null, customerPortalUser?: { __typename?: 'Customer', id: string, billingConfiguration?: { __typename?: 'CustomerBillingConfiguration', id: string, documentLocale?: string | null } | null } | null };

export type GetPortalOrgaInfosQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPortalOrgaInfosQuery = { __typename?: 'Query', customerPortalOrganization?: { __typename?: 'Organization', id: string, name: string, logoUrl?: string | null } | null };

export const PortalInvoiceListItemFragmentDoc = gql`
    fragment PortalInvoiceListItem on Invoice {
  id
  paymentStatus
  paymentOverdue
  paymentDisputeLostAt
  number
  issuingDate
  totalAmountCents
  currency
}
    `;
export const GetPortalCustomerInfosDocument = gql`
    query getPortalCustomerInfos {
  customerPortalUser {
    id
    name
    legalName
    legalNumber
    taxIdentificationNumber
    email
    addressLine1
    addressLine2
    state
    country
    city
    zipcode
  }
}
    `;

/**
 * __useGetPortalCustomerInfosQuery__
 *
 * To run a query within a React component, call `useGetPortalCustomerInfosQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPortalCustomerInfosQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPortalCustomerInfosQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPortalCustomerInfosQuery(baseOptions?: Apollo.QueryHookOptions<GetPortalCustomerInfosQuery, GetPortalCustomerInfosQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPortalCustomerInfosQuery, GetPortalCustomerInfosQueryVariables>(GetPortalCustomerInfosDocument, options);
      }
export function useGetPortalCustomerInfosLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPortalCustomerInfosQuery, GetPortalCustomerInfosQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPortalCustomerInfosQuery, GetPortalCustomerInfosQueryVariables>(GetPortalCustomerInfosDocument, options);
        }
export function useGetPortalCustomerInfosSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPortalCustomerInfosQuery, GetPortalCustomerInfosQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPortalCustomerInfosQuery, GetPortalCustomerInfosQueryVariables>(GetPortalCustomerInfosDocument, options);
        }
export type GetPortalCustomerInfosQueryHookResult = ReturnType<typeof useGetPortalCustomerInfosQuery>;
export type GetPortalCustomerInfosLazyQueryHookResult = ReturnType<typeof useGetPortalCustomerInfosLazyQuery>;
export type GetPortalCustomerInfosSuspenseQueryHookResult = ReturnType<typeof useGetPortalCustomerInfosSuspenseQuery>;
export type GetPortalCustomerInfosQueryResult = Apollo.QueryResult<GetPortalCustomerInfosQuery, GetPortalCustomerInfosQueryVariables>;
export const CustomerPortalInvoicesDocument = gql`
    query customerPortalInvoices($limit: Int, $page: Int, $searchTerm: String, $status: [InvoiceStatusTypeEnum!]) {
  customerPortalInvoices(
    limit: $limit
    page: $page
    searchTerm: $searchTerm
    status: $status
  ) {
    metadata {
      currentPage
      totalPages
      totalCount
    }
    collection {
      id
      ...PortalInvoiceListItem
    }
  }
}
    ${PortalInvoiceListItemFragmentDoc}`;

/**
 * __useCustomerPortalInvoicesQuery__
 *
 * To run a query within a React component, call `useCustomerPortalInvoicesQuery` and pass it any options that fit your needs.
 * When your component renders, `useCustomerPortalInvoicesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCustomerPortalInvoicesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      page: // value for 'page'
 *      searchTerm: // value for 'searchTerm'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useCustomerPortalInvoicesQuery(baseOptions?: Apollo.QueryHookOptions<CustomerPortalInvoicesQuery, CustomerPortalInvoicesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CustomerPortalInvoicesQuery, CustomerPortalInvoicesQueryVariables>(CustomerPortalInvoicesDocument, options);
      }
export function useCustomerPortalInvoicesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CustomerPortalInvoicesQuery, CustomerPortalInvoicesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CustomerPortalInvoicesQuery, CustomerPortalInvoicesQueryVariables>(CustomerPortalInvoicesDocument, options);
        }
export function useCustomerPortalInvoicesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CustomerPortalInvoicesQuery, CustomerPortalInvoicesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CustomerPortalInvoicesQuery, CustomerPortalInvoicesQueryVariables>(CustomerPortalInvoicesDocument, options);
        }
export type CustomerPortalInvoicesQueryHookResult = ReturnType<typeof useCustomerPortalInvoicesQuery>;
export type CustomerPortalInvoicesLazyQueryHookResult = ReturnType<typeof useCustomerPortalInvoicesLazyQuery>;
export type CustomerPortalInvoicesSuspenseQueryHookResult = ReturnType<typeof useCustomerPortalInvoicesSuspenseQuery>;
export type CustomerPortalInvoicesQueryResult = Apollo.QueryResult<CustomerPortalInvoicesQuery, CustomerPortalInvoicesQueryVariables>;
export const DownloadCustomerPortalInvoiceDocument = gql`
    mutation downloadCustomerPortalInvoice($input: DownloadCustomerPortalInvoiceInput!) {
  downloadCustomerPortalInvoice(input: $input) {
    id
    fileUrl
  }
}
    `;
export type DownloadCustomerPortalInvoiceMutationFn = Apollo.MutationFunction<DownloadCustomerPortalInvoiceMutation, DownloadCustomerPortalInvoiceMutationVariables>;

/**
 * __useDownloadCustomerPortalInvoiceMutation__
 *
 * To run a mutation, you first call `useDownloadCustomerPortalInvoiceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDownloadCustomerPortalInvoiceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [downloadCustomerPortalInvoiceMutation, { data, loading, error }] = useDownloadCustomerPortalInvoiceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDownloadCustomerPortalInvoiceMutation(baseOptions?: Apollo.MutationHookOptions<DownloadCustomerPortalInvoiceMutation, DownloadCustomerPortalInvoiceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DownloadCustomerPortalInvoiceMutation, DownloadCustomerPortalInvoiceMutationVariables>(DownloadCustomerPortalInvoiceDocument, options);
      }
export type DownloadCustomerPortalInvoiceMutationHookResult = ReturnType<typeof useDownloadCustomerPortalInvoiceMutation>;
export type DownloadCustomerPortalInvoiceMutationResult = Apollo.MutationResult<DownloadCustomerPortalInvoiceMutation>;
export type DownloadCustomerPortalInvoiceMutationOptions = Apollo.BaseMutationOptions<DownloadCustomerPortalInvoiceMutation, DownloadCustomerPortalInvoiceMutationVariables>;
export const GetCustomerPortalInvoicesCollectionDocument = gql`
    query getCustomerPortalInvoicesCollection($expireCache: Boolean) {
  customerPortalInvoiceCollections(expireCache: $expireCache) {
    collection {
      amountCents
      invoicesCount
      currency
    }
  }
}
    `;

/**
 * __useGetCustomerPortalInvoicesCollectionQuery__
 *
 * To run a query within a React component, call `useGetCustomerPortalInvoicesCollectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCustomerPortalInvoicesCollectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCustomerPortalInvoicesCollectionQuery({
 *   variables: {
 *      expireCache: // value for 'expireCache'
 *   },
 * });
 */
export function useGetCustomerPortalInvoicesCollectionQuery(baseOptions?: Apollo.QueryHookOptions<GetCustomerPortalInvoicesCollectionQuery, GetCustomerPortalInvoicesCollectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCustomerPortalInvoicesCollectionQuery, GetCustomerPortalInvoicesCollectionQueryVariables>(GetCustomerPortalInvoicesCollectionDocument, options);
      }
export function useGetCustomerPortalInvoicesCollectionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCustomerPortalInvoicesCollectionQuery, GetCustomerPortalInvoicesCollectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCustomerPortalInvoicesCollectionQuery, GetCustomerPortalInvoicesCollectionQueryVariables>(GetCustomerPortalInvoicesCollectionDocument, options);
        }
export function useGetCustomerPortalInvoicesCollectionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCustomerPortalInvoicesCollectionQuery, GetCustomerPortalInvoicesCollectionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCustomerPortalInvoicesCollectionQuery, GetCustomerPortalInvoicesCollectionQueryVariables>(GetCustomerPortalInvoicesCollectionDocument, options);
        }
export type GetCustomerPortalInvoicesCollectionQueryHookResult = ReturnType<typeof useGetCustomerPortalInvoicesCollectionQuery>;
export type GetCustomerPortalInvoicesCollectionLazyQueryHookResult = ReturnType<typeof useGetCustomerPortalInvoicesCollectionLazyQuery>;
export type GetCustomerPortalInvoicesCollectionSuspenseQueryHookResult = ReturnType<typeof useGetCustomerPortalInvoicesCollectionSuspenseQuery>;
export type GetCustomerPortalInvoicesCollectionQueryResult = Apollo.QueryResult<GetCustomerPortalInvoicesCollectionQuery, GetCustomerPortalInvoicesCollectionQueryVariables>;
export const GetCustomerPortalOverdueBalancesDocument = gql`
    query getCustomerPortalOverdueBalances($expireCache: Boolean) {
  customerPortalOverdueBalances(expireCache: $expireCache) {
    collection {
      amountCents
      currency
      lagoInvoiceIds
    }
  }
}
    `;

/**
 * __useGetCustomerPortalOverdueBalancesQuery__
 *
 * To run a query within a React component, call `useGetCustomerPortalOverdueBalancesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCustomerPortalOverdueBalancesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCustomerPortalOverdueBalancesQuery({
 *   variables: {
 *      expireCache: // value for 'expireCache'
 *   },
 * });
 */
export function useGetCustomerPortalOverdueBalancesQuery(baseOptions?: Apollo.QueryHookOptions<GetCustomerPortalOverdueBalancesQuery, GetCustomerPortalOverdueBalancesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCustomerPortalOverdueBalancesQuery, GetCustomerPortalOverdueBalancesQueryVariables>(GetCustomerPortalOverdueBalancesDocument, options);
      }
export function useGetCustomerPortalOverdueBalancesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCustomerPortalOverdueBalancesQuery, GetCustomerPortalOverdueBalancesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCustomerPortalOverdueBalancesQuery, GetCustomerPortalOverdueBalancesQueryVariables>(GetCustomerPortalOverdueBalancesDocument, options);
        }
export function useGetCustomerPortalOverdueBalancesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCustomerPortalOverdueBalancesQuery, GetCustomerPortalOverdueBalancesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCustomerPortalOverdueBalancesQuery, GetCustomerPortalOverdueBalancesQueryVariables>(GetCustomerPortalOverdueBalancesDocument, options);
        }
export type GetCustomerPortalOverdueBalancesQueryHookResult = ReturnType<typeof useGetCustomerPortalOverdueBalancesQuery>;
export type GetCustomerPortalOverdueBalancesLazyQueryHookResult = ReturnType<typeof useGetCustomerPortalOverdueBalancesLazyQuery>;
export type GetCustomerPortalOverdueBalancesSuspenseQueryHookResult = ReturnType<typeof useGetCustomerPortalOverdueBalancesSuspenseQuery>;
export type GetCustomerPortalOverdueBalancesQueryResult = Apollo.QueryResult<GetCustomerPortalOverdueBalancesQuery, GetCustomerPortalOverdueBalancesQueryVariables>;
export const GetCustomerPortalUserCurrencyDocument = gql`
    query getCustomerPortalUserCurrency {
  customerPortalUser {
    currency
  }
}
    `;

/**
 * __useGetCustomerPortalUserCurrencyQuery__
 *
 * To run a query within a React component, call `useGetCustomerPortalUserCurrencyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCustomerPortalUserCurrencyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCustomerPortalUserCurrencyQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCustomerPortalUserCurrencyQuery(baseOptions?: Apollo.QueryHookOptions<GetCustomerPortalUserCurrencyQuery, GetCustomerPortalUserCurrencyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCustomerPortalUserCurrencyQuery, GetCustomerPortalUserCurrencyQueryVariables>(GetCustomerPortalUserCurrencyDocument, options);
      }
export function useGetCustomerPortalUserCurrencyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCustomerPortalUserCurrencyQuery, GetCustomerPortalUserCurrencyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCustomerPortalUserCurrencyQuery, GetCustomerPortalUserCurrencyQueryVariables>(GetCustomerPortalUserCurrencyDocument, options);
        }
export function useGetCustomerPortalUserCurrencySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCustomerPortalUserCurrencyQuery, GetCustomerPortalUserCurrencyQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCustomerPortalUserCurrencyQuery, GetCustomerPortalUserCurrencyQueryVariables>(GetCustomerPortalUserCurrencyDocument, options);
        }
export type GetCustomerPortalUserCurrencyQueryHookResult = ReturnType<typeof useGetCustomerPortalUserCurrencyQuery>;
export type GetCustomerPortalUserCurrencyLazyQueryHookResult = ReturnType<typeof useGetCustomerPortalUserCurrencyLazyQuery>;
export type GetCustomerPortalUserCurrencySuspenseQueryHookResult = ReturnType<typeof useGetCustomerPortalUserCurrencySuspenseQuery>;
export type GetCustomerPortalUserCurrencyQueryResult = Apollo.QueryResult<GetCustomerPortalUserCurrencyQuery, GetCustomerPortalUserCurrencyQueryVariables>;
export const GetPortalLocaleDocument = gql`
    query getPortalLocale {
  customerPortalOrganization {
    id
    billingConfiguration {
      id
      documentLocale
    }
  }
  customerPortalUser {
    id
    billingConfiguration {
      id
      documentLocale
    }
  }
}
    `;

/**
 * __useGetPortalLocaleQuery__
 *
 * To run a query within a React component, call `useGetPortalLocaleQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPortalLocaleQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPortalLocaleQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPortalLocaleQuery(baseOptions?: Apollo.QueryHookOptions<GetPortalLocaleQuery, GetPortalLocaleQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPortalLocaleQuery, GetPortalLocaleQueryVariables>(GetPortalLocaleDocument, options);
      }
export function useGetPortalLocaleLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPortalLocaleQuery, GetPortalLocaleQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPortalLocaleQuery, GetPortalLocaleQueryVariables>(GetPortalLocaleDocument, options);
        }
export function useGetPortalLocaleSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPortalLocaleQuery, GetPortalLocaleQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPortalLocaleQuery, GetPortalLocaleQueryVariables>(GetPortalLocaleDocument, options);
        }
export type GetPortalLocaleQueryHookResult = ReturnType<typeof useGetPortalLocaleQuery>;
export type GetPortalLocaleLazyQueryHookResult = ReturnType<typeof useGetPortalLocaleLazyQuery>;
export type GetPortalLocaleSuspenseQueryHookResult = ReturnType<typeof useGetPortalLocaleSuspenseQuery>;
export type GetPortalLocaleQueryResult = Apollo.QueryResult<GetPortalLocaleQuery, GetPortalLocaleQueryVariables>;
export const GetPortalOrgaInfosDocument = gql`
    query getPortalOrgaInfos {
  customerPortalOrganization {
    id
    name
    logoUrl
  }
}
    `;

/**
 * __useGetPortalOrgaInfosQuery__
 *
 * To run a query within a React component, call `useGetPortalOrgaInfosQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPortalOrgaInfosQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPortalOrgaInfosQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPortalOrgaInfosQuery(baseOptions?: Apollo.QueryHookOptions<GetPortalOrgaInfosQuery, GetPortalOrgaInfosQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPortalOrgaInfosQuery, GetPortalOrgaInfosQueryVariables>(GetPortalOrgaInfosDocument, options);
      }
export function useGetPortalOrgaInfosLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPortalOrgaInfosQuery, GetPortalOrgaInfosQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPortalOrgaInfosQuery, GetPortalOrgaInfosQueryVariables>(GetPortalOrgaInfosDocument, options);
        }
export function useGetPortalOrgaInfosSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPortalOrgaInfosQuery, GetPortalOrgaInfosQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPortalOrgaInfosQuery, GetPortalOrgaInfosQueryVariables>(GetPortalOrgaInfosDocument, options);
        }
export type GetPortalOrgaInfosQueryHookResult = ReturnType<typeof useGetPortalOrgaInfosQuery>;
export type GetPortalOrgaInfosLazyQueryHookResult = ReturnType<typeof useGetPortalOrgaInfosLazyQuery>;
export type GetPortalOrgaInfosSuspenseQueryHookResult = ReturnType<typeof useGetPortalOrgaInfosSuspenseQuery>;
export type GetPortalOrgaInfosQueryResult = Apollo.QueryResult<GetPortalOrgaInfosQuery, GetPortalOrgaInfosQueryVariables>;