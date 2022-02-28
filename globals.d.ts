declare var APP_ENV: "production" | "staging" | "development";
declare var IS_PROD_ENV: boolean;
declare var API_URL: string;
declare var APP_VERSION: string;

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
