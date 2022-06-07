import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** An ISO 8601-encoded date */
  ISO8601Date: any;
  /** An ISO 8601-encoded datetime */
  ISO8601DateTime: any;
  /** Represents untyped JSON */
  JSON: any;
};

export type AddOn = {
  __typename?: 'AddOn';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** Check if add-on is deletable */
  canBeDeleted: Scalars['Boolean'];
  code: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  /** Number of customers using this add-on */
  customerCount: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export type AddOnCollection = {
  __typename?: 'AddOnCollection';
  collection: Array<AddOn>;
  metadata: CollectionMetadata;
};

export type AddOnDetails = {
  __typename?: 'AddOnDetails';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** Check if add-on is deletable */
  canBeDeleted: Scalars['Boolean'];
  code: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  /** Number of customers using this add-on */
  customerCount: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export enum AggregationTypeEnum {
  CountAgg = 'count_agg',
  MaxAgg = 'max_agg',
  SumAgg = 'sum_agg',
  UniqueCountAgg = 'unique_count_agg'
}

export type AppliedAddOn = {
  __typename?: 'AppliedAddOn';
  addOn: AddOn;
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  createdAt: Scalars['ISO8601DateTime'];
  id: Scalars['ID'];
};

export type AppliedCoupon = {
  __typename?: 'AppliedCoupon';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  coupon: Coupon;
  createdAt: Scalars['ISO8601DateTime'];
  id: Scalars['ID'];
  terminatedAt: Scalars['ISO8601DateTime'];
};

export type BillableMetric = {
  __typename?: 'BillableMetric';
  aggregationType: AggregationTypeEnum;
  /** Check if billable metric is deletable */
  canBeDeleted: Scalars['Boolean'];
  code: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  description?: Maybe<Scalars['String']>;
  fieldName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export type BillableMetricCollection = {
  __typename?: 'BillableMetricCollection';
  collection: Array<BillableMetric>;
  metadata: CollectionMetadata;
};

export type BillableMetricDetail = {
  __typename?: 'BillableMetricDetail';
  aggregationType: AggregationTypeEnum;
  /** Check if billable metric is deletable */
  canBeDeleted: Scalars['Boolean'];
  code: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  description?: Maybe<Scalars['String']>;
  fieldName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export type Charge = {
  __typename?: 'Charge';
  amount?: Maybe<Scalars['String']>;
  amountCurrency?: Maybe<CurrencyEnum>;
  billableMetric: BillableMetric;
  chargeModel: ChargeModelEnum;
  createdAt: Scalars['ISO8601DateTime'];
  freeUnits?: Maybe<Scalars['Int']>;
  graduatedRanges?: Maybe<Array<GraduatedRange>>;
  id: Scalars['ID'];
  packageSize?: Maybe<Scalars['Int']>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export type ChargeInput = {
  amount?: InputMaybe<Scalars['String']>;
  amountCurrency: CurrencyEnum;
  billableMetricId: Scalars['ID'];
  chargeModel: ChargeModelEnum;
  freeUnits?: InputMaybe<Scalars['Int']>;
  graduatedRanges?: InputMaybe<Array<GraduatedRangeInput>>;
  id?: InputMaybe<Scalars['ID']>;
  packageSize?: InputMaybe<Scalars['Int']>;
};

export enum ChargeModelEnum {
  Graduated = 'graduated',
  Package = 'package',
  Standard = 'standard'
}

export type CollectionMetadata = {
  __typename?: 'CollectionMetadata';
  currentPage: Scalars['Int'];
  limitValue: Scalars['Int'];
  totalCount: Scalars['Int'];
  totalPages: Scalars['Int'];
};

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
  /** Turkey */
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
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** Check if coupon is deletable */
  canBeDeleted: Scalars['Boolean'];
  code?: Maybe<Scalars['String']>;
  createdAt: Scalars['ISO8601DateTime'];
  /** Number of customers using this coupon */
  customerCount: Scalars['Int'];
  expiration: CouponExpiration;
  expirationDate?: Maybe<Scalars['ISO8601Date']>;
  expirationDuration?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  status: CouponStatusEnum;
  terminatedAt?: Maybe<Scalars['ISO8601DateTime']>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export type CouponCollection = {
  __typename?: 'CouponCollection';
  collection: Array<Coupon>;
  metadata: CollectionMetadata;
};

export type CouponDetails = {
  __typename?: 'CouponDetails';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** Check if coupon is deletable */
  canBeDeleted: Scalars['Boolean'];
  code?: Maybe<Scalars['String']>;
  createdAt: Scalars['ISO8601DateTime'];
  /** Number of customers using this coupon */
  customerCount: Scalars['Int'];
  expiration: CouponExpiration;
  expirationDate?: Maybe<Scalars['ISO8601Date']>;
  expirationDuration?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  status: CouponStatusEnum;
  terminatedAt?: Maybe<Scalars['ISO8601DateTime']>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export enum CouponExpiration {
  NoExpiration = 'no_expiration',
  TimeLimit = 'time_limit'
}

export enum CouponStatusEnum {
  Active = 'active',
  Terminated = 'terminated'
}

/** Autogenerated input type of CreateAddOn */
export type CreateAddOnInput = {
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
};

/** Autogenerated input type of CreateAppliedAddOn */
export type CreateAppliedAddOnInput = {
  addOnId: Scalars['ID'];
  amountCents?: InputMaybe<Scalars['Int']>;
  amountCurrency?: InputMaybe<CurrencyEnum>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  customerId: Scalars['ID'];
};

/** Autogenerated input type of CreateAppliedCoupon */
export type CreateAppliedCouponInput = {
  amountCents?: InputMaybe<Scalars['Int']>;
  amountCurrency?: InputMaybe<CurrencyEnum>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  couponId: Scalars['ID'];
  customerId: Scalars['ID'];
};

/** Autogenerated input type of CreateBillableMetric */
export type CreateBillableMetricInput = {
  aggregationType: AggregationTypeEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description: Scalars['String'];
  fieldName?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
};

/** Autogenerated input type of CreateCoupon */
export type CreateCouponInput = {
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code?: InputMaybe<Scalars['String']>;
  expiration: CouponExpiration;
  expirationDuration?: InputMaybe<Scalars['Int']>;
  name: Scalars['String'];
};

/** Autogenerated input type of CreateCustomer */
export type CreateCustomerInput = {
  addressLine1?: InputMaybe<Scalars['String']>;
  addressLine2?: InputMaybe<Scalars['String']>;
  city?: InputMaybe<Scalars['String']>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  country?: InputMaybe<CountryCode>;
  customerId: Scalars['String'];
  email?: InputMaybe<Scalars['String']>;
  legalName?: InputMaybe<Scalars['String']>;
  legalNumber?: InputMaybe<Scalars['String']>;
  logoUrl?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  phone?: InputMaybe<Scalars['String']>;
  state?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
  vatRate?: InputMaybe<Scalars['Float']>;
  zipcode?: InputMaybe<Scalars['String']>;
};

/** Autogenerated input type of CreatePlan */
export type CreatePlanInput = {
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  charges: Array<ChargeInput>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  interval: PlanInterval;
  name: Scalars['String'];
  payInAdvance: Scalars['Boolean'];
  trialPeriod?: InputMaybe<Scalars['Float']>;
};

/** Autogenerated input type of CreateSubscription */
export type CreateSubscriptionInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  customerId: Scalars['ID'];
  planId: Scalars['ID'];
};

export enum CurrencyEnum {
  /** Danish Krone */
  Dkk = 'DKK',
  /** Euro */
  Eur = 'EUR',
  /** Pound Sterling */
  Gbp = 'GBP',
  /** Norwegian Krone */
  Nok = 'NOK',
  /** Swedish Krona */
  Sek = 'SEK',
  /** American Dollar */
  Usd = 'USD'
}

export type Customer = {
  __typename?: 'Customer';
  addressLine1?: Maybe<Scalars['String']>;
  addressLine2?: Maybe<Scalars['String']>;
  /** Check if customer is deletable */
  canBeDeleted: Scalars['Boolean'];
  city?: Maybe<Scalars['String']>;
  country?: Maybe<CountryCode>;
  createdAt: Scalars['ISO8601DateTime'];
  customerId: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  legalName?: Maybe<Scalars['String']>;
  legalNumber?: Maybe<Scalars['String']>;
  logoUrl?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
  subscriptions?: Maybe<Array<Subscription>>;
  updatedAt: Scalars['ISO8601DateTime'];
  url?: Maybe<Scalars['String']>;
  vatRate?: Maybe<Scalars['Float']>;
  zipcode?: Maybe<Scalars['String']>;
};

export type CustomerCollection = {
  __typename?: 'CustomerCollection';
  collection: Array<Customer>;
  metadata: CollectionMetadata;
};

export type CustomerDetails = {
  __typename?: 'CustomerDetails';
  addressLine1?: Maybe<Scalars['String']>;
  addressLine2?: Maybe<Scalars['String']>;
  appliedAddOns?: Maybe<Array<AppliedAddOn>>;
  appliedCoupons?: Maybe<Array<AppliedCoupon>>;
  /** Check if customer is deletable */
  canBeDeleted: Scalars['Boolean'];
  city?: Maybe<Scalars['String']>;
  country?: Maybe<CountryCode>;
  createdAt: Scalars['ISO8601DateTime'];
  customerId: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  invoices?: Maybe<Array<Invoice>>;
  legalName?: Maybe<Scalars['String']>;
  legalNumber?: Maybe<Scalars['String']>;
  logoUrl?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
  /** Query subscriptions of a customer */
  subscriptions: Array<Subscription>;
  updatedAt: Scalars['ISO8601DateTime'];
  url?: Maybe<Scalars['String']>;
  vatRate?: Maybe<Scalars['Float']>;
  zipcode?: Maybe<Scalars['String']>;
};


export type CustomerDetailsSubscriptionsArgs = {
  status?: InputMaybe<Array<StatusTypeEnum>>;
};

/** Autogenerated input type of DestroyAddOn */
export type DestroyAddOnInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
};

/** Autogenerated return type of DestroyAddOn */
export type DestroyAddOnPayload = {
  __typename?: 'DestroyAddOnPayload';
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
};

/** Autogenerated input type of DestroyBillableMetric */
export type DestroyBillableMetricInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
};

/** Autogenerated return type of DestroyBillableMetric */
export type DestroyBillableMetricPayload = {
  __typename?: 'DestroyBillableMetricPayload';
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
};

/** Autogenerated input type of DestroyCoupon */
export type DestroyCouponInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
};

/** Autogenerated return type of DestroyCoupon */
export type DestroyCouponPayload = {
  __typename?: 'DestroyCouponPayload';
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
};

/** Autogenerated input type of DestroyCustomer */
export type DestroyCustomerInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
};

/** Autogenerated return type of DestroyCustomer */
export type DestroyCustomerPayload = {
  __typename?: 'DestroyCustomerPayload';
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
};

/** Autogenerated input type of DestroyPlan */
export type DestroyPlanInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
};

/** Autogenerated return type of DestroyPlan */
export type DestroyPlanPayload = {
  __typename?: 'DestroyPlanPayload';
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
};

export type Event = {
  __typename?: 'Event';
  apiClient?: Maybe<Scalars['String']>;
  billableMetricName?: Maybe<Scalars['String']>;
  code: Scalars['String'];
  customerId: Scalars['String'];
  id: Scalars['ID'];
  ipAddress?: Maybe<Scalars['String']>;
  matchBillableMetric: Scalars['Boolean'];
  matchCustomField: Scalars['Boolean'];
  payload: Scalars['JSON'];
  receivedAt: Scalars['ISO8601DateTime'];
  timestamp?: Maybe<Scalars['ISO8601DateTime']>;
  transactionId?: Maybe<Scalars['String']>;
};

export type EventCollection = {
  __typename?: 'EventCollection';
  collection: Array<Event>;
  metadata: CollectionMetadata;
};

export type Forecast = {
  __typename?: 'Forecast';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  fees?: Maybe<Array<ForecastedFee>>;
  fromDate: Scalars['ISO8601Date'];
  issuingDate: Scalars['ISO8601Date'];
  toDate: Scalars['ISO8601Date'];
  totalAmountCents: Scalars['Int'];
  totalAmountCurrency: CurrencyEnum;
  vatAmountCents: Scalars['Int'];
  vatAmountCurrency: CurrencyEnum;
};

export type ForecastedFee = {
  __typename?: 'ForecastedFee';
  aggregationType: AggregationTypeEnum;
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  billableMetricCode: Scalars['String'];
  billableMetricName: Scalars['String'];
  chargeModel: ChargeModelEnum;
  units: Scalars['Int'];
  vatAmountCents: Scalars['Int'];
  vatAmountCurrency: CurrencyEnum;
};

export type GraduatedRange = {
  __typename?: 'GraduatedRange';
  flatAmount: Scalars['String'];
  fromValue: Scalars['Int'];
  perUnitAmount: Scalars['String'];
  toValue?: Maybe<Scalars['Int']>;
};

export type GraduatedRangeInput = {
  flatAmount: Scalars['String'];
  fromValue: Scalars['Int'];
  perUnitAmount: Scalars['String'];
  toValue?: InputMaybe<Scalars['Int']>;
};

export type Invoice = {
  __typename?: 'Invoice';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  createdAt: Scalars['ISO8601DateTime'];
  fromDate: Scalars['ISO8601Date'];
  id: Scalars['ID'];
  issuingDate: Scalars['ISO8601Date'];
  plan?: Maybe<Plan>;
  sequentialId: Scalars['ID'];
  subscription?: Maybe<Subscription>;
  toDate: Scalars['ISO8601Date'];
  totalAmountCents: Scalars['Int'];
  totalAmountCurrency: CurrencyEnum;
  updatedAt: Scalars['ISO8601DateTime'];
  vatAmountCents: Scalars['Int'];
  vatAmountCurrency: CurrencyEnum;
};

