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
  /** An ISO 8601-encoded datetime */
  ISO8601DateTime: any;
};

export enum AggregationTypeEnum {
  CountAgg = 'count_agg',
  MaxCountAgg = 'max_count_agg',
  SumAgg = 'sum_agg',
  UniqueCountAgg = 'unique_count_agg'
}

export type BillableMetric = {
  __typename?: 'BillableMetric';
  aggregationType: AggregationTypeEnum;
  code: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  description?: Maybe<Scalars['String']>;
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

export type Charge = {
  __typename?: 'Charge';
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  billableMetric: BillableMetric;
  chargeModel: ChargeModelEnum;
  createdAt: Scalars['ISO8601DateTime'];
  frequency: ChargeFrequency;
  id: Scalars['ID'];
  proRata: Scalars['Boolean'];
  updatedAt: Scalars['ISO8601DateTime'];
  vatRate?: Maybe<Scalars['Float']>;
};

export enum ChargeFrequency {
  OneTime = 'one_time',
  Recurring = 'recurring'
}

export type ChargeInput = {
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  billableMetricId: Scalars['ID'];
  chargeModel: ChargeModelEnum;
  frequency: ChargeFrequency;
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

/** Autogenerated input type of CreateBillableMetric */
export type CreateBillableMetricInput = {
  aggregationType: AggregationTypeEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description: Scalars['String'];
  name: Scalars['String'];
};

/** Autogenerated input type of CreateCustomer */
export type CreateCustomerInput = {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  customerId: Scalars['String'];
  name: Scalars['String'];
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
  frequency: FrequencyEnum;
  interval: PlanInterval;
  name: Scalars['String'];
  payInAdvance: Scalars['Boolean'];
  proRata: Scalars['Boolean'];
  trialPeriod?: InputMaybe<Scalars['Float']>;
  vatRate?: InputMaybe<Scalars['Float']>;
};

export enum CurrencyEnum {
  /** Euro */
  Eur = 'EUR',
  /** American Dollar */
  Usd = 'USD'
}

export type Customer = {
  __typename?: 'Customer';
  createdAt: Scalars['ISO8601DateTime'];
  customerId: Scalars['String'];
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  subscriptions?: Maybe<Array<Subscription>>;
  updatedAt: Scalars['ISO8601DateTime'];
};

export type CustomerCollection = {
  __typename?: 'CustomerCollection';
  collection: Array<Customer>;
  metadata: CollectionMetadata;
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

export enum FrequencyEnum {
  BeginningOfPeriod = 'beginning_of_period',
  SubscriptionDate = 'subscription_date'
}

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
  /** Deletes a Billable metric */
  destroyBillableMetric?: Maybe<DestroyBillableMetricPayload>;
  /** Deletes a Plan */
  destroyPlan?: Maybe<DestroyPlanPayload>;
  /** Opens a session for an existing user */
  loginUser?: Maybe<LoginUser>;
  /** Registers a new user and creates related organization */
  registerUser?: Maybe<RegisterUser>;
  /** Updates an existing Billable metric */
  updateBillableMetric?: Maybe<BillableMetric>;
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


export type MutationDestroyBillableMetricArgs = {
  input: DestroyBillableMetricInput;
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


export type MutationUpdateBillableMetricArgs = {
  input: UpdateBillableMetricInput;
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
  /** Number of charges attached to a plan */
  chargeCount: Scalars['Int'];
  charges?: Maybe<Array<Charge>>;
  code: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  /** Number of customers attached to a plan */
  customerCount: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  frequency: FrequencyEnum;
  id: Scalars['ID'];
  interval: PlanInterval;
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  payInAdvance: Scalars['Boolean'];
  proRata: Scalars['Boolean'];
  trialPeriod?: Maybe<Scalars['Float']>;
  updatedAt: Scalars['ISO8601DateTime'];
  vatRate?: Maybe<Scalars['Float']>;
};

export type PlanCollection = {
  __typename?: 'PlanCollection';
  collection: Array<Plan>;
  metadata: CollectionMetadata;
};

export enum PlanInterval {
  Monthly = 'monthly',
  Weekly = 'weekly',
  Yearly = 'yearly'
}

export type Query = {
  __typename?: 'Query';
  /** Query billable metrics of an organization */
  billableMetrics: BillableMetricCollection;
  /** Retrives currently connected user */
  currentUser: User;
  /** Query customers of an organization */
  customers: CustomerCollection;
  /** Query plans of an organization */
  plans: PlanCollection;
  token: Scalars['Boolean'];
};


export type QueryBillableMetricsArgs = {
  ids?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
};


export type QueryCustomersArgs = {
  ids?: InputMaybe<Array<Scalars['String']>>;
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
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
  canceledAt?: Maybe<Scalars['ISO8601DateTime']>;
  createdAt: Scalars['ISO8601DateTime'];
  id: Scalars['ID'];
  plan: Array<Plan>;
  startedAt?: Maybe<Scalars['ISO8601DateTime']>;
  status?: Maybe<StatusTypeEnum>;
  terminatedAt?: Maybe<Scalars['ISO8601DateTime']>;
  updatedAt: Scalars['ISO8601DateTime'];
};

/** Autogenerated input type of UpdateBillableMetric */
export type UpdateBillableMetricInput = {
  aggregationType: AggregationTypeEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description: Scalars['String'];
  id: Scalars['String'];
  name: Scalars['String'];
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
  frequency: FrequencyEnum;
  id: Scalars['String'];
  interval: PlanInterval;
  name: Scalars['String'];
  payInAdvance: Scalars['Boolean'];
  proRata: Scalars['Boolean'];
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

export type BillableMetricForPlanFragment = { __typename?: 'BillableMetric', id: string, name: string, code: string };

export type GetbillableMetricsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type GetbillableMetricsQuery = { __typename?: 'Query', billableMetrics: { __typename?: 'BillableMetricCollection', collection: Array<{ __typename?: 'BillableMetric', id: string, name: string, code: string }> } };

export type BillableMetricsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type BillableMetricsQuery = { __typename?: 'Query', billableMetrics: { __typename?: 'BillableMetricCollection', collection: Array<{ __typename?: 'BillableMetric', id: string, name: string, code: string, createdAt: any }> } };

export type CreateBillableMetricMutationVariables = Exact<{
  input: CreateBillableMetricInput;
}>;


export type CreateBillableMetricMutation = { __typename?: 'Mutation', createBillableMetric?: { __typename?: 'BillableMetric', id: string } | null };

export type CreatePlanMutationVariables = Exact<{
  input: CreatePlanInput;
}>;


export type CreatePlanMutation = { __typename?: 'Mutation', createPlan?: { __typename?: 'Plan', id: string } | null };

export type PlansQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type PlansQuery = { __typename?: 'Query', plans: { __typename?: 'PlanCollection', collection: Array<{ __typename?: 'Plan', id: string, name: string, code: string, chargeCount: number, customerCount: number, createdAt: any }> } };

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
export const BillableMetricForPlanFragmentDoc = gql`
    fragment billableMetricForPlan on BillableMetric {
  id
  name
  code
}
    `;
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
export const BillableMetricsDocument = gql`
    query billableMetrics($page: Int, $limit: Int) {
  billableMetrics(page: $page, limit: $limit) {
    collection {
      id
      name
      code
      createdAt
    }
  }
}
    `;

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
export const PlansDocument = gql`
    query plans($page: Int, $limit: Int) {
  plans(page: $page, limit: $limit) {
    collection {
      id
      name
      code
      chargeCount
      customerCount
      createdAt
    }
  }
}
    `;

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