import Joi from 'joi';

export const configValidator = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development')
    .required(),
  PORT: Joi.number().default(3000).required(),
  SIGNER_PRIVATE_KEY: Joi.string().required(),
  VERIFIER_CONTRACT_ADDRESS: Joi.string().required(),
  POH_API_URL: Joi.string().required(),
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error', 'fatal')
    .default('info'),
});
