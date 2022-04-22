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
};

export enum AggregationTypeEnum {
  CountAgg = 'count_agg',
  MaxAgg = 'max_agg',
  SumAgg = 'sum_agg',
  UniqueCountAgg = 'unique_count_agg'
}

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
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  billableMetric: BillableMetric;
  chargeModel: ChargeModelEnum;
  createdAt: Scalars['ISO8601DateTime'];
  id: Scalars['ID'];
  proRata: Scalars['Boolean'];
  updatedAt: Scalars['ISO8601DateTime'];
  vatRate?: Maybe<Scalars['Float']>;
};

export type ChargeInput = {
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  billableMetricId: Scalars['ID'];
  chargeModel: ChargeModelEnum;
  id?: InputMaybe<Scalars['ID']>;
  proRata: Scalars['Boolean'];
  vatRate?: InputMaybe<Scalars['Float']>;
};

export enum ChargeModelEnum {
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
  vatRate?: InputMaybe<Scalars['Float']>;
};

/** Autogenerated input type of CreateSubscription */
export type CreateSubscriptionInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  customerId: Scalars['ID'];
  planId: Scalars['ID'];
};

export enum CurrencyEnum {
  /** Euro */
  Eur = 'EUR',
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
  zipcode?: Maybe<Scalars['String']>;
};