export enum Lago_Api_Error {
  CouponAlreadyApplied = 'coupon_already_applied',
  CurrenciesDoesNotMatch = 'currencies_does_not_match',
  ExpiredJwtToken = 'expired_jwt_token',
  Forbidden = 'forbidden',
  IncorrectLoginOrPassword = 'incorrect_login_or_password',
  InternalError = 'internal_error',
  NotFound = 'not_found',
  NotOrganizationMember = 'not_organization_member',
  TokenEncodingError = 'token_encoding_error',
  Unauthorized = 'unauthorized',
  UnprocessableEntity = 'unprocessable_entity',
  UserAlreadyExists = 'user_already_exists'
}

export type LoginUser = {
  __typename?: 'LoginUser';
  token: Scalars['String'];
  user: User;
};

/** Autogenerated input type of LoginUser */
export type LoginUserInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  email: Scalars['String'];
  password: Scalars['String'];
};

export type Membership = {
  __typename?: 'Membership';
  createdAt: Scalars['ISO8601DateTime'];
  id: Scalars['ID'];
  organizationId: Scalars['Int'];
  role?: Maybe<Scalars['String']>;
  updatedAt: Scalars['ISO8601DateTime'];
  userId: Scalars['Int'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Creates a new add-on */
  createAddOn?: Maybe<AddOn>;
  /** Assigns an add-on to a Customer */
  createAppliedAddOn?: Maybe<AppliedAddOn>;
  /** Assigns a Coupon to a Customer */
  createAppliedCoupon?: Maybe<AppliedCoupon>;
  /** Creates a new Billable metric */
  createBillableMetric?: Maybe<BillableMetric>;
  /** Creates a new Coupon */
  createCoupon?: Maybe<Coupon>;
  /** Creates a new customer */
  createCustomer?: Maybe<Customer>;
  /** Creates a new Plan */
  createPlan?: Maybe<Plan>;
  /** Create a new Subscription */
  createSubscription?: Maybe<Subscription>;
  /** Deletes an add-on */
  destroyAddOn?: Maybe<DestroyAddOnPayload>;
  /** Deletes a Billable metric */
  destroyBillableMetric?: Maybe<DestroyBillableMetricPayload>;
  /** Deletes a coupon */
  destroyCoupon?: Maybe<DestroyCouponPayload>;
  /** Delete a Customer */
  destroyCustomer?: Maybe<DestroyCustomerPayload>;
  /** Deletes a Plan */
  destroyPlan?: Maybe<DestroyPlanPayload>;
  /** Opens a session for an existing user */
  loginUser?: Maybe<LoginUser>;
  /** Registers a new user and creates related organization */
  registerUser?: Maybe<RegisterUser>;
  /** Unassign a coupon from a customer */
  terminateAppliedCoupon?: Maybe<AppliedCoupon>;
  /** Deletes a coupon */
  terminateCoupon?: Maybe<Coupon>;
  /** Terminate a Subscription */
  terminateSubscription?: Maybe<Subscription>;
  /** Update an existing add-on */
  updateAddOn?: Maybe<AddOn>;
  /** Updates an existing Billable metric */
  updateBillableMetric?: Maybe<BillableMetric>;
  /** Update an existing coupon */
  updateCoupon?: Maybe<Coupon>;
  /** Updates an existing Customer */
  updateCustomer?: Maybe<Customer>;
  /** Assign the vat rate to Customers */
  updateCustomerVatRate?: Maybe<CustomerDetails>;
  /** Updates an Organization */
  updateOrganization?: Maybe<Organization>;
  /** Updates an existing Plan */
  updatePlan?: Maybe<Plan>;
};


export type MutationCreateAddOnArgs = {
  input: CreateAddOnInput;
};


export type MutationCreateAppliedAddOnArgs = {
  input: CreateAppliedAddOnInput;
};


export type MutationCreateAppliedCouponArgs = {
  input: CreateAppliedCouponInput;
};


export type MutationCreateBillableMetricArgs = {
  input: CreateBillableMetricInput;
};


export type MutationCreateCouponArgs = {
  input: CreateCouponInput;
};


export type MutationCreateCustomerArgs = {
  input: CreateCustomerInput;
};


export type MutationCreatePlanArgs = {
  input: CreatePlanInput;
};


export type MutationCreateSubscriptionArgs = {
  input: CreateSubscriptionInput;
};


export type MutationDestroyAddOnArgs = {
  input: DestroyAddOnInput;
};


export type MutationDestroyBillableMetricArgs = {
  input: DestroyBillableMetricInput;
};


export type MutationDestroyCouponArgs = {
  input: DestroyCouponInput;
};


export type MutationDestroyCustomerArgs = {
  input: DestroyCustomerInput;
};


export type MutationDestroyPlanArgs = {
  input: DestroyPlanInput;
};


export type MutationLoginUserArgs = {
  input: LoginUserInput;
};


export type MutationRegisterUserArgs = {
  input: RegisterUserInput;
};


export type MutationTerminateAppliedCouponArgs = {
  input: TerminateAppliedCouponInput;
};


export type MutationTerminateCouponArgs = {
  input: TerminateCouponInput;
};


export type MutationTerminateSubscriptionArgs = {
  input: TerminateSubscriptionInput;
};


export type MutationUpdateAddOnArgs = {
  input: UpdateAddOnInput;
};


export type MutationUpdateBillableMetricArgs = {
  input: UpdateBillableMetricInput;
};


export type MutationUpdateCouponArgs = {
  input: UpdateCouponInput;
};


export type MutationUpdateCustomerArgs = {
  input: UpdateCustomerInput;
};


export type MutationUpdateCustomerVatRateArgs = {
  input: UpdateCustomerVatRateInput;
};


export type MutationUpdateOrganizationArgs = {
  input: UpdateOrganizationInput;
};


export type MutationUpdatePlanArgs = {
  input: UpdatePlanInput;
};

export type Organization = {
  __typename?: 'Organization';
  apiKey: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  id: Scalars['ID'];
  name: Scalars['String'];
  updatedAt: Scalars['ISO8601DateTime'];
  vatRate: Scalars['Float'];
  webhookUrl?: Maybe<Scalars['String']>;
};

export type Plan = {
  __typename?: 'Plan';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** Check if plan is deletable */
  canBeDeleted: Scalars['Boolean'];
  /** Number of charges attached to a plan */
  chargeCount: Scalars['Int'];
  charges?: Maybe<Array<Charge>>;
  code: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  /** Number of customers attached to a plan */
  customerCount: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  interval: PlanInterval;
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  payInAdvance: Scalars['Boolean'];
  trialPeriod?: Maybe<Scalars['Float']>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export type PlanCollection = {
  __typename?: 'PlanCollection';
  collection: Array<Plan>;
  metadata: CollectionMetadata;
};

export type PlanDetails = {
  __typename?: 'PlanDetails';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** Check if plan is deletable */
  canBeDeleted: Scalars['Boolean'];
  /** Number of charges attached to a plan */
  chargeCount: Scalars['Int'];
  charges?: Maybe<Array<Charge>>;
  code: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  /** Number of customers attached to a plan */
  customerCount: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  interval: PlanInterval;
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  payInAdvance: Scalars['Boolean'];
  trialPeriod?: Maybe<Scalars['Float']>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export enum PlanInterval {
  Monthly = 'monthly',
  Weekly = 'weekly',
  Yearly = 'yearly'
}

export type Query = {
  __typename?: 'Query';
  /** Query a single add-on of an organization */
  addOn?: Maybe<AddOnDetails>;
  /** Query add-ons of an organization */
  addOns: AddOnCollection;
  /** Query a single billable metric of an organization */
  billableMetric?: Maybe<BillableMetricDetail>;
  /** Query billable metrics of an organization */
  billableMetrics: BillableMetricCollection;
  /** Query a single coupon of an organization */
  coupon?: Maybe<CouponDetails>;
  /** Query coupons of an organization */
  coupons: CouponCollection;
  /** Retrives currently connected user */
  currentUser: User;
  /** Query a single customer of an organization */
  customer?: Maybe<CustomerDetails>;
  /** Query customers of an organization */
  customers: CustomerCollection;
  /** Query events of an organization */
  events?: Maybe<EventCollection>;
  /** Query the forecast of customer usage */
  forecast: Forecast;
  /** Query a single plan of an organization */
  plan?: Maybe<PlanDetails>;
  /** Query plans of an organization */
  plans: PlanCollection;
  token: Scalars['Boolean'];
};


export type QueryAddOnArgs = {
  id: Scalars['ID'];
};


export type QueryAddOnsArgs = {
  ids?: InputMaybe<Array<Scalars['ID']>>;
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
};


export type QueryBillableMetricArgs = {
  id: Scalars['ID'];
};


export type QueryBillableMetricsArgs = {
  ids?: InputMaybe<Array<Scalars['String']>>;
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
};


export type QueryCouponArgs = {
  id: Scalars['ID'];
};


export type QueryCouponsArgs = {
  ids?: InputMaybe<Array<Scalars['ID']>>;
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
  status?: InputMaybe<CouponStatusEnum>;
};


export type QueryCustomerArgs = {
  id: Scalars['ID'];
};


export type QueryCustomersArgs = {
  ids?: InputMaybe<Array<Scalars['String']>>;
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
};


export type QueryEventsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
};


export type QueryForecastArgs = {
  customerId?: InputMaybe<Scalars['ID']>;
};


export type QueryPlanArgs = {
  id: Scalars['ID'];
};


export type QueryPlansArgs = {
  ids?: InputMaybe<Array<Scalars['String']>>;
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
};

export type RegisterUser = {
  __typename?: 'RegisterUser';
  membership: Membership;
  organization: Organization;
  token: Scalars['String'];
  user: User;
};

/** Autogenerated input type of RegisterUser */
export type RegisterUserInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  email: Scalars['String'];
  organizationName: Scalars['String'];
  password: Scalars['String'];
};

export enum StatusTypeEnum {
  Active = 'active',
  Canceled = 'canceled',
  Pending = 'pending',
  Terminated = 'terminated'
}

export type Subscription = {
  __typename?: 'Subscription';
  anniversaryDate?: Maybe<Scalars['ISO8601Date']>;
  canceledAt?: Maybe<Scalars['ISO8601DateTime']>;
  createdAt: Scalars['ISO8601DateTime'];
  customer: Customer;
  id: Scalars['ID'];
  nextPlan?: Maybe<Plan>;
  pendingStartDate?: Maybe<Scalars['ISO8601Date']>;
  plan: Plan;
  startedAt?: Maybe<Scalars['ISO8601DateTime']>;
  status?: Maybe<StatusTypeEnum>;
  terminatedAt?: Maybe<Scalars['ISO8601DateTime']>;
  updatedAt: Scalars['ISO8601DateTime'];
};

/** Autogenerated input type of TerminateAppliedCoupon */
export type TerminateAppliedCouponInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
};

/** Autogenerated input type of TerminateCoupon */
export type TerminateCouponInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
};

/** Autogenerated input type of TerminateSubscription */
export type TerminateSubscriptionInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
};

/** Autogenerated input type of UpdateAddOn */
export type UpdateAddOnInput = {
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
};

/** Autogenerated input type of UpdateBillableMetric */
export type UpdateBillableMetricInput = {
  aggregationType: AggregationTypeEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description: Scalars['String'];
  fieldName?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
  name: Scalars['String'];
};

/** Autogenerated input type of UpdateCoupon */
export type UpdateCouponInput = {
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code?: InputMaybe<Scalars['String']>;
  expiration: CouponExpiration;
  expirationDuration?: InputMaybe<Scalars['Int']>;
  id: Scalars['String'];
  name: Scalars['String'];
};

/** Autogenerated input type of UpdateCustomer */
export type UpdateCustomerInput = {
  addressLine1?: InputMaybe<Scalars['String']>;
  addressLine2?: InputMaybe<Scalars['String']>;
  city?: InputMaybe<Scalars['String']>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  country?: InputMaybe<CountryCode>;
  customerId: Scalars['String'];
  email?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  legalName?: InputMaybe<Scalars['String']>;
  legalNumber?: InputMaybe<Scalars['String']>;
  logoUrl?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  phone?: InputMaybe<Scalars['String']>;
  state?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
  vatRate?: InputMaybe<Scalars['Float']>;
  zipcode?: InputMaybe<Scalars['String']>;
};

/** Autogenerated input type of UpdateCustomerVatRate */
export type UpdateCustomerVatRateInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  vatRate?: InputMaybe<Scalars['Float']>;
};

/** Autogenerated input type of UpdateOrganization */
export type UpdateOrganizationInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  vatRate?: InputMaybe<Scalars['Float']>;
  webhookUrl?: InputMaybe<Scalars['String']>;
};

/** Autogenerated input type of UpdatePlan */
export type UpdatePlanInput = {
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  charges: Array<ChargeInput>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
  interval: PlanInterval;
  name: Scalars['String'];
  payInAdvance: Scalars['Boolean'];
  trialPeriod?: InputMaybe<Scalars['Float']>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['ISO8601DateTime'];
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  organizations?: Maybe<Array<Organization>>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export type CurrentOrganizationFragment = { __typename?: 'Organization', id: string, name: string, apiKey: string, vatRate: number };

export type CurrentUserFragment = { __typename?: 'User', id: string, email?: string | null, organizations?: Array<{ __typename?: 'Organization', id: string, name: string, apiKey: string, vatRate: number }> | null };

export type UserIdentifierQueryVariables = Exact<{ [key: string]: never; }>;


export type UserIdentifierQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, email?: string | null, organizations?: Array<{ __typename?: 'Organization', id: string, name: string, apiKey: string, vatRate: number }> | null } };

export type AddOnItemFragment = { __typename?: 'AddOn', id: string, name: string, amountCurrency: CurrencyEnum, amountCents: number, customerCount: number, createdAt: any, canBeDeleted: boolean };

export type DeleteAddOnFragment = { __typename?: 'AddOn', id: string, name: string };

export type DeleteAddOnMutationVariables = Exact<{
  input: DestroyAddOnInput;
}>;


export type DeleteAddOnMutation = { __typename?: 'Mutation', destroyAddOn?: { __typename?: 'DestroyAddOnPayload', id?: string | null } | null };

export type BillableMetricItemFragment = { __typename?: 'BillableMetric', id: string, name: string, code: string, createdAt: any, canBeDeleted: boolean };

export type DeleteBillableMetricDialogFragment = { __typename?: 'BillableMetric', id: string, name: string };

export type DeleteBillableMetricMutationVariables = Exact<{
  input: DestroyBillableMetricInput;
}>;


export type DeleteBillableMetricMutation = { __typename?: 'Mutation', destroyBillableMetric?: { __typename?: 'DestroyBillableMetricPayload', id?: string | null } | null };

export type CouponItemFragment = { __typename?: 'Coupon', id: string, name: string, customerCount: number, status: CouponStatusEnum, amountCurrency: CurrencyEnum, amountCents: number, canBeDeleted: boolean, expirationDate?: any | null };

export type DeleteCouponFragment = { __typename?: 'Coupon', id: string, name: string };

export type DeleteCouponMutationVariables = Exact<{
  input: DestroyCouponInput;
}>;


export type DeleteCouponMutation = { __typename?: 'Mutation', destroyCoupon?: { __typename?: 'DestroyCouponPayload', id?: string | null } | null };

export type TerminateCouponFragment = { __typename?: 'Coupon', id: string, name: string };

export type TerminateCouponMutationVariables = Exact<{
  input: TerminateCouponInput;
}>;


export type TerminateCouponMutation = { __typename?: 'Mutation', terminateCoupon?: { __typename?: 'Coupon', id: string } | null };

export type GetAddOnsForCustomerQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type GetAddOnsForCustomerQuery = { __typename?: 'Query', addOns: { __typename?: 'AddOnCollection', metadata: { __typename?: 'CollectionMetadata', currentPage: number, totalPages: number }, collection: Array<{ __typename?: 'AddOn', id: string, name: string, amountCurrency: CurrencyEnum, amountCents: number }> } };

export type AddAddOnMutationVariables = Exact<{
  input: CreateAppliedAddOnInput;
}>;


export type AddAddOnMutation = { __typename?: 'Mutation', createAppliedAddOn?: { __typename?: 'AppliedAddOn', id: string } | null };

export type GetCouponForCustomerQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
  status?: InputMaybe<CouponStatusEnum>;
}>;


export type GetCouponForCustomerQuery = { __typename?: 'Query', coupons: { __typename?: 'CouponCollection', metadata: { __typename?: 'CollectionMetadata', currentPage: number, totalPages: number }, collection: Array<{ __typename?: 'Coupon', id: string, name: string, amountCurrency: CurrencyEnum, amountCents: number }> } };

export type AddCouponMutationVariables = Exact<{
  input: CreateAppliedCouponInput;
}>;


export type AddCouponMutation = { __typename?: 'Mutation', createAppliedCoupon?: { __typename?: 'AppliedCoupon', id: string } | null };

export type GetPlansQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type GetPlansQuery = { __typename?: 'Query', plans: { __typename?: 'PlanCollection', collection: Array<{ __typename?: 'Plan', id: string, name: string, code: string }> } };

export type CreateSubscriptionMutationVariables = Exact<{
  input: CreateSubscriptionInput;
}>;


export type CreateSubscriptionMutation = { __typename?: 'Mutation', createSubscription?: { __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, startedAt?: any | null, pendingStartDate?: any | null, plan: { __typename?: 'Plan', id: string, name: string, code: string } } | null };

export type CustomerAddOnsFragment = { __typename?: 'AppliedAddOn', id: string, amountCents: number, amountCurrency: CurrencyEnum, createdAt: any, addOn: { __typename?: 'AddOn', id: string, name: string } };

export type CustomerCouponFragment = { __typename?: 'AppliedCoupon', id: string, amountCents: number, amountCurrency: CurrencyEnum, coupon: { __typename?: 'Coupon', id: string, name: string } };

export type RemoveCouponMutationVariables = Exact<{
  input: TerminateAppliedCouponInput;
}>;


export type RemoveCouponMutation = { __typename?: 'Mutation', terminateAppliedCoupon?: { __typename?: 'AppliedCoupon', id: string } | null };

export type CustomerInvoiceListFragment = { __typename?: 'Invoice', id: string, issuingDate: any, totalAmountCents: number, amountCurrency: CurrencyEnum, plan?: { __typename?: 'Plan', id: string, name: string } | null };

export type CustomerItemFragment = { __typename?: 'Customer', id: string, name?: string | null, customerId: string, createdAt: any, canBeDeleted: boolean, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null, subscriptions?: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, plan: { __typename?: 'Plan', id: string, name: string } }> | null };

export type CustomerMainInfosFragment = { __typename?: 'CustomerDetails', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null };

export type CustomerSubscriptionListFragment = { __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, startedAt?: any | null, pendingStartDate?: any | null, plan: { __typename?: 'Plan', id: string, name: string, code: string } };

export type UserUsageQueryVariables = Exact<{
  customerId: Scalars['ID'];
}>;


export type UserUsageQuery = { __typename?: 'Query', forecast: { __typename?: 'Forecast', fromDate: any, toDate: any, issuingDate: any, amountCents: number, amountCurrency: CurrencyEnum, totalAmountCents: number, totalAmountCurrency: CurrencyEnum, vatAmountCents: number, vatAmountCurrency: CurrencyEnum, fees?: Array<{ __typename?: 'ForecastedFee', billableMetricName: string, billableMetricCode: string, aggregationType: AggregationTypeEnum, chargeModel: ChargeModelEnum, units: number, amountCents: number, amountCurrency: CurrencyEnum, vatAmountCents: number, vatAmountCurrency: CurrencyEnum }> | null } };

export type VatRateOrganizationFragment = { __typename?: 'Organization', id: string, vatRate: number };

export type CustomerVatRateFragment = { __typename?: 'CustomerDetails', id: string, vatRate?: number | null, name?: string | null };

export type DeleteCustomerDialogFragment = { __typename?: 'Customer', id: string, name?: string | null };

export type DeleteCustomerMutationVariables = Exact<{
  input: DestroyCustomerInput;
}>;


export type DeleteCustomerMutation = { __typename?: 'Mutation', destroyCustomer?: { __typename?: 'DestroyCustomerPayload', id?: string | null } | null };

export type DeleteCustomerVatRateMutationVariables = Exact<{
  input: UpdateCustomerVatRateInput;
}>;


export type DeleteCustomerVatRateMutation = { __typename?: 'Mutation', updateCustomerVatRate?: { __typename?: 'CustomerDetails', id: string, vatRate?: number | null } | null };

export type DeleteCustomerVatRateFragment = { __typename?: 'CustomerDetails', id: string, vatRate?: number | null, name?: string | null };

export type UpdateCustomerVatRateMutationVariables = Exact<{
  input: UpdateCustomerVatRateInput;
}>;


export type UpdateCustomerVatRateMutation = { __typename?: 'Mutation', updateCustomerVatRate?: { __typename?: 'CustomerDetails', id: string, vatRate?: number | null } | null };

export type EditCustomerVatRateFragment = { __typename?: 'CustomerDetails', id: string, name?: string | null, vatRate?: number | null };

export type EventItemFragment = { __typename?: 'Event', id: string, code: string, customerId: string, timestamp?: any | null, matchBillableMetric: boolean, matchCustomField: boolean };

export type DeleteWebhookMutationVariables = Exact<{
  input: UpdateOrganizationInput;
}>;


export type DeleteWebhookMutation = { __typename?: 'Mutation', updateOrganization?: { __typename?: 'Organization', id: string, webhookUrl?: string | null } | null };

export type UpdateOrganizationMutationVariables = Exact<{
  input: UpdateOrganizationInput;
}>;


export type UpdateOrganizationMutation = { __typename?: 'Mutation', updateOrganization?: { __typename?: 'Organization', id: string, webhookUrl?: string | null } | null };

export type BillableMetricForPlanFragment = { __typename?: 'BillableMetric', id: string, name: string, code: string };

export type GetbillableMetricsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type GetbillableMetricsQuery = { __typename?: 'Query', billableMetrics: { __typename?: 'BillableMetricCollection', collection: Array<{ __typename?: 'BillableMetric', id: string, name: string, code: string }> } };

export type DeletePlanDialogFragment = { __typename?: 'Plan', id: string, name: string };

export type DeletePlanMutationVariables = Exact<{
  input: DestroyPlanInput;
}>;


export type DeletePlanMutation = { __typename?: 'Mutation', destroyPlan?: { __typename?: 'DestroyPlanPayload', id?: string | null } | null };

export type PlanItemFragment = { __typename?: 'Plan', id: string, name: string, code: string, chargeCount: number, customerCount: number, createdAt: any, canBeDeleted: boolean };

export type UpdateVatRateOrganizationMutationVariables = Exact<{
  input: UpdateOrganizationInput;
}>;


export type UpdateVatRateOrganizationMutation = { __typename?: 'Mutation', updateOrganization?: { __typename?: 'Organization', id: string, vatRate: number } | null };

export type EditPlanFragment = { __typename?: 'PlanDetails', id: string, name: string, code: string, description?: string | null, interval: PlanInterval, payInAdvance: boolean, amountCents: number, amountCurrency: CurrencyEnum, trialPeriod?: number | null, canBeDeleted: boolean, charges?: Array<{ __typename?: 'Charge', id: string, amount?: string | null, amountCurrency?: CurrencyEnum | null, chargeModel: ChargeModelEnum, freeUnits?: number | null, packageSize?: number | null, billableMetric: { __typename?: 'BillableMetric', id: string, name: string, code: string }, graduatedRanges?: Array<{ __typename?: 'GraduatedRange', flatAmount: string, fromValue: number, perUnitAmount: string, toValue?: number | null }> | null }> | null };

export type GetSinglePlanQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSinglePlanQuery = { __typename?: 'Query', plan?: { __typename?: 'PlanDetails', id: string, name: string, code: string, description?: string | null, interval: PlanInterval, payInAdvance: boolean, amountCents: number, amountCurrency: CurrencyEnum, trialPeriod?: number | null, canBeDeleted: boolean, charges?: Array<{ __typename?: 'Charge', id: string, amount?: string | null, amountCurrency?: CurrencyEnum | null, chargeModel: ChargeModelEnum, freeUnits?: number | null, packageSize?: number | null, billableMetric: { __typename?: 'BillableMetric', id: string, name: string, code: string }, graduatedRanges?: Array<{ __typename?: 'GraduatedRange', flatAmount: string, fromValue: number, perUnitAmount: string, toValue?: number | null }> | null }> | null } | null };

export type CreatePlanMutationVariables = Exact<{
  input: CreatePlanInput;
}>;


export type CreatePlanMutation = { __typename?: 'Mutation', createPlan?: { __typename?: 'Plan', id: string } | null };

export type UpdatePlanMutationVariables = Exact<{
  input: UpdatePlanInput;
}>;


export type UpdatePlanMutation = { __typename?: 'Mutation', updatePlan?: { __typename?: 'Plan', id: string, name: string, code: string, chargeCount: number, customerCount: number, createdAt: any, canBeDeleted: boolean } | null };

export type EditAddOnFragment = { __typename?: 'AddOnDetails', id: string, name: string, code: string, description?: string | null, amountCents: number, amountCurrency: CurrencyEnum };

export type GetSingleAddOnQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSingleAddOnQuery = { __typename?: 'Query', addOn?: { __typename?: 'AddOnDetails', id: string, name: string, code: string, description?: string | null, amountCents: number, amountCurrency: CurrencyEnum } | null };

export type CreateAddOnMutationVariables = Exact<{
  input: CreateAddOnInput;
}>;


export type CreateAddOnMutation = { __typename?: 'Mutation', createAddOn?: { __typename?: 'AddOn', id: string } | null };

export type UpdateAddOnMutationVariables = Exact<{
  input: UpdateAddOnInput;
}>;


export type UpdateAddOnMutation = { __typename?: 'Mutation', updateAddOn?: { __typename?: 'AddOn', id: string, name: string, amountCurrency: CurrencyEnum, amountCents: number, customerCount: number, createdAt: any, canBeDeleted: boolean } | null };

export type EditBillableMetricFragment = { __typename?: 'BillableMetricDetail', id: string, name: string, code: string, description?: string | null, aggregationType: AggregationTypeEnum, canBeDeleted: boolean, fieldName?: string | null };

export type GetSingleBillableMetricQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSingleBillableMetricQuery = { __typename?: 'Query', billableMetric?: { __typename?: 'BillableMetricDetail', id: string, name: string, code: string, description?: string | null, aggregationType: AggregationTypeEnum, canBeDeleted: boolean, fieldName?: string | null } | null };

export type CreateBillableMetricMutationVariables = Exact<{
  input: CreateBillableMetricInput;
}>;


export type CreateBillableMetricMutation = { __typename?: 'Mutation', createBillableMetric?: { __typename?: 'BillableMetric', id: string } | null };

export type UpdateBillableMetricMutationVariables = Exact<{
  input: UpdateBillableMetricInput;
}>;


export type UpdateBillableMetricMutation = { __typename?: 'Mutation', updateBillableMetric?: { __typename?: 'BillableMetric', id: string, name: string, code: string, createdAt: any, canBeDeleted: boolean } | null };

export type EditCouponFragment = { __typename?: 'CouponDetails', id: string, amountCents: number, name: string, amountCurrency: CurrencyEnum, code?: string | null, expiration: CouponExpiration, expirationDuration?: number | null, canBeDeleted: boolean };

export type GetSingleCouponQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSingleCouponQuery = { __typename?: 'Query', coupon?: { __typename?: 'CouponDetails', id: string, amountCents: number, name: string, amountCurrency: CurrencyEnum, code?: string | null, expiration: CouponExpiration, expirationDuration?: number | null, canBeDeleted: boolean } | null };

export type CreateCouponMutationVariables = Exact<{
  input: CreateCouponInput;
}>;


