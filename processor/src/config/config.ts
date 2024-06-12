export const config = {
  // Required by Payment SDK
  projectKey: process.env.CTP_PROJECT_KEY || 'payment-integration',
  clientId: process.env.CTP_CLIENT_ID || 'xxx',
  clientSecret: process.env.CTP_CLIENT_SECRET || 'xxx',
  jwksUrl: process.env.CTP_JWKS_URL || 'https://mc-api.europe-west1.gcp.commercetools.com/.well-known/jwks.json',
  jwtIssuer: process.env.CTP_JWT_ISSUER || 'https://mc-api.europe-west1.gcp.commercetools.com',
  authUrl: process.env.CTP_AUTH_URL || 'https://auth.europe-west1.gcp.commercetools.com',
  apiUrl: process.env.CTP_API_URL || 'https://api.europe-west1.gcp.commercetools.com',
  sessionUrl: process.env.CTP_SESSION_URL || 'https://session.europe-west1.gcp.commercetools.com/',
  healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),

  // Required by logger
  loggerLevel: process.env.LOGGER_LEVEL || 'info',

  // Update with specific payment providers config
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'stripeSecretKey',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeCaptureMethod: process.env.STRIPE_CAPTURE_METHOD || 'automatic',
  mockEnvironment: process.env.MOCK_ENVIRONMENT || 'TEST',
  stripePaymentElementAppearance: process.env.STRIPE_APPEARANCE_PAYMENT_ELEMENT,
  stripeExpressCheckoutAppearance: process.env.STRIPE_APPEARANCE_EXPRESS_CHECKOUT,

  // Payment Providers config
  returnUrl: process.env.RETURN_URL,

  // TODO review these configurations
  // supportedUIElements: convertStringCommaSeparatedValuesToArray(process.env.SUPPORTED_UI_ELEMENTS),
  // enableStoreDetails: process.env.ENABLE_STORE_DETAILS === 'true' ? true : false,
  // sellerReturnUrl: process.env.SELLER_RETURN_URL || ''
};

export const getConfig = () => {
  return config;
};