export type CustomerDetailsSubscriptionsArgs = {
  status?: InputMaybe<Array<StatusTypeEnum>>;
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

export type Invoice = {
  __typename?: 'Invoice';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  createdAt: Scalars['ISO8601DateTime'];
  fromDate: Scalars['ISO8601Date'];
  id: Scalars['ID'];
  issuingDate: Scalars['ISO8601Date'];
  plan?: Maybe<Plan>;
  subscription?: Maybe<Subscription>;
  toDate: Scalars['ISO8601Date'];
  totalAmountCents: Scalars['Int'];
  totalAmountCurrency: CurrencyEnum;
  updatedAt: Scalars['ISO8601DateTime'];
  vatAmountCents: Scalars['Int'];
  vatAmountCurrency: CurrencyEnum;
};

export enum Lago_Api_Error {
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
  /** Creates a new Billable metric */
  createBillableMetric?: Maybe<BillableMetric>;
  /** Creates a new customer */
  createCustomer?: Maybe<Customer>;
  /** Creates a new Plan */
  createPlan?: Maybe<Plan>;
  /** Create a new Subscription */
  createSubscription?: Maybe<Subscription>;
  /** Deletes a Billable metric */
  destroyBillableMetric?: Maybe<DestroyBillableMetricPayload>;
  /** Delete a Customer */
  destroyCustomer?: Maybe<DestroyCustomerPayload>;
  /** Deletes a Plan */
  destroyPlan?: Maybe<DestroyPlanPayload>;
  /** Opens a session for an existing user */
  loginUser?: Maybe<LoginUser>;
  /** Registers a new user and creates related organization */
  registerUser?: Maybe<RegisterUser>;
  /** Terminate a Subscription */
  terminateSubscription?: Maybe<Subscription>;
  /** Updates an existing Billable metric */
  updateBillableMetric?: Maybe<BillableMetric>;
  /** Updates an existing Customer */
  updateCustomer?: Maybe<Customer>;
  /** Updates an existing Plan */
  updatePlan?: Maybe<Plan>;
};


export type MutationCreateBillableMetricArgs = {
  input: CreateBillableMetricInput;
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


export type MutationDestroyBillableMetricArgs = {
  input: DestroyBillableMetricInput;
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


export type MutationTerminateSubscriptionArgs = {
  input: TerminateSubscriptionInput;
};


export type MutationUpdateBillableMetricArgs = {
  input: UpdateBillableMetricInput;
};


export type MutationUpdateCustomerArgs = {
  input: UpdateCustomerInput;
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
  vatRate?: Maybe<Scalars['Float']>;
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
  vatRate?: Maybe<Scalars['Float']>;
};

export enum PlanInterval {
  Monthly = 'monthly',
  Weekly = 'weekly',
  Yearly = 'yearly'
}

export type Query = {
  __typename?: 'Query';
  /** Query a single billable metric of an organization */
  billableMetric?: Maybe<BillableMetricDetail>;
  /** Query billable metrics of an organization */
  billableMetrics: BillableMetricCollection;
  /** Retrives currently connected user */
  currentUser: User;
  /** Query a single customer of an organization */
  customer?: Maybe<CustomerDetails>;
  /** Query customers of an organization */
  customers: CustomerCollection;
  /** Query a single plan of an organization */
  plan?: Maybe<PlanDetails>;
  /** Query plans of an organization */
  plans: PlanCollection;
  token: Scalars['Boolean'];
};


export type QueryBillableMetricArgs = {
  id: Scalars['ID'];
};


export type QueryBillableMetricsArgs = {
  ids?: InputMaybe<Array<Scalars['String']>>;
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
};


export type QueryCustomerArgs = {
  id: Scalars['ID'];
};


export type QueryCustomersArgs = {
  ids?: InputMaybe<Array<Scalars['String']>>;
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
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
  plan: Plan;
  startedAt?: Maybe<Scalars['ISO8601DateTime']>;
  status?: Maybe<StatusTypeEnum>;
  terminatedAt?: Maybe<Scalars['ISO8601DateTime']>;
  updatedAt: Scalars['ISO8601DateTime'];
};

/** Autogenerated input type of TerminateSubscription */
export type TerminateSubscriptionInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
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
  zipcode?: InputMaybe<Scalars['String']>;
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
  vatRate?: InputMaybe<Scalars['Float']>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['ISO8601DateTime'];
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  organizations?: Maybe<Array<Organization>>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export type CurrentOrganizationFragment = { __typename?: 'Organization', id: string, name: string, apiKey: string };

export type CurrentUserFragment = { __typename?: 'User', id: string, email?: string | null, organizations?: Array<{ __typename?: 'Organization', id: string, name: string, apiKey: string }> | null };

export type UserIdentifierQueryVariables = Exact<{ [key: string]: never; }>;


export type UserIdentifierQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, email?: string | null, organizations?: Array<{ __typename?: 'Organization', id: string, name: string, apiKey: string }> | null } };

export type BillableMetricItemFragment = { __typename?: 'BillableMetric', id: string, name: string, code: string, createdAt: any, canBeDeleted: boolean };

export type DeleteBillableMetricDialogFragment = { __typename?: 'BillableMetric', id: string, name: string };

export type DeleteBillableMetricMutationVariables = Exact<{
  input: DestroyBillableMetricInput;
}>;


export type DeleteBillableMetricMutation = { __typename?: 'Mutation', destroyBillableMetric?: { __typename?: 'DestroyBillableMetricPayload', id?: string | null } | null };

export type AddCustomerDialogFragment = { __typename?: 'Customer', id: string, name?: string | null, customerId: string, canBeDeleted: boolean };

export type AddCustomerDialogDetailFragment = { __typename?: 'CustomerDetails', id: string, name?: string | null, customerId: string, canBeDeleted: boolean };

export type CreateCustomerMutationVariables = Exact<{
  input: CreateCustomerInput;
}>;


export type CreateCustomerMutation = { __typename?: 'Mutation', createCustomer?: { __typename?: 'Customer', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, createdAt: any, subscriptions?: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, plan: { __typename?: 'Plan', id: string, name: string } }> | null } | null };

export type UpdateCustomerMutationVariables = Exact<{
  input: UpdateCustomerInput;
}>;


export type UpdateCustomerMutation = { __typename?: 'Mutation', updateCustomer?: { __typename?: 'Customer', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, createdAt: any, subscriptions?: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, plan: { __typename?: 'Plan', id: string, name: string } }> | null } | null };

export type GetPlansQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type GetPlansQuery = { __typename?: 'Query', plans: { __typename?: 'PlanCollection', collection: Array<{ __typename?: 'Plan', id: string, name: string, code: string }> } };

export type CreateSubscriptionMutationVariables = Exact<{
  input: CreateSubscriptionInput;
}>;


export type CreateSubscriptionMutation = { __typename?: 'Mutation', createSubscription?: { __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, startedAt?: any | null, plan: { __typename?: 'Plan', id: string, name: string, code: string } } | null };

export type CustomerInvoiceListFragment = { __typename?: 'Invoice', id: string, issuingDate: any, amountCents: number, amountCurrency: CurrencyEnum, plan?: { __typename?: 'Plan', id: string, name: string } | null };

export type CustomerItemFragment = { __typename?: 'Customer', id: string, name?: string | null, customerId: string, createdAt: any, canBeDeleted: boolean, subscriptions?: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, plan: { __typename?: 'Plan', id: string, name: string } }> | null };

export type CustomerSubscriptionListFragment = { __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, startedAt?: any | null, plan: { __typename?: 'Plan', id: string, name: string, code: string } };

export type DeleteCustomerDialogFragment = { __typename?: 'Customer', id: string, name?: string | null };

export type DeleteCustomerMutationVariables = Exact<{
  input: DestroyCustomerInput;
}>;


export type DeleteCustomerMutation = { __typename?: 'Mutation', destroyCustomer?: { __typename?: 'DestroyCustomerPayload', id?: string | null } | null };

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

export type EditBillableMetricFragment = { __typename?: 'BillableMetricDetail', id: string, name: string, code: string, description?: string | null, aggregationType: AggregationTypeEnum, canBeDeleted: boolean };

export type GetSingleBillableMetricQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSingleBillableMetricQuery = { __typename?: 'Query', billableMetric?: { __typename?: 'BillableMetricDetail', id: string, name: string, code: string, description?: string | null, aggregationType: AggregationTypeEnum, canBeDeleted: boolean } | null };

export type CreateBillableMetricMutationVariables = Exact<{
  input: CreateBillableMetricInput;
}>;


export type CreateBillableMetricMutation = { __typename?: 'Mutation', createBillableMetric?: { __typename?: 'BillableMetric', id: string } | null };

export type UpdateBillableMetricMutationVariables = Exact<{
  input: UpdateBillableMetricInput;
}>;


export type UpdateBillableMetricMutation = { __typename?: 'Mutation', updateBillableMetric?: { __typename?: 'BillableMetric', id: string, name: string, code: string, createdAt: any, canBeDeleted: boolean } | null };

export type EditPlanFragment = { __typename?: 'PlanDetails', id: string, name: string, code: string, description?: string | null, interval: PlanInterval, payInAdvance: boolean, amountCents: number, amountCurrency: CurrencyEnum, vatRate?: number | null, trialPeriod?: number | null, canBeDeleted: boolean, charges?: Array<{ __typename?: 'Charge', id: string, amountCents: number, amountCurrency: CurrencyEnum, chargeModel: ChargeModelEnum, proRata: boolean, vatRate?: number | null, billableMetric: { __typename?: 'BillableMetric', id: string, name: string, code: string } }> | null };

export type GetSinglePlanQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSinglePlanQuery = { __typename?: 'Query', plan?: { __typename?: 'PlanDetails', id: string, name: string, code: string, description?: string | null, interval: PlanInterval, payInAdvance: boolean, amountCents: number, amountCurrency: CurrencyEnum, vatRate?: number | null, trialPeriod?: number | null, canBeDeleted: boolean, charges?: Array<{ __typename?: 'Charge', id: string, amountCents: number, amountCurrency: CurrencyEnum, chargeModel: ChargeModelEnum, proRata: boolean, vatRate?: number | null, billableMetric: { __typename?: 'BillableMetric', id: string, name: string, code: string } }> | null } | null };

export type CreatePlanMutationVariables = Exact<{
  input: CreatePlanInput;
}>;


export type CreatePlanMutation = { __typename?: 'Mutation', createPlan?: { __typename?: 'Plan', id: string } | null };

export type UpdatePlanMutationVariables = Exact<{
  input: UpdatePlanInput;
}>;


export type UpdatePlanMutation = { __typename?: 'Mutation', updatePlan?: { __typename?: 'Plan', id: string, name: string, code: string, chargeCount: number, customerCount: number, createdAt: any, canBeDeleted: boolean } | null };

export type BillableMetricsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type BillableMetricsQuery = { __typename?: 'Query', billableMetrics: { __typename?: 'BillableMetricCollection', collection: Array<{ __typename?: 'BillableMetric', id: string, name: string, code: string, createdAt: any, canBeDeleted: boolean }> } };

