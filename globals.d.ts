declare var APP_ENV: "production" | "staging" | "development" | "qa";
declare var IS_PROD_ENV: boolean;
declare var IS_QA_ENV: boolean;
declare var IS_DEV_ENV: boolean;
declare var API_URL: string;
declare var APP_VERSION: string;
declare var LAGO_SIGNUP_DISABLED: boolean;

declare module "*.svg" {
  const content: any;
  export default content;
}
declare module "*.png" {
  const value: any;
  export default value;
}

declare module "*.jpg" {
  const value: any;
  export default value;
}

declare module "*.jpeg" {
  const value: any;
  export default value;
}
