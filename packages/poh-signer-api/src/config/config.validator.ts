import Joi from 'joi';

export const configValidator = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development')
    .required(),
  PORT: Joi.number().default(3000).required(),
  VERIFIER_CONTRACT_ADDRESS: Joi.string().required(),
  POH_API_URL: Joi.string().required(),
  WEB3SIGNER_BASE_URL: Joi.string().required(),
  WEB3SIGNER_PUBLIC_KEY: Joi.string().required(),
  WEB3SIGNER_KEYSTORE_PATH: Joi.string().when('NODE_ENV', {
    is: 'development',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  WEB3SIGNER_KEYSTORE_PASSPHRASE: Joi.string().when('NODE_ENV', {
    is: 'development',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  WEB3SIGNER_TRUSTED_STORE_PATH: Joi.string().when('NODE_ENV', {
    is: 'development',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  WEB3SIGNER_TRUSTED_STORE_PASSPHRASE: Joi.string().when('NODE_ENV', {
    is: 'development',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error', 'fatal')
    .default('info'),
  CHAIN_ID: Joi.number(),
});