export type CustomerDetailsFragment = { __typename?: 'CustomerDetails', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, subscriptions: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, startedAt?: any | null, plan: { __typename?: 'Plan', id: string, name: string, code: string } }>, invoices?: Array<{ __typename?: 'Invoice', id: string, issuingDate: any, amountCents: number, amountCurrency: CurrencyEnum, plan?: { __typename?: 'Plan', id: string, name: string } | null }> | null };

export type GetCustomerQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetCustomerQuery = { __typename?: 'Query', customer?: { __typename?: 'CustomerDetails', id: string, name?: string | null, customerId: string, canBeDeleted: boolean, subscriptions: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, startedAt?: any | null, plan: { __typename?: 'Plan', id: string, name: string, code: string } }>, invoices?: Array<{ __typename?: 'Invoice', id: string, issuingDate: any, amountCents: number, amountCurrency: CurrencyEnum, plan?: { __typename?: 'Plan', id: string, name: string } | null }> | null } | null };

export type CustomersQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type CustomersQuery = { __typename?: 'Query', customers: { __typename?: 'CustomerCollection', collection: Array<{ __typename?: 'Customer', id: string, name?: string | null, customerId: string, createdAt: any, canBeDeleted: boolean, subscriptions?: Array<{ __typename?: 'Subscription', id: string, status?: StatusTypeEnum | null, plan: { __typename?: 'Plan', id: string, name: string } }> | null }> } };

export type PlansQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type PlansQuery = { __typename?: 'Query', plans: { __typename?: 'PlanCollection', collection: Array<{ __typename?: 'Plan', id: string, name: string, code: string, chargeCount: number, customerCount: number, createdAt: any, canBeDeleted: boolean }> } };

export type LoginUserMutationVariables = Exact<{
  input: LoginUserInput;
}>;


export type LoginUserMutation = { __typename?: 'Mutation', loginUser?: { __typename?: 'LoginUser', token: string, user: { __typename?: 'User', id: string, email?: string | null, organizations?: Array<{ __typename?: 'Organization', id: string, name: string, apiKey: string }> | null } } | null };

export type SignupMutationVariables = Exact<{
  input: RegisterUserInput;
}>;


export type SignupMutation = { __typename?: 'Mutation', registerUser?: { __typename?: 'RegisterUser', token: string, user: { __typename?: 'User', id: string, email?: string | null, organizations?: Array<{ __typename?: 'Organization', id: string, name: string, apiKey: string }> | null }, organization: { __typename?: 'Organization', id: string, name: string } } | null };

export const CurrentOrganizationFragmentDoc = gql`
    fragment CurrentOrganization on Organization {
  id
  name
  apiKey
}
    `;
export const CurrentUserFragmentDoc = gql`
    fragment CurrentUser on User {
  id
  email
  organizations {
    ...CurrentOrganization
  }
}
    ${CurrentOrganizationFragmentDoc}`;
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
export const AddCustomerDialogFragmentDoc = gql`
    fragment AddCustomerDialog on Customer {
  id
  name
  customerId
  canBeDeleted
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
export const EditBillableMetricFragmentDoc = gql`
    fragment EditBillableMetric on BillableMetricDetail {
  id
  name
  code
  description
  aggregationType
  canBeDeleted
}
    `;
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
  vatRate
  trialPeriod
  canBeDeleted
  charges {
    id
    billableMetric {
      id
      name
      code
    }
    amountCents
    amountCurrency
    chargeModel
    proRata
    vatRate
  }
}
    `;
export const CustomerSubscriptionListFragmentDoc = gql`
    fragment CustomerSubscriptionList on Subscription {
  id
  status
  startedAt
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
  amountCents
  amountCurrency
  plan {
    id
    name
  }
}
    `;
export const AddCustomerDialogDetailFragmentDoc = gql`
    fragment AddCustomerDialogDetail on CustomerDetails {
  id
  name
  customerId
  canBeDeleted
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
  ...AddCustomerDialogDetail
}
    ${CustomerSubscriptionListFragmentDoc}
${CustomerInvoiceListFragmentDoc}
${AddCustomerDialogDetailFragmentDoc}`;
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
export const BillableMetricsDocument = gql`
    query billableMetrics($page: Int, $limit: Int) {
  billableMetrics(page: $page, limit: $limit) {
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