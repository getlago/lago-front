declare type AppEnvEnum = import('./src/globalTypes').AppEnvEnum

declare var APP_ENV: AppEnvEnum
declare var API_URL: string;
declare var APP_VERSION: string;
declare var LAGO_OAUTH_PROXY_URL: string;
declare var LAGO_DISABLE_SIGNUP: string;

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