export type CreateCouponMutation = { __typename?: 'Mutation', createCoupon?: { __typename?: 'Coupon', id: string } | null };

export type UpdateCouponMutationVariables = Exact<{
  input: UpdateCouponInput;
}>;


export type UpdateCouponMutation = { __typename?: 'Mutation', updateCoupon?: { __typename?: 'Coupon', id: string, name: string, customerCount: number, status: CouponStatusEnum, amountCurrency: CurrencyEnum, amountCents: number, canBeDeleted: boolean, expirationDate?: any | null } | null };

export type AddCustomerDialogFragment = { __typename?: 'Customer', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null };

export type AddCustomerDialogDetailFragment = { __typename?: 'CustomerDetails', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null };

export type BillingInfosFragment = { __typename?: 'CustomerDetails', id: string, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null };

export type GetBillingInfosQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetBillingInfosQuery = { __typename?: 'Query', customer?: { __typename?: 'CustomerDetails', id: string, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null } | null };

export type CreateCustomerMutationVariables = Exact<{
  input: CreateCustomerInput;
}>;


export type CreateCustomerMutation = { __typename?: 'Mutation', createCustomer?: { __typename?: 'Customer', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null, createdAt: any, subscriptions?: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, plan: { __typename?: 'Plan', id: string, name: string } }> | null } | null };

export type UpdateCustomerMutationVariables = Exact<{
  input: UpdateCustomerInput;
}>;


export type UpdateCustomerMutation = { __typename?: 'Mutation', updateCustomer?: { __typename?: 'Customer', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null, createdAt: any, subscriptions?: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, plan: { __typename?: 'Plan', id: string, name: string } }> | null } | null };

export type AddOnsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type AddOnsQuery = { __typename?: 'Query', addOns: { __typename?: 'AddOnCollection', metadata: { __typename?: 'CollectionMetadata', currentPage: number, totalPages: number }, collection: Array<{ __typename?: 'AddOn', id: string, name: string, amountCurrency: CurrencyEnum, amountCents: number, customerCount: number, createdAt: any, canBeDeleted: boolean }> } };

export type BillableMetricsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type BillableMetricsQuery = { __typename?: 'Query', billableMetrics: { __typename?: 'BillableMetricCollection', metadata: { __typename?: 'CollectionMetadata', currentPage: number, totalPages: number }, collection: Array<{ __typename?: 'BillableMetric', id: string, name: string, code: string, createdAt: any, canBeDeleted: boolean }> } };

export type CouponsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type CouponsQuery = { __typename?: 'Query', coupons: { __typename?: 'CouponCollection', metadata: { __typename?: 'CollectionMetadata', currentPage: number, totalPages: number }, collection: Array<{ __typename?: 'Coupon', id: string, name: string, customerCount: number, status: CouponStatusEnum, amountCurrency: CurrencyEnum, amountCents: number, canBeDeleted: boolean, expirationDate?: any | null }> } };

export type CustomerDetailsFragment = { __typename?: 'CustomerDetails', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, vatRate?: number | null, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null, subscriptions: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, startedAt?: any | null, pendingStartDate?: any | null, plan: { __typename?: 'Plan', id: string, name: string, code: string } }>, invoices?: Array<{ __typename?: 'Invoice', id: string, issuingDate: any, totalAmountCents: number, amountCurrency: CurrencyEnum, plan?: { __typename?: 'Plan', id: string, name: string } | null }> | null, appliedCoupons?: Array<{ __typename?: 'AppliedCoupon', id: string, amountCents: number, amountCurrency: CurrencyEnum, coupon: { __typename?: 'Coupon', id: string, name: string } }> | null, appliedAddOns?: Array<{ __typename?: 'AppliedAddOn', id: string, amountCents: number, amountCurrency: CurrencyEnum, createdAt: any, addOn: { __typename?: 'AddOn', id: string, name: string } }> | null };

export type GetCustomerQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetCustomerQuery = { __typename?: 'Query', customer?: { __typename?: 'CustomerDetails', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, vatRate?: number | null, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null, subscriptions: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, startedAt?: any | null, pendingStartDate?: any | null, plan: { __typename?: 'Plan', id: string, name: string, code: string } }>, invoices?: Array<{ __typename?: 'Invoice', id: string, issuingDate: any, totalAmountCents: number, amountCurrency: CurrencyEnum, plan?: { __typename?: 'Plan', id: string, name: string } | null }> | null, appliedCoupons?: Array<{ __typename?: 'AppliedCoupon', id: string, amountCents: number, amountCurrency: CurrencyEnum, coupon: { __typename?: 'Coupon', id: string, name: string } }> | null, appliedAddOns?: Array<{ __typename?: 'AppliedAddOn', id: string, amountCents: number, amountCurrency: CurrencyEnum, createdAt: any, addOn: { __typename?: 'AddOn', id: string, name: string } }> | null } | null };

export type CustomersQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type CustomersQuery = { __typename?: 'Query', customers: { __typename?: 'CustomerCollection', metadata: { __typename?: 'CollectionMetadata', currentPage: number, totalPages: number }, collection: Array<{ __typename?: 'Customer', id: string, name?: string | null, customerId: string, createdAt: any, canBeDeleted: boolean, legalName?: string | null, legalNumber?: string | null, phone?: string | null, email?: string | null, logoUrl?: string | null, url?: string | null, addressLine1?: string | null, addressLine2?: string | null, state?: string | null, country?: CountryCode | null, city?: string | null, zipcode?: string | null, subscriptions?: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, plan: { __typename?: 'Plan', id: string, name: string } }> | null }> } };

export type PlansQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type PlansQuery = { __typename?: 'Query', plans: { __typename?: 'PlanCollection', metadata: { __typename?: 'CollectionMetadata', currentPage: number, totalPages: number }, collection: Array<{ __typename?: 'Plan', id: string, name: string, code: string, chargeCount: number, customerCount: number, createdAt: any, canBeDeleted: boolean }> } };

export type LoginUserMutationVariables = Exact<{
  input: LoginUserInput;
}>;


export type LoginUserMutation = { __typename?: 'Mutation', loginUser?: { __typename?: 'LoginUser', token: string, user: { __typename?: 'User', id: string, email?: string | null, organizations?: Array<{ __typename?: 'Organization', id: string, name: string, apiKey: string, vatRate: number }> | null } } | null };

export type SignupMutationVariables = Exact<{
  input: RegisterUserInput;
}>;


export type SignupMutation = { __typename?: 'Mutation', registerUser?: { __typename?: 'RegisterUser', token: string, user: { __typename?: 'User', id: string, email?: string | null, organizations?: Array<{ __typename?: 'Organization', id: string, name: string, apiKey: string, vatRate: number }> | null }, organization: { __typename?: 'Organization', id: string, name: string } } | null };

export type ApiKeyOrganizationFragment = { __typename?: 'Organization', id: string, apiKey: string };

export type EventListFragment = { __typename?: 'Event', id: string, code: string, customerId: string, transactionId?: string | null, timestamp?: any | null, receivedAt: any, payload: any, billableMetricName?: string | null, matchBillableMetric: boolean, matchCustomField: boolean, apiClient?: string | null, ipAddress?: string | null };

export type EventsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type EventsQuery = { __typename?: 'Query', events?: { __typename?: 'EventCollection', collection: Array<{ __typename?: 'Event', id: string, code: string, customerId: string, transactionId?: string | null, timestamp?: any | null, receivedAt: any, payload: any, billableMetricName?: string | null, matchBillableMetric: boolean, matchCustomField: boolean, apiClient?: string | null, ipAddress?: string | null }>, metadata: { __typename?: 'CollectionMetadata', currentPage: number, totalPages: number } } | null };

export type WehbookSettingQueryVariables = Exact<{ [key: string]: never; }>;


export type WehbookSettingQuery = { __typename?: 'Query', currentUser: { __typename?: 'User', id: string, organizations?: Array<{ __typename?: 'Organization', id: string, webhookUrl?: string | null }> | null } };

export type VatRateSettingQueryVariables = Exact<{ [key: string]: never; }>;


export type VatRateSettingQuery = { __typename?: 'Query', currentUser: { __typename?: 'User', id: string, organizations?: Array<{ __typename?: 'Organization', id: string, vatRate: number }> | null } };

export const ApiKeyOrganizationFragmentDoc = gql`
    fragment ApiKeyOrganization on Organization {
  id
  apiKey
}
    `;
export const VatRateOrganizationFragmentDoc = gql`
    fragment VatRateOrganization on Organization {
  id
  vatRate
}
    `;
export const CurrentOrganizationFragmentDoc = gql`
    fragment CurrentOrganization on Organization {
  id
  name
  ...ApiKeyOrganization
  ...VatRateOrganization
}
    ${ApiKeyOrganizationFragmentDoc}
${VatRateOrganizationFragmentDoc}`;
export const CurrentUserFragmentDoc = gql`
    fragment CurrentUser on User {
  id
  email
  organizations {
    ...CurrentOrganization
  }
}
    ${CurrentOrganizationFragmentDoc}`;
export const AddOnItemFragmentDoc = gql`
    fragment AddOnItem on AddOn {
  id
  name
  amountCurrency
  amountCents
  customerCount
  createdAt
  canBeDeleted
}
    `;
export const DeleteAddOnFragmentDoc = gql`
    fragment DeleteAddOn on AddOn {
  id
  name
}
    `;
export const DeleteBillableMetricDialogFragmentDoc = gql`
    fragment DeleteBillableMetricDialog on BillableMetric {
  id
  name
}
    `;
export const BillableMetricItemFragmentDoc = gql`
    fragment BillableMetricItem on BillableMetric {
  id
  name
  code
  createdAt
  canBeDeleted
  ...DeleteBillableMetricDialog
}
    ${DeleteBillableMetricDialogFragmentDoc}`;
export const CouponItemFragmentDoc = gql`
    fragment CouponItem on Coupon {
  id
  name
  customerCount
  status
  amountCurrency
  amountCents
  canBeDeleted
  expirationDate
}
    `;
export const DeleteCouponFragmentDoc = gql`
    fragment DeleteCoupon on Coupon {
  id
  name
}
    `;
export const TerminateCouponFragmentDoc = gql`
    fragment TerminateCoupon on Coupon {
  id
  name
}
    `;
export const AddCustomerDialogFragmentDoc = gql`
    fragment AddCustomerDialog on Customer {
  id
  name
  customerId
  canBeDeleted
  legalName
  legalNumber
  phone
  email
  logoUrl
  url
  addressLine1
  addressLine2
  state
  country
  city
  zipcode
}
    `;
export const CustomerItemFragmentDoc = gql`
    fragment CustomerItem on Customer {
  id
  name
  customerId
  createdAt
  canBeDeleted
  subscriptions {
    id
    status
    plan {
      id
      name
    }
  }
  ...AddCustomerDialog
}
    ${AddCustomerDialogFragmentDoc}`;
export const DeleteCustomerDialogFragmentDoc = gql`
    fragment DeleteCustomerDialog on Customer {
  id
  name
}
    `;
export const BillableMetricForPlanFragmentDoc = gql`
    fragment billableMetricForPlan on BillableMetric {
  id
  name
  code
}
    `;
export const DeletePlanDialogFragmentDoc = gql`
    fragment DeletePlanDialog on Plan {
  id
  name
}
    `;
export const PlanItemFragmentDoc = gql`
    fragment PlanItem on Plan {
  id
  name
  code
  chargeCount
  customerCount
  createdAt
  canBeDeleted
  ...DeletePlanDialog
}
    ${DeletePlanDialogFragmentDoc}`;
export const EditPlanFragmentDoc = gql`
    fragment EditPlan on PlanDetails {
  id
  name
  code
  description
  interval
  payInAdvance
  amountCents
  amountCurrency
  trialPeriod
  canBeDeleted
  charges {
    id
    billableMetric {
      id
      name
      code
    }
    graduatedRanges {
      flatAmount
      fromValue
      perUnitAmount
      toValue
    }
    amount
    amountCurrency
    chargeModel
    freeUnits
    packageSize
  }
}
    `;
export const EditAddOnFragmentDoc = gql`
    fragment EditAddOn on AddOnDetails {
  id
  name
  code
  description
  amountCents
  amountCurrency
}
    `;
export const EditBillableMetricFragmentDoc = gql`
    fragment EditBillableMetric on BillableMetricDetail {
  id
  name
  code
  description
  aggregationType
  canBeDeleted
  fieldName
}
    `;
export const EditCouponFragmentDoc = gql`
    fragment EditCoupon on CouponDetails {
  id
  amountCents
  name
  amountCurrency
  code
  expiration
  expirationDuration
  canBeDeleted
}
    `;
export const BillingInfosFragmentDoc = gql`
    fragment BillingInfos on CustomerDetails {
  id
  legalName
  legalNumber
  phone
  email
  logoUrl
  url
  addressLine1
  addressLine2
  state
  country
  city
  zipcode
}
    `;
export const CustomerSubscriptionListFragmentDoc = gql`
    fragment CustomerSubscriptionList on Subscription {
  id
  status
  startedAt
  pendingStartDate
  plan {
    id
    name
    code
  }
}
    `;
export const CustomerInvoiceListFragmentDoc = gql`
    fragment CustomerInvoiceList on Invoice {
  id
  issuingDate
  totalAmountCents
  amountCurrency
  plan {
    id
    name
  }
}
    `;
export const CustomerCouponFragmentDoc = gql`
    fragment CustomerCoupon on AppliedCoupon {
  id
  amountCents
  amountCurrency
  coupon {
    id
    name
  }
}
    `;
export const CustomerAddOnsFragmentDoc = gql`
    fragment CustomerAddOns on AppliedAddOn {
  id
  amountCents
  amountCurrency
  createdAt
  addOn {
    id
    name
  }
}
    `;
export const EditCustomerVatRateFragmentDoc = gql`
    fragment EditCustomerVatRate on CustomerDetails {
  id
  name
  vatRate
}
    `;
export const DeleteCustomerVatRateFragmentDoc = gql`
    fragment DeleteCustomerVatRate on CustomerDetails {
  id
  vatRate
  name
}
    `;
export const CustomerVatRateFragmentDoc = gql`
    fragment CustomerVatRate on CustomerDetails {
  id
  vatRate
  ...EditCustomerVatRate
  ...DeleteCustomerVatRate
}
    ${EditCustomerVatRateFragmentDoc}
${DeleteCustomerVatRateFragmentDoc}`;
export const AddCustomerDialogDetailFragmentDoc = gql`
    fragment AddCustomerDialogDetail on CustomerDetails {
  id
  name
  customerId
  canBeDeleted
  legalName
  legalNumber
  phone
  email
  logoUrl
  url
  addressLine1
  addressLine2
  state
  country
  city
  zipcode
}
    `;
export const CustomerMainInfosFragmentDoc = gql`
    fragment CustomerMainInfos on CustomerDetails {
  id
  name
  customerId
  canBeDeleted
  legalName
  legalNumber
  phone
  email
  logoUrl
  url
  addressLine1
  addressLine2
  state
  country
  city
  zipcode
}
    `;
export const CustomerDetailsFragmentDoc = gql`
    fragment CustomerDetails on CustomerDetails {
  id
  name
  customerId
  canBeDeleted
  subscriptions(status: [active, pending]) {
    ...CustomerSubscriptionList
  }
  invoices {
    ...CustomerInvoiceList
  }
  appliedCoupons {
    ...CustomerCoupon
  }
  appliedAddOns {
    ...CustomerAddOns
  }
  ...CustomerVatRate
  ...AddCustomerDialogDetail
  ...CustomerMainInfos
}
    ${CustomerSubscriptionListFragmentDoc}
${CustomerInvoiceListFragmentDoc}
${CustomerCouponFragmentDoc}
${CustomerAddOnsFragmentDoc}
${CustomerVatRateFragmentDoc}
${AddCustomerDialogDetailFragmentDoc}
${CustomerMainInfosFragmentDoc}`;
export const EventItemFragmentDoc = gql`
    fragment EventItem on Event {
  id
  code
  customerId
  timestamp
  matchBillableMetric
  matchCustomField
}
    `;
export const EventListFragmentDoc = gql`
    fragment EventList on Event {
  id
  code
  customerId
  transactionId
  timestamp
  receivedAt
  payload
  billableMetricName
  matchBillableMetric
  matchCustomField
  apiClient
  ipAddress
  ...EventItem
}
    ${EventItemFragmentDoc}`;
export const UserIdentifierDocument = gql`
    query UserIdentifier {
  me: currentUser {
    ...CurrentUser
  }
}
    ${CurrentUserFragmentDoc}`;

/**
 * __useUserIdentifierQuery__
 *
 * To run a query within a React component, call `useUserIdentifierQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserIdentifierQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserIdentifierQuery({
 *   variables: {
 *   },
 * });
 */
export function useUserIdentifierQuery(baseOptions?: Apollo.QueryHookOptions<UserIdentifierQuery, UserIdentifierQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserIdentifierQuery, UserIdentifierQueryVariables>(UserIdentifierDocument, options);
      }
export function useUserIdentifierLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserIdentifierQuery, UserIdentifierQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserIdentifierQuery, UserIdentifierQueryVariables>(UserIdentifierDocument, options);
        }
export type UserIdentifierQueryHookResult = ReturnType<typeof useUserIdentifierQuery>;
export type UserIdentifierLazyQueryHookResult = ReturnType<typeof useUserIdentifierLazyQuery>;
export type UserIdentifierQueryResult = Apollo.QueryResult<UserIdentifierQuery, UserIdentifierQueryVariables>;
export const DeleteAddOnDocument = gql`
    mutation deleteAddOn($input: DestroyAddOnInput!) {
  destroyAddOn(input: $input) {
    id
  }
}
    `;
export type DeleteAddOnMutationFn = Apollo.MutationFunction<DeleteAddOnMutation, DeleteAddOnMutationVariables>;

/**
 * __useDeleteAddOnMutation__
 *
 * To run a mutation, you first call `useDeleteAddOnMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAddOnMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAddOnMutation, { data, loading, error }] = useDeleteAddOnMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteAddOnMutation(baseOptions?: Apollo.MutationHookOptions<DeleteAddOnMutation, DeleteAddOnMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteAddOnMutation, DeleteAddOnMutationVariables>(DeleteAddOnDocument, options);
      }
export type DeleteAddOnMutationHookResult = ReturnType<typeof useDeleteAddOnMutation>;
export type DeleteAddOnMutationResult = Apollo.MutationResult<DeleteAddOnMutation>;
export type DeleteAddOnMutationOptions = Apollo.BaseMutationOptions<DeleteAddOnMutation, DeleteAddOnMutationVariables>;
export const DeleteBillableMetricDocument = gql`
    mutation deleteBillableMetric($input: DestroyBillableMetricInput!) {
  destroyBillableMetric(input: $input) {
    id
  }
}
    `;
export type DeleteBillableMetricMutationFn = Apollo.MutationFunction<DeleteBillableMetricMutation, DeleteBillableMetricMutationVariables>;

/**
 * __useDeleteBillableMetricMutation__
 *
 * To run a mutation, you first call `useDeleteBillableMetricMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteBillableMetricMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteBillableMetricMutation, { data, loading, error }] = useDeleteBillableMetricMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteBillableMetricMutation(baseOptions?: Apollo.MutationHookOptions<DeleteBillableMetricMutation, DeleteBillableMetricMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteBillableMetricMutation, DeleteBillableMetricMutationVariables>(DeleteBillableMetricDocument, options);
      }
export type DeleteBillableMetricMutationHookResult = ReturnType<typeof useDeleteBillableMetricMutation>;
export type DeleteBillableMetricMutationResult = Apollo.MutationResult<DeleteBillableMetricMutation>;
export type DeleteBillableMetricMutationOptions = Apollo.BaseMutationOptions<DeleteBillableMetricMutation, DeleteBillableMetricMutationVariables>;
export const DeleteCouponDocument = gql`
    mutation deleteCoupon($input: DestroyCouponInput!) {
  destroyCoupon(input: $input) {
    id
  }
}
    `;
export type DeleteCouponMutationFn = Apollo.MutationFunction<DeleteCouponMutation, DeleteCouponMutationVariables>;

/**
 * __useDeleteCouponMutation__
 *
 * To run a mutation, you first call `useDeleteCouponMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCouponMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCouponMutation, { data, loading, error }] = useDeleteCouponMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteCouponMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCouponMutation, DeleteCouponMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCouponMutation, DeleteCouponMutationVariables>(DeleteCouponDocument, options);
      }
export type DeleteCouponMutationHookResult = ReturnType<typeof useDeleteCouponMutation>;
export type DeleteCouponMutationResult = Apollo.MutationResult<DeleteCouponMutation>;
export type DeleteCouponMutationOptions = Apollo.BaseMutationOptions<DeleteCouponMutation, DeleteCouponMutationVariables>;
export const TerminateCouponDocument = gql`
    mutation terminateCoupon($input: TerminateCouponInput!) {
  terminateCoupon(input: $input) {
    id
  }
}
    `;
export type TerminateCouponMutationFn = Apollo.MutationFunction<TerminateCouponMutation, TerminateCouponMutationVariables>;

/**
 * __useTerminateCouponMutation__
 *
 * To run a mutation, you first call `useTerminateCouponMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTerminateCouponMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [terminateCouponMutation, { data, loading, error }] = useTerminateCouponMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useTerminateCouponMutation(baseOptions?: Apollo.MutationHookOptions<TerminateCouponMutation, TerminateCouponMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TerminateCouponMutation, TerminateCouponMutationVariables>(TerminateCouponDocument, options);
      }
export type TerminateCouponMutationHookResult = ReturnType<typeof useTerminateCouponMutation>;
export type TerminateCouponMutationResult = Apollo.MutationResult<TerminateCouponMutation>;
export type TerminateCouponMutationOptions = Apollo.BaseMutationOptions<TerminateCouponMutation, TerminateCouponMutationVariables>;
export const GetAddOnsForCustomerDocument = gql`
    query getAddOnsForCustomer($page: Int, $limit: Int) {
  addOns(page: $page, limit: $limit) {
    metadata {
      currentPage
      totalPages
    }
    collection {
      id
      name
      amountCurrency
      amountCents
    }
  }
}
    `;

/**
 * __useGetAddOnsForCustomerQuery__
 *
 * To run a query within a React component, call `useGetAddOnsForCustomerQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAddOnsForCustomerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAddOnsForCustomerQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetAddOnsForCustomerQuery(baseOptions?: Apollo.QueryHookOptions<GetAddOnsForCustomerQuery, GetAddOnsForCustomerQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAddOnsForCustomerQuery, GetAddOnsForCustomerQueryVariables>(GetAddOnsForCustomerDocument, options);
      }
export function useGetAddOnsForCustomerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAddOnsForCustomerQuery, GetAddOnsForCustomerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAddOnsForCustomerQuery, GetAddOnsForCustomerQueryVariables>(GetAddOnsForCustomerDocument, options);
        }
export type GetAddOnsForCustomerQueryHookResult = ReturnType<typeof useGetAddOnsForCustomerQuery>;
export type GetAddOnsForCustomerLazyQueryHookResult = ReturnType<typeof useGetAddOnsForCustomerLazyQuery>;
export type GetAddOnsForCustomerQueryResult = Apollo.QueryResult<GetAddOnsForCustomerQuery, GetAddOnsForCustomerQueryVariables>;
export const AddAddOnDocument = gql`
    mutation addAddOn($input: CreateAppliedAddOnInput!) {
  createAppliedAddOn(input: $input) {
    id
  }
}
    `;
export type AddAddOnMutationFn = Apollo.MutationFunction<AddAddOnMutation, AddAddOnMutationVariables>;

/**
 * __useAddAddOnMutation__
 *
 * To run a mutation, you first call `useAddAddOnMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddAddOnMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addAddOnMutation, { data, loading, error }] = useAddAddOnMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddAddOnMutation(baseOptions?: Apollo.MutationHookOptions<AddAddOnMutation, AddAddOnMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddAddOnMutation, AddAddOnMutationVariables>(AddAddOnDocument, options);
      }
export type AddAddOnMutationHookResult = ReturnType<typeof useAddAddOnMutation>;
export type AddAddOnMutationResult = Apollo.MutationResult<AddAddOnMutation>;
export type AddAddOnMutationOptions = Apollo.BaseMutationOptions<AddAddOnMutation, AddAddOnMutationVariables>;
export const GetCouponForCustomerDocument = gql`
    query getCouponForCustomer($page: Int, $limit: Int, $status: CouponStatusEnum) {
  coupons(page: $page, limit: $limit, status: $status) {
    metadata {
      currentPage
      totalPages
    }
    collection {
      id
      name
      amountCurrency
      amountCents
    }
  }
}
    `;

/**
 * __useGetCouponForCustomerQuery__
 *
 * To run a query within a React component, call `useGetCouponForCustomerQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCouponForCustomerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCouponForCustomerQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetCouponForCustomerQuery(baseOptions?: Apollo.QueryHookOptions<GetCouponForCustomerQuery, GetCouponForCustomerQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCouponForCustomerQuery, GetCouponForCustomerQueryVariables>(GetCouponForCustomerDocument, options);
      }
export function useGetCouponForCustomerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCouponForCustomerQuery, GetCouponForCustomerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCouponForCustomerQuery, GetCouponForCustomerQueryVariables>(GetCouponForCustomerDocument, options);
        }
export type GetCouponForCustomerQueryHookResult = ReturnType<typeof useGetCouponForCustomerQuery>;
export type GetCouponForCustomerLazyQueryHookResult = ReturnType<typeof useGetCouponForCustomerLazyQuery>;
export type GetCouponForCustomerQueryResult = Apollo.QueryResult<GetCouponForCustomerQuery, GetCouponForCustomerQueryVariables>;
export const AddCouponDocument = gql`
    mutation addCoupon($input: CreateAppliedCouponInput!) {
  createAppliedCoupon(input: $input) {
    id
  }
}
    `;
export type AddCouponMutationFn = Apollo.MutationFunction<AddCouponMutation, AddCouponMutationVariables>;

/**
 * __useAddCouponMutation__
 *
 * To run a mutation, you first call `useAddCouponMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddCouponMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addCouponMutation, { data, loading, error }] = useAddCouponMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddCouponMutation(baseOptions?: Apollo.MutationHookOptions<AddCouponMutation, AddCouponMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddCouponMutation, AddCouponMutationVariables>(AddCouponDocument, options);
      }
export type AddCouponMutationHookResult = ReturnType<typeof useAddCouponMutation>;
export type AddCouponMutationResult = Apollo.MutationResult<AddCouponMutation>;
export type AddCouponMutationOptions = Apollo.BaseMutationOptions<AddCouponMutation, AddCouponMutationVariables>;
export const GetPlansDocument = gql`
    query getPlans($page: Int, $limit: Int) {
  plans(page: $page, limit: $limit) {
    collection {
      id
      name
      code
    }
  }
}
    `;

/**
 * __useGetPlansQuery__
 *
 * To run a query within a React component, call `useGetPlansQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPlansQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPlansQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetPlansQuery(baseOptions?: Apollo.QueryHookOptions<GetPlansQuery, GetPlansQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPlansQuery, GetPlansQueryVariables>(GetPlansDocument, options);
      }
export function useGetPlansLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPlansQuery, GetPlansQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPlansQuery, GetPlansQueryVariables>(GetPlansDocument, options);
        }
export type GetPlansQueryHookResult = ReturnType<typeof useGetPlansQuery>;
export type GetPlansLazyQueryHookResult = ReturnType<typeof useGetPlansLazyQuery>;
export type GetPlansQueryResult = Apollo.QueryResult<GetPlansQuery, GetPlansQueryVariables>;
export const CreateSubscriptionDocument = gql`
    mutation createSubscription($input: CreateSubscriptionInput!) {
  createSubscription(input: $input) {
    ...CustomerSubscriptionList
  }
}
    ${CustomerSubscriptionListFragmentDoc}`;
export type CreateSubscriptionMutationFn = Apollo.MutationFunction<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>;

/**
 * __useCreateSubscriptionMutation__
 *
 * To run a mutation, you first call `useCreateSubscriptionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSubscriptionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSubscriptionMutation, { data, loading, error }] = useCreateSubscriptionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSubscriptionMutation(baseOptions?: Apollo.MutationHookOptions<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>(CreateSubscriptionDocument, options);
      }
export type CreateSubscriptionMutationHookResult = ReturnType<typeof useCreateSubscriptionMutation>;
export type CreateSubscriptionMutationResult = Apollo.MutationResult<CreateSubscriptionMutation>;
export type CreateSubscriptionMutationOptions = Apollo.BaseMutationOptions<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>;
export const RemoveCouponDocument = gql`
    mutation removeCoupon($input: TerminateAppliedCouponInput!) {
  terminateAppliedCoupon(input: $input) {
    id
  }
}
    `;
export type RemoveCouponMutationFn = Apollo.MutationFunction<RemoveCouponMutation, RemoveCouponMutationVariables>;

/**
 * __useRemoveCouponMutation__
 *
 * To run a mutation, you first call `useRemoveCouponMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveCouponMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeCouponMutation, { data, loading, error }] = useRemoveCouponMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRemoveCouponMutation(baseOptions?: Apollo.MutationHookOptions<RemoveCouponMutation, RemoveCouponMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveCouponMutation, RemoveCouponMutationVariables>(RemoveCouponDocument, options);
      }
export type RemoveCouponMutationHookResult = ReturnType<typeof useRemoveCouponMutation>;
export type RemoveCouponMutationResult = Apollo.MutationResult<RemoveCouponMutation>;
export type RemoveCouponMutationOptions = Apollo.BaseMutationOptions<RemoveCouponMutation, RemoveCouponMutationVariables>;
export const UserUsageDocument = gql`
    query userUsage($customerId: ID!) {
  forecast(customerId: $customerId) {
    fromDate
    toDate
    issuingDate
    amountCents
    amountCurrency
    totalAmountCents
    totalAmountCurrency
    vatAmountCents
    vatAmountCurrency
    fees {
      billableMetricName
      billableMetricCode
      aggregationType
      chargeModel
      units
      amountCents
      amountCurrency
      vatAmountCents
      vatAmountCurrency
    }
  }
}
    `;

/**
 * __useUserUsageQuery__
 *
 * To run a query within a React component, call `useUserUsageQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserUsageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserUsageQuery({
 *   variables: {
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useUserUsageQuery(baseOptions: Apollo.QueryHookOptions<UserUsageQuery, UserUsageQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserUsageQuery, UserUsageQueryVariables>(UserUsageDocument, options);
      }
export function useUserUsageLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserUsageQuery, UserUsageQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserUsageQuery, UserUsageQueryVariables>(UserUsageDocument, options);
        }
export type UserUsageQueryHookResult = ReturnType<typeof useUserUsageQuery>;
export type UserUsageLazyQueryHookResult = ReturnType<typeof useUserUsageLazyQuery>;
export type UserUsageQueryResult = Apollo.QueryResult<UserUsageQuery, UserUsageQueryVariables>;
export const DeleteCustomerDocument = gql`
    mutation deleteCustomer($input: DestroyCustomerInput!) {
  destroyCustomer(input: $input) {
    id
  }
}
    `;
export type DeleteCustomerMutationFn = Apollo.MutationFunction<DeleteCustomerMutation, DeleteCustomerMutationVariables>;

/**
 * __useDeleteCustomerMutation__
 *
 * To run a mutation, you first call `useDeleteCustomerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCustomerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCustomerMutation, { data, loading, error }] = useDeleteCustomerMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteCustomerMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCustomerMutation, DeleteCustomerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCustomerMutation, DeleteCustomerMutationVariables>(DeleteCustomerDocument, options);
      }
export type DeleteCustomerMutationHookResult = ReturnType<typeof useDeleteCustomerMutation>;
export type DeleteCustomerMutationResult = Apollo.MutationResult<DeleteCustomerMutation>;
export type DeleteCustomerMutationOptions = Apollo.BaseMutationOptions<DeleteCustomerMutation, DeleteCustomerMutationVariables>;
export const DeleteCustomerVatRateDocument = gql`
    mutation deleteCustomerVatRate($input: UpdateCustomerVatRateInput!) {
  updateCustomerVatRate(input: $input) {
    id
    vatRate
  }
}
    `;
export type DeleteCustomerVatRateMutationFn = Apollo.MutationFunction<DeleteCustomerVatRateMutation, DeleteCustomerVatRateMutationVariables>;

/**
 * __useDeleteCustomerVatRateMutation__
 *
 * To run a mutation, you first call `useDeleteCustomerVatRateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCustomerVatRateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCustomerVatRateMutation, { data, loading, error }] = useDeleteCustomerVatRateMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteCustomerVatRateMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCustomerVatRateMutation, DeleteCustomerVatRateMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCustomerVatRateMutation, DeleteCustomerVatRateMutationVariables>(DeleteCustomerVatRateDocument, options);
      }
export type DeleteCustomerVatRateMutationHookResult = ReturnType<typeof useDeleteCustomerVatRateMutation>;
export type DeleteCustomerVatRateMutationResult = Apollo.MutationResult<DeleteCustomerVatRateMutation>;
export type DeleteCustomerVatRateMutationOptions = Apollo.BaseMutationOptions<DeleteCustomerVatRateMutation, DeleteCustomerVatRateMutationVariables>;
export const UpdateCustomerVatRateDocument = gql`
    mutation updateCustomerVatRate($input: UpdateCustomerVatRateInput!) {
  updateCustomerVatRate(input: $input) {
    id
    vatRate
  }
}
    `;
export type UpdateCustomerVatRateMutationFn = Apollo.MutationFunction<UpdateCustomerVatRateMutation, UpdateCustomerVatRateMutationVariables>;

/**
 * __useUpdateCustomerVatRateMutation__
 *
 * To run a mutation, you first call `useUpdateCustomerVatRateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCustomerVatRateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCustomerVatRateMutation, { data, loading, error }] = useUpdateCustomerVatRateMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateCustomerVatRateMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCustomerVatRateMutation, UpdateCustomerVatRateMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCustomerVatRateMutation, UpdateCustomerVatRateMutationVariables>(UpdateCustomerVatRateDocument, options);
      }
export type UpdateCustomerVatRateMutationHookResult = ReturnType<typeof useUpdateCustomerVatRateMutation>;
export type UpdateCustomerVatRateMutationResult = Apollo.MutationResult<UpdateCustomerVatRateMutation>;
export type UpdateCustomerVatRateMutationOptions = Apollo.BaseMutationOptions<UpdateCustomerVatRateMutation, UpdateCustomerVatRateMutationVariables>;
export const DeleteWebhookDocument = gql`
    mutation deleteWebhook($input: UpdateOrganizationInput!) {
  updateOrganization(input: $input) {
    id
    webhookUrl
  }
}
    `;
export type DeleteWebhookMutationFn = Apollo.MutationFunction<DeleteWebhookMutation, DeleteWebhookMutationVariables>;

/**
 * __useDeleteWebhookMutation__
 *
 * To run a mutation, you first call `useDeleteWebhookMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteWebhookMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteWebhookMutation, { data, loading, error }] = useDeleteWebhookMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteWebhookMutation(baseOptions?: Apollo.MutationHookOptions<DeleteWebhookMutation, DeleteWebhookMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteWebhookMutation, DeleteWebhookMutationVariables>(DeleteWebhookDocument, options);
      }
export type DeleteWebhookMutationHookResult = ReturnType<typeof useDeleteWebhookMutation>;
export type DeleteWebhookMutationResult = Apollo.MutationResult<DeleteWebhookMutation>;
export type DeleteWebhookMutationOptions = Apollo.BaseMutationOptions<DeleteWebhookMutation, DeleteWebhookMutationVariables>;
export const UpdateOrganizationDocument = gql`
    mutation updateOrganization($input: UpdateOrganizationInput!) {
  updateOrganization(input: $input) {
    id
    webhookUrl
  }
}
    `;
export type UpdateOrganizationMutationFn = Apollo.MutationFunction<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>;

/**
 * __useUpdateOrganizationMutation__
 *
 * To run a mutation, you first call `useUpdateOrganizationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOrganizationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOrganizationMutation, { data, loading, error }] = useUpdateOrganizationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateOrganizationMutation(baseOptions?: Apollo.MutationHookOptions<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>(UpdateOrganizationDocument, options);
      }
export type UpdateOrganizationMutationHookResult = ReturnType<typeof useUpdateOrganizationMutation>;
export type UpdateOrganizationMutationResult = Apollo.MutationResult<UpdateOrganizationMutation>;
export type UpdateOrganizationMutationOptions = Apollo.BaseMutationOptions<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>;
export const GetbillableMetricsDocument = gql`
    query getbillableMetrics($page: Int, $limit: Int) {
  billableMetrics(page: $page, limit: $limit) {
    collection {
      ...billableMetricForPlan
    }
  }
}
    ${BillableMetricForPlanFragmentDoc}`;

/**
 * __useGetbillableMetricsQuery__
 *
 * To run a query within a React component, call `useGetbillableMetricsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetbillableMetricsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetbillableMetricsQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetbillableMetricsQuery(baseOptions?: Apollo.QueryHookOptions<GetbillableMetricsQuery, GetbillableMetricsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetbillableMetricsQuery, GetbillableMetricsQueryVariables>(GetbillableMetricsDocument, options);
      }
export function useGetbillableMetricsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetbillableMetricsQuery, GetbillableMetricsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetbillableMetricsQuery, GetbillableMetricsQueryVariables>(GetbillableMetricsDocument, options);
        }
export type GetbillableMetricsQueryHookResult = ReturnType<typeof useGetbillableMetricsQuery>;
export type GetbillableMetricsLazyQueryHookResult = ReturnType<typeof useGetbillableMetricsLazyQuery>;
export type GetbillableMetricsQueryResult = Apollo.QueryResult<GetbillableMetricsQuery, GetbillableMetricsQueryVariables>;
export const DeletePlanDocument = gql`
    mutation deletePlan($input: DestroyPlanInput!) {
  destroyPlan(input: $input) {
    id
  }
}
    `;
export type DeletePlanMutationFn = Apollo.MutationFunction<DeletePlanMutation, DeletePlanMutationVariables>;

/**
 * __useDeletePlanMutation__
 *
 * To run a mutation, you first call `useDeletePlanMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePlanMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePlanMutation, { data, loading, error }] = useDeletePlanMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeletePlanMutation(baseOptions?: Apollo.MutationHookOptions<DeletePlanMutation, DeletePlanMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeletePlanMutation, DeletePlanMutationVariables>(DeletePlanDocument, options);
      }
export type DeletePlanMutationHookResult = ReturnType<typeof useDeletePlanMutation>;
export type DeletePlanMutationResult = Apollo.MutationResult<DeletePlanMutation>;
export type DeletePlanMutationOptions = Apollo.BaseMutationOptions<DeletePlanMutation, DeletePlanMutationVariables>;
export const UpdateVatRateOrganizationDocument = gql`
    mutation updateVatRateOrganization($input: UpdateOrganizationInput!) {
  updateOrganization(input: $input) {
    id
    vatRate
  }
}
    `;
export type UpdateVatRateOrganizationMutationFn = Apollo.MutationFunction<UpdateVatRateOrganizationMutation, UpdateVatRateOrganizationMutationVariables>;

/**
 * __useUpdateVatRateOrganizationMutation__
 *
 * To run a mutation, you first call `useUpdateVatRateOrganizationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateVatRateOrganizationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateVatRateOrganizationMutation, { data, loading, error }] = useUpdateVatRateOrganizationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateVatRateOrganizationMutation(baseOptions?: Apollo.MutationHookOptions<UpdateVatRateOrganizationMutation, UpdateVatRateOrganizationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateVatRateOrganizationMutation, UpdateVatRateOrganizationMutationVariables>(UpdateVatRateOrganizationDocument, options);
      }
export type UpdateVatRateOrganizationMutationHookResult = ReturnType<typeof useUpdateVatRateOrganizationMutation>;
export type UpdateVatRateOrganizationMutationResult = Apollo.MutationResult<UpdateVatRateOrganizationMutation>;
export type UpdateVatRateOrganizationMutationOptions = Apollo.BaseMutationOptions<UpdateVatRateOrganizationMutation, UpdateVatRateOrganizationMutationVariables>;
export const GetSinglePlanDocument = gql`
    query getSinglePlan($id: ID!) {
  plan(id: $id) {
    ...EditPlan
  }
}
    ${EditPlanFragmentDoc}`;

/**
 * __useGetSinglePlanQuery__
 *
 * To run a query within a React component, call `useGetSinglePlanQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSinglePlanQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSinglePlanQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSinglePlanQuery(baseOptions: Apollo.QueryHookOptions<GetSinglePlanQuery, GetSinglePlanQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSinglePlanQuery, GetSinglePlanQueryVariables>(GetSinglePlanDocument, options);
      }
export function useGetSinglePlanLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSinglePlanQuery, GetSinglePlanQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSinglePlanQuery, GetSinglePlanQueryVariables>(GetSinglePlanDocument, options);
        }
export type GetSinglePlanQueryHookResult = ReturnType<typeof useGetSinglePlanQuery>;
export type GetSinglePlanLazyQueryHookResult = ReturnType<typeof useGetSinglePlanLazyQuery>;
export type GetSinglePlanQueryResult = Apollo.QueryResult<GetSinglePlanQuery, GetSinglePlanQueryVariables>;
export const CreatePlanDocument = gql`
    mutation createPlan($input: CreatePlanInput!) {
  createPlan(input: $input) {
    id
  }
}
    `;
export type CreatePlanMutationFn = Apollo.MutationFunction<CreatePlanMutation, CreatePlanMutationVariables>;

/**
 * __useCreatePlanMutation__
 *
 * To run a mutation, you first call `useCreatePlanMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePlanMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPlanMutation, { data, loading, error }] = useCreatePlanMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePlanMutation(baseOptions?: Apollo.MutationHookOptions<CreatePlanMutation, CreatePlanMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreatePlanMutation, CreatePlanMutationVariables>(CreatePlanDocument, options);
      }
export type CreatePlanMutationHookResult = ReturnType<typeof useCreatePlanMutation>;
export type CreatePlanMutationResult = Apollo.MutationResult<CreatePlanMutation>;
export type CreatePlanMutationOptions = Apollo.BaseMutationOptions<CreatePlanMutation, CreatePlanMutationVariables>;
export const UpdatePlanDocument = gql`
    mutation updatePlan($input: UpdatePlanInput!) {
  updatePlan(input: $input) {
    ...PlanItem
    ...DeletePlanDialog
  }
}
    ${PlanItemFragmentDoc}
${DeletePlanDialogFragmentDoc}`;
export type UpdatePlanMutationFn = Apollo.MutationFunction<UpdatePlanMutation, UpdatePlanMutationVariables>;

/**
 * __useUpdatePlanMutation__
 *
 * To run a mutation, you first call `useUpdatePlanMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePlanMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePlanMutation, { data, loading, error }] = useUpdatePlanMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePlanMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePlanMutation, UpdatePlanMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePlanMutation, UpdatePlanMutationVariables>(UpdatePlanDocument, options);
      }
export type UpdatePlanMutationHookResult = ReturnType<typeof useUpdatePlanMutation>;
export type UpdatePlanMutationResult = Apollo.MutationResult<UpdatePlanMutation>;
export type UpdatePlanMutationOptions = Apollo.BaseMutationOptions<UpdatePlanMutation, UpdatePlanMutationVariables>;
export const GetSingleAddOnDocument = gql`
    query getSingleAddOn($id: ID!) {
  addOn(id: $id) {
    ...EditAddOn
  }
}
    ${EditAddOnFragmentDoc}`;

/**
 * __useGetSingleAddOnQuery__
 *
 * To run a query within a React component, call `useGetSingleAddOnQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSingleAddOnQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSingleAddOnQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSingleAddOnQuery(baseOptions: Apollo.QueryHookOptions<GetSingleAddOnQuery, GetSingleAddOnQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSingleAddOnQuery, GetSingleAddOnQueryVariables>(GetSingleAddOnDocument, options);
      }
export function useGetSingleAddOnLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSingleAddOnQuery, GetSingleAddOnQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSingleAddOnQuery, GetSingleAddOnQueryVariables>(GetSingleAddOnDocument, options);
        }
export type GetSingleAddOnQueryHookResult = ReturnType<typeof useGetSingleAddOnQuery>;
export type GetSingleAddOnLazyQueryHookResult = ReturnType<typeof useGetSingleAddOnLazyQuery>;
export type GetSingleAddOnQueryResult = Apollo.QueryResult<GetSingleAddOnQuery, GetSingleAddOnQueryVariables>;
export const CreateAddOnDocument = gql`
    mutation createAddOn($input: CreateAddOnInput!) {
  createAddOn(input: $input) {
    id
  }
}
    `;
export type CreateAddOnMutationFn = Apollo.MutationFunction<CreateAddOnMutation, CreateAddOnMutationVariables>;

/**
 * __useCreateAddOnMutation__
 *
 * To run a mutation, you first call `useCreateAddOnMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAddOnMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAddOnMutation, { data, loading, error }] = useCreateAddOnMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateAddOnMutation(baseOptions?: Apollo.MutationHookOptions<CreateAddOnMutation, CreateAddOnMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateAddOnMutation, CreateAddOnMutationVariables>(CreateAddOnDocument, options);
      }
export type CreateAddOnMutationHookResult = ReturnType<typeof useCreateAddOnMutation>;
export type CreateAddOnMutationResult = Apollo.MutationResult<CreateAddOnMutation>;
export type CreateAddOnMutationOptions = Apollo.BaseMutationOptions<CreateAddOnMutation, CreateAddOnMutationVariables>;
export const UpdateAddOnDocument = gql`
    mutation updateAddOn($input: UpdateAddOnInput!) {
  updateAddOn(input: $input) {
    ...AddOnItem
  }
}
    ${AddOnItemFragmentDoc}`;
export type UpdateAddOnMutationFn = Apollo.MutationFunction<UpdateAddOnMutation, UpdateAddOnMutationVariables>;

/**
 * __useUpdateAddOnMutation__
 *
 * To run a mutation, you first call `useUpdateAddOnMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAddOnMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAddOnMutation, { data, loading, error }] = useUpdateAddOnMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAddOnMutation(baseOptions?: Apollo.MutationHookOptions<UpdateAddOnMutation, UpdateAddOnMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateAddOnMutation, UpdateAddOnMutationVariables>(UpdateAddOnDocument, options);
      }
export type UpdateAddOnMutationHookResult = ReturnType<typeof useUpdateAddOnMutation>;
export type UpdateAddOnMutationResult = Apollo.MutationResult<UpdateAddOnMutation>;
export type UpdateAddOnMutationOptions = Apollo.BaseMutationOptions<UpdateAddOnMutation, UpdateAddOnMutationVariables>;
export const GetSingleBillableMetricDocument = gql`
    query getSingleBillableMetric($id: ID!) {
  billableMetric(id: $id) {
    ...EditBillableMetric
  }
}
    ${EditBillableMetricFragmentDoc}`;

/**
 * __useGetSingleBillableMetricQuery__
 *
 * To run a query within a React component, call `useGetSingleBillableMetricQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSingleBillableMetricQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSingleBillableMetricQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSingleBillableMetricQuery(baseOptions: Apollo.QueryHookOptions<GetSingleBillableMetricQuery, GetSingleBillableMetricQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSingleBillableMetricQuery, GetSingleBillableMetricQueryVariables>(GetSingleBillableMetricDocument, options);
      }
export function useGetSingleBillableMetricLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSingleBillableMetricQuery, GetSingleBillableMetricQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSingleBillableMetricQuery, GetSingleBillableMetricQueryVariables>(GetSingleBillableMetricDocument, options);
        }
export type GetSingleBillableMetricQueryHookResult = ReturnType<typeof useGetSingleBillableMetricQuery>;
export type GetSingleBillableMetricLazyQueryHookResult = ReturnType<typeof useGetSingleBillableMetricLazyQuery>;
export type GetSingleBillableMetricQueryResult = Apollo.QueryResult<GetSingleBillableMetricQuery, GetSingleBillableMetricQueryVariables>;
export const CreateBillableMetricDocument = gql`
    mutation createBillableMetric($input: CreateBillableMetricInput!) {
  createBillableMetric(input: $input) {
    id
  }
}
    `;
export type CreateBillableMetricMutationFn = Apollo.MutationFunction<CreateBillableMetricMutation, CreateBillableMetricMutationVariables>;

/**
 * __useCreateBillableMetricMutation__
 *
 * To run a mutation, you first call `useCreateBillableMetricMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateBillableMetricMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createBillableMetricMutation, { data, loading, error }] = useCreateBillableMetricMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateBillableMetricMutation(baseOptions?: Apollo.MutationHookOptions<CreateBillableMetricMutation, CreateBillableMetricMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateBillableMetricMutation, CreateBillableMetricMutationVariables>(CreateBillableMetricDocument, options);
      }
export type CreateBillableMetricMutationHookResult = ReturnType<typeof useCreateBillableMetricMutation>;
export type CreateBillableMetricMutationResult = Apollo.MutationResult<CreateBillableMetricMutation>;
export type CreateBillableMetricMutationOptions = Apollo.BaseMutationOptions<CreateBillableMetricMutation, CreateBillableMetricMutationVariables>;
export const UpdateBillableMetricDocument = gql`
    mutation updateBillableMetric($input: UpdateBillableMetricInput!) {
  updateBillableMetric(input: $input) {
    ...BillableMetricItem
    ...DeleteBillableMetricDialog
  }
}
    ${BillableMetricItemFragmentDoc}
${DeleteBillableMetricDialogFragmentDoc}`;
export type UpdateBillableMetricMutationFn = Apollo.MutationFunction<UpdateBillableMetricMutation, UpdateBillableMetricMutationVariables>;

/**
 * __useUpdateBillableMetricMutation__
 *
 * To run a mutation, you first call `useUpdateBillableMetricMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBillableMetricMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBillableMetricMutation, { data, loading, error }] = useUpdateBillableMetricMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateBillableMetricMutation(baseOptions?: Apollo.MutationHookOptions<UpdateBillableMetricMutation, UpdateBillableMetricMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateBillableMetricMutation, UpdateBillableMetricMutationVariables>(UpdateBillableMetricDocument, options);
      }
export type UpdateBillableMetricMutationHookResult = ReturnType<typeof useUpdateBillableMetricMutation>;
export type UpdateBillableMetricMutationResult = Apollo.MutationResult<UpdateBillableMetricMutation>;
export type UpdateBillableMetricMutationOptions = Apollo.BaseMutationOptions<UpdateBillableMetricMutation, UpdateBillableMetricMutationVariables>;
export const GetSingleCouponDocument = gql`
    query getSingleCoupon($id: ID!) {
  coupon(id: $id) {
    ...EditCoupon
  }
}
    ${EditCouponFragmentDoc}`;

/**
 * __useGetSingleCouponQuery__
 *
 * To run a query within a React component, call `useGetSingleCouponQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSingleCouponQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSingleCouponQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSingleCouponQuery(baseOptions: Apollo.QueryHookOptions<GetSingleCouponQuery, GetSingleCouponQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSingleCouponQuery, GetSingleCouponQueryVariables>(GetSingleCouponDocument, options);
      }
export function useGetSingleCouponLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSingleCouponQuery, GetSingleCouponQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSingleCouponQuery, GetSingleCouponQueryVariables>(GetSingleCouponDocument, options);
        }
export type GetSingleCouponQueryHookResult = ReturnType<typeof useGetSingleCouponQuery>;
export type GetSingleCouponLazyQueryHookResult = ReturnType<typeof useGetSingleCouponLazyQuery>;
export type GetSingleCouponQueryResult = Apollo.QueryResult<GetSingleCouponQuery, GetSingleCouponQueryVariables>;
export const CreateCouponDocument = gql`
    mutation createCoupon($input: CreateCouponInput!) {
  createCoupon(input: $input) {
    id
  }
}
    `;
export type CreateCouponMutationFn = Apollo.MutationFunction<CreateCouponMutation, CreateCouponMutationVariables>;

/**
 * __useCreateCouponMutation__
 *
 * To run a mutation, you first call `useCreateCouponMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCouponMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCouponMutation, { data, loading, error }] = useCreateCouponMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCouponMutation(baseOptions?: Apollo.MutationHookOptions<CreateCouponMutation, CreateCouponMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCouponMutation, CreateCouponMutationVariables>(CreateCouponDocument, options);
      }
export type CreateCouponMutationHookResult = ReturnType<typeof useCreateCouponMutation>;
export type CreateCouponMutationResult = Apollo.MutationResult<CreateCouponMutation>;
export type CreateCouponMutationOptions = Apollo.BaseMutationOptions<CreateCouponMutation, CreateCouponMutationVariables>;
export const UpdateCouponDocument = gql`
    mutation updateCoupon($input: UpdateCouponInput!) {
  updateCoupon(input: $input) {
    ...CouponItem
  }
}
    ${CouponItemFragmentDoc}`;
export type UpdateCouponMutationFn = Apollo.MutationFunction<UpdateCouponMutation, UpdateCouponMutationVariables>;

/**
 * __useUpdateCouponMutation__
 *
 * To run a mutation, you first call `useUpdateCouponMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCouponMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCouponMutation, { data, loading, error }] = useUpdateCouponMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateCouponMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCouponMutation, UpdateCouponMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCouponMutation, UpdateCouponMutationVariables>(UpdateCouponDocument, options);
      }
export type UpdateCouponMutationHookResult = ReturnType<typeof useUpdateCouponMutation>;
export type UpdateCouponMutationResult = Apollo.MutationResult<UpdateCouponMutation>;
export type UpdateCouponMutationOptions = Apollo.BaseMutationOptions<UpdateCouponMutation, UpdateCouponMutationVariables>;
export const GetBillingInfosDocument = gql`
    query getBillingInfos($id: ID!) {
  customer(id: $id) {
    ...BillingInfos
  }
}
    ${BillingInfosFragmentDoc}`;

/**
 * __useGetBillingInfosQuery__
 *
 * To run a query within a React component, call `useGetBillingInfosQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBillingInfosQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBillingInfosQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetBillingInfosQuery(baseOptions: Apollo.QueryHookOptions<GetBillingInfosQuery, GetBillingInfosQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetBillingInfosQuery, GetBillingInfosQueryVariables>(GetBillingInfosDocument, options);
      }
export function useGetBillingInfosLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetBillingInfosQuery, GetBillingInfosQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetBillingInfosQuery, GetBillingInfosQueryVariables>(GetBillingInfosDocument, options);
        }
export type GetBillingInfosQueryHookResult = ReturnType<typeof useGetBillingInfosQuery>;
export type GetBillingInfosLazyQueryHookResult = ReturnType<typeof useGetBillingInfosLazyQuery>;
export type GetBillingInfosQueryResult = Apollo.QueryResult<GetBillingInfosQuery, GetBillingInfosQueryVariables>;
export const CreateCustomerDocument = gql`
    mutation createCustomer($input: CreateCustomerInput!) {
  createCustomer(input: $input) {
    ...AddCustomerDialog
    ...CustomerItem
  }
}
    ${AddCustomerDialogFragmentDoc}
${CustomerItemFragmentDoc}`;
export type CreateCustomerMutationFn = Apollo.MutationFunction<CreateCustomerMutation, CreateCustomerMutationVariables>;

/**
 * __useCreateCustomerMutation__
 *
 * To run a mutation, you first call `useCreateCustomerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCustomerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCustomerMutation, { data, loading, error }] = useCreateCustomerMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCustomerMutation(baseOptions?: Apollo.MutationHookOptions<CreateCustomerMutation, CreateCustomerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCustomerMutation, CreateCustomerMutationVariables>(CreateCustomerDocument, options);
      }
export type CreateCustomerMutationHookResult = ReturnType<typeof useCreateCustomerMutation>;
export type CreateCustomerMutationResult = Apollo.MutationResult<CreateCustomerMutation>;
export type CreateCustomerMutationOptions = Apollo.BaseMutationOptions<CreateCustomerMutation, CreateCustomerMutationVariables>;
export const UpdateCustomerDocument = gql`
    mutation updateCustomer($input: UpdateCustomerInput!) {
  updateCustomer(input: $input) {
    ...AddCustomerDialog
    ...CustomerItem
  }
}
    ${AddCustomerDialogFragmentDoc}
${CustomerItemFragmentDoc}`;
export type UpdateCustomerMutationFn = Apollo.MutationFunction<UpdateCustomerMutation, UpdateCustomerMutationVariables>;

/**
 * __useUpdateCustomerMutation__
 *
 * To run a mutation, you first call `useUpdateCustomerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCustomerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCustomerMutation, { data, loading, error }] = useUpdateCustomerMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateCustomerMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCustomerMutation, UpdateCustomerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCustomerMutation, UpdateCustomerMutationVariables>(UpdateCustomerDocument, options);
      }
export type UpdateCustomerMutationHookResult = ReturnType<typeof useUpdateCustomerMutation>;
export type UpdateCustomerMutationResult = Apollo.MutationResult<UpdateCustomerMutation>;
export type UpdateCustomerMutationOptions = Apollo.BaseMutationOptions<UpdateCustomerMutation, UpdateCustomerMutationVariables>;
export const AddOnsDocument = gql`
    query addOns($page: Int, $limit: Int) {
  addOns(page: $page, limit: $limit) {
    metadata {
      currentPage
      totalPages
    }
    collection {
      id
      ...AddOnItem
    }
  }
}
    ${AddOnItemFragmentDoc}`;

/**
 * __useAddOnsQuery__
 *
 * To run a query within a React component, call `useAddOnsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAddOnsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAddOnsQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useAddOnsQuery(baseOptions?: Apollo.QueryHookOptions<AddOnsQuery, AddOnsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AddOnsQuery, AddOnsQueryVariables>(AddOnsDocument, options);
      }
export function useAddOnsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AddOnsQuery, AddOnsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AddOnsQuery, AddOnsQueryVariables>(AddOnsDocument, options);
        }
export type AddOnsQueryHookResult = ReturnType<typeof useAddOnsQuery>;
export type AddOnsLazyQueryHookResult = ReturnType<typeof useAddOnsLazyQuery>;
export type AddOnsQueryResult = Apollo.QueryResult<AddOnsQuery, AddOnsQueryVariables>;
export const BillableMetricsDocument = gql`
    query billableMetrics($page: Int, $limit: Int) {
  billableMetrics(page: $page, limit: $limit) {
    metadata {
      currentPage
      totalPages
    }
    collection {
      ...BillableMetricItem
    }
  }
}
    ${BillableMetricItemFragmentDoc}`;

/**
 * __useBillableMetricsQuery__
 *
 * To run a query within a React component, call `useBillableMetricsQuery` and pass it any options that fit your needs.
 * When your component renders, `useBillableMetricsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBillableMetricsQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useBillableMetricsQuery(baseOptions?: Apollo.QueryHookOptions<BillableMetricsQuery, BillableMetricsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BillableMetricsQuery, BillableMetricsQueryVariables>(BillableMetricsDocument, options);
      }
export function useBillableMetricsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BillableMetricsQuery, BillableMetricsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BillableMetricsQuery, BillableMetricsQueryVariables>(BillableMetricsDocument, options);
        }
export type BillableMetricsQueryHookResult = ReturnType<typeof useBillableMetricsQuery>;
export type BillableMetricsLazyQueryHookResult = ReturnType<typeof useBillableMetricsLazyQuery>;
export type BillableMetricsQueryResult = Apollo.QueryResult<BillableMetricsQuery, BillableMetricsQueryVariables>;
export const CouponsDocument = gql`
    query coupons($page: Int, $limit: Int) {
  coupons(page: $page, limit: $limit) {
    metadata {
      currentPage
      totalPages
    }
    collection {
      ...CouponItem
    }
  }
}
    ${CouponItemFragmentDoc}`;

/**
 * __useCouponsQuery__
 *
 * To run a query within a React component, call `useCouponsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCouponsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCouponsQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useCouponsQuery(baseOptions?: Apollo.QueryHookOptions<CouponsQuery, CouponsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CouponsQuery, CouponsQueryVariables>(CouponsDocument, options);
      }
export function useCouponsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CouponsQuery, CouponsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CouponsQuery, CouponsQueryVariables>(CouponsDocument, options);
        }
export type CouponsQueryHookResult = ReturnType<typeof useCouponsQuery>;
export type CouponsLazyQueryHookResult = ReturnType<typeof useCouponsLazyQuery>;
export type CouponsQueryResult = Apollo.QueryResult<CouponsQuery, CouponsQueryVariables>;
export const GetCustomerDocument = gql`
    query getCustomer($id: ID!) {
  customer(id: $id) {
    ...CustomerDetails
  }
}
    ${CustomerDetailsFragmentDoc}`;

/**
 * __useGetCustomerQuery__
 *
 * To run a query within a React component, call `useGetCustomerQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCustomerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCustomerQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetCustomerQuery(baseOptions: Apollo.QueryHookOptions<GetCustomerQuery, GetCustomerQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCustomerQuery, GetCustomerQueryVariables>(GetCustomerDocument, options);
      }
export function useGetCustomerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCustomerQuery, GetCustomerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCustomerQuery, GetCustomerQueryVariables>(GetCustomerDocument, options);
        }
export type GetCustomerQueryHookResult = ReturnType<typeof useGetCustomerQuery>;
export type GetCustomerLazyQueryHookResult = ReturnType<typeof useGetCustomerLazyQuery>;
export type GetCustomerQueryResult = Apollo.QueryResult<GetCustomerQuery, GetCustomerQueryVariables>;
export const CustomersDocument = gql`
    query customers($page: Int, $limit: Int) {
  customers(page: $page, limit: $limit) {
    metadata {
      currentPage
      totalPages
    }
    collection {
      ...CustomerItem
    }
  }
}
    ${CustomerItemFragmentDoc}`;

/**
 * __useCustomersQuery__
 *
 * To run a query within a React component, call `useCustomersQuery` and pass it any options that fit your needs.
 * When your component renders, `useCustomersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCustomersQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useCustomersQuery(baseOptions?: Apollo.QueryHookOptions<CustomersQuery, CustomersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CustomersQuery, CustomersQueryVariables>(CustomersDocument, options);
      }
export function useCustomersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CustomersQuery, CustomersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CustomersQuery, CustomersQueryVariables>(CustomersDocument, options);
        }
export type CustomersQueryHookResult = ReturnType<typeof useCustomersQuery>;
export type CustomersLazyQueryHookResult = ReturnType<typeof useCustomersLazyQuery>;
export type CustomersQueryResult = Apollo.QueryResult<CustomersQuery, CustomersQueryVariables>;
export const PlansDocument = gql`
    query plans($page: Int, $limit: Int) {
  plans(page: $page, limit: $limit) {
    metadata {
      currentPage
      totalPages
    }
    collection {
      ...PlanItem
    }
  }
}
    ${PlanItemFragmentDoc}`;

/**
 * __usePlansQuery__
 *
 * To run a query within a React component, call `usePlansQuery` and pass it any options that fit your needs.
 * When your component renders, `usePlansQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePlansQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function usePlansQuery(baseOptions?: Apollo.QueryHookOptions<PlansQuery, PlansQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PlansQuery, PlansQueryVariables>(PlansDocument, options);
      }
export function usePlansLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PlansQuery, PlansQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PlansQuery, PlansQueryVariables>(PlansDocument, options);
        }
export type PlansQueryHookResult = ReturnType<typeof usePlansQuery>;
export type PlansLazyQueryHookResult = ReturnType<typeof usePlansLazyQuery>;
export type PlansQueryResult = Apollo.QueryResult<PlansQuery, PlansQueryVariables>;
export const LoginUserDocument = gql`
    mutation loginUser($input: LoginUserInput!) {
  loginUser(input: $input) {
    user {
      ...CurrentUser
    }
    token
  }
}
    ${CurrentUserFragmentDoc}`;
export type LoginUserMutationFn = Apollo.MutationFunction<LoginUserMutation, LoginUserMutationVariables>;

/**
 * __useLoginUserMutation__
 *
 * To run a mutation, you first call `useLoginUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginUserMutation, { data, loading, error }] = useLoginUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginUserMutation(baseOptions?: Apollo.MutationHookOptions<LoginUserMutation, LoginUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginUserMutation, LoginUserMutationVariables>(LoginUserDocument, options);
      }
export type LoginUserMutationHookResult = ReturnType<typeof useLoginUserMutation>;
export type LoginUserMutationResult = Apollo.MutationResult<LoginUserMutation>;
export type LoginUserMutationOptions = Apollo.BaseMutationOptions<LoginUserMutation, LoginUserMutationVariables>;
export const SignupDocument = gql`
    mutation signup($input: RegisterUserInput!) {
  registerUser(input: $input) {
    token
    user {
      ...CurrentUser
    }
    organization {
      id
      name
    }
  }
}
    ${CurrentUserFragmentDoc}`;
export type SignupMutationFn = Apollo.MutationFunction<SignupMutation, SignupMutationVariables>;

/**
 * __useSignupMutation__
 *
 * To run a mutation, you first call `useSignupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSignupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [signupMutation, { data, loading, error }] = useSignupMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSignupMutation(baseOptions?: Apollo.MutationHookOptions<SignupMutation, SignupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SignupMutation, SignupMutationVariables>(SignupDocument, options);
      }
export type SignupMutationHookResult = ReturnType<typeof useSignupMutation>;
export type SignupMutationResult = Apollo.MutationResult<SignupMutation>;
export type SignupMutationOptions = Apollo.BaseMutationOptions<SignupMutation, SignupMutationVariables>;
export const EventsDocument = gql`
    query events($page: Int, $limit: Int) {
  events(page: $page, limit: $limit) {
    collection {
      ...EventList
    }
    metadata {
      currentPage
      totalPages
    }
  }
}
    ${EventListFragmentDoc}`;

/**
 * __useEventsQuery__
 *
 * To run a query within a React component, call `useEventsQuery` and pass it any options that fit your needs.
 * When your component renders, `useEventsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEventsQuery({
 *   variables: {
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useEventsQuery(baseOptions?: Apollo.QueryHookOptions<EventsQuery, EventsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EventsQuery, EventsQueryVariables>(EventsDocument, options);
      }
export function useEventsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EventsQuery, EventsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EventsQuery, EventsQueryVariables>(EventsDocument, options);
        }
export type EventsQueryHookResult = ReturnType<typeof useEventsQuery>;
export type EventsLazyQueryHookResult = ReturnType<typeof useEventsLazyQuery>;
export type EventsQueryResult = Apollo.QueryResult<EventsQuery, EventsQueryVariables>;
export const WehbookSettingDocument = gql`
    query wehbookSetting {
  currentUser {
    id
    organizations {
      id
      webhookUrl
    }
  }
}
    `;

/**
 * __useWehbookSettingQuery__
 *
 * To run a query within a React component, call `useWehbookSettingQuery` and pass it any options that fit your needs.
 * When your component renders, `useWehbookSettingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWehbookSettingQuery({
 *   variables: {
 *   },
 * });
 */
export function useWehbookSettingQuery(baseOptions?: Apollo.QueryHookOptions<WehbookSettingQuery, WehbookSettingQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<WehbookSettingQuery, WehbookSettingQueryVariables>(WehbookSettingDocument, options);
      }
export function useWehbookSettingLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<WehbookSettingQuery, WehbookSettingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<WehbookSettingQuery, WehbookSettingQueryVariables>(WehbookSettingDocument, options);
        }
export type WehbookSettingQueryHookResult = ReturnType<typeof useWehbookSettingQuery>;
export type WehbookSettingLazyQueryHookResult = ReturnType<typeof useWehbookSettingLazyQuery>;
export type WehbookSettingQueryResult = Apollo.QueryResult<WehbookSettingQuery, WehbookSettingQueryVariables>;
export const VatRateSettingDocument = gql`
    query vatRateSetting {
  currentUser {
    id
    organizations {
      id
      vatRate
    }
  }
}
    `;

/**
 * __useVatRateSettingQuery__
 *
 * To run a query within a React component, call `useVatRateSettingQuery` and pass it any options that fit your needs.
 * When your component renders, `useVatRateSettingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useVatRateSettingQuery({
 *   variables: {
 *   },
 * });
 */
export function useVatRateSettingQuery(baseOptions?: Apollo.QueryHookOptions<VatRateSettingQuery, VatRateSettingQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<VatRateSettingQuery, VatRateSettingQueryVariables>(VatRateSettingDocument, options);
      }
export function useVatRateSettingLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<VatRateSettingQuery, VatRateSettingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<VatRateSettingQuery, VatRateSettingQueryVariables>(VatRateSettingDocument, options);
        }
export type VatRateSettingQueryHookResult = ReturnType<typeof useVatRateSettingQuery>;
export type VatRateSettingLazyQueryHookResult = ReturnType<typeof useVatRateSettingLazyQuery>;
export type VatRateSettingQueryResult = Apollo.QueryResult<VatRateSettingQuery, VatRateSettingQueryVariables>;