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

export enum BillingPeriodEnum {
  BeginningOfMonth = 'beginning_of_month',
  EndOfMonth = 'end_of_month',
  SubscruptionDate = 'subscruption_date'
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
  organizationId: Scalars['String'];
};

/** Autogenerated input type of CreatePlan */
export type CreatePlanInput = {
  amountCents: Scalars['Int'];
  amountCurrency: CurrencyEnum;
  billableMetricIds: Array<Scalars['String']>;
  billingPeriod: BillingPeriodEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  frequency: FrequencyEnum;
  name: Scalars['String'];
  organizationId: Scalars['String'];
  proRata: Scalars['Boolean'];
  trialPeriod?: InputMaybe<Scalars['Float']>;
  vatRate?: InputMaybe<Scalars['Float']>;
};

export enum CurrencyEnum {
  /** Euro */
  Eur = 'EUR',
  /** American dolar */
  Usd = 'USD'
}

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
  Monthly = 'monthly',
  Weekly = 'weekly',
  Yearly = 'yearly'
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
  createBillableMetric?: Maybe<BillableMetric>;
  /** Creates a new plan */
  createPlan?: Maybe<Plan>;
  destroyBillableMetric?: Maybe<DestroyBillableMetricPayload>;
  destroyPlan?: Maybe<DestroyPlanPayload>;
  loginUser?: Maybe<LoginUser>;
  registerUser?: Maybe<RegisterUser>;
  updateBillableMetric?: Maybe<BillableMetric>;
  updatePlan?: Maybe<Plan>;
};


export type MutationCreateBillableMetricArgs = {
  input: CreateBillableMetricInput;
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
  billableMetrics?: Maybe<Array<BillableMetric>>;
  billingPeriod: BillingPeriodEnum;
  code: Scalars['String'];
  createdAt: Scalars['ISO8601DateTime'];
  description?: Maybe<Scalars['String']>;
  frequency: FrequencyEnum;
  id: Scalars['ID'];
  name: Scalars['String'];
  organization?: Maybe<Organization>;
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

export type Query = {
  __typename?: 'Query';
  /** Query billable metrics of an organization */
  billableMetrics: BillableMetricCollection;
  currentUser: User;
  /** Query plans of an organization */
  plans: PlanCollection;
  token: Scalars['Boolean'];
};


export type QueryBillableMetricsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  page?: InputMaybe<Scalars['Int']>;
};


export type QueryPlansArgs = {
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
  billableMetricIds: Array<Scalars['String']>;
  billingPeriod: BillingPeriodEnum;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']>;
  code: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  frequency: FrequencyEnum;
  id: Scalars['String'];
  name: Scalars['String'];
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

export type BillableMetricsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type BillableMetricsQuery = { __typename?: 'Query', billableMetrics: { __typename?: 'BillableMetricCollection', collection: Array<{ __typename?: 'BillableMetric', id: string, name: string, code: string, createdAt: any }> } };

export type CreateBillableMetricMutationVariables = Exact<{
  input: CreateBillableMetricInput;
}>;


export type CreateBillableMetricMutation = { __typename?: 'Mutation', createBillableMetric?: { __typename?: 'BillableMetric', id: string } | null };

export type LoginUserMutationVariables = Exact<{
  input: LoginUserInput;
}>;


export type LoginUserMutation = { __typename?: 'Mutation', loginUser?: { __typename?: 'LoginUser', token: string, user: { __typename?: 'User', id: string } } | null };

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
export const LoginUserDocument = gql`
    mutation loginUser($input: LoginUserInput!) {
  loginUser(input: $input) {
    user {
      id
    }
    token
  }
}
    `;
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