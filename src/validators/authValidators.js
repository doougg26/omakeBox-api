const Joi = require('joi');

const registerSchema = Joi.object({
  nickname: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Nickname deve conter apenas letras e números',
      'string.min': 'Nickname deve ter no mínimo 3 caracteres',
      'string.max': 'Nickname deve ter no máximo 30 caracteres',
      'any.required': 'Nickname é obrigatório',
    }),
  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório',
    }),
  senha: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Senha deve ter no mínimo 6 caracteres',
      'string.max': 'Senha deve ter no máximo 128 caracteres',
      'any.required': 'Senha é obrigatória',
    }),
});

const loginSchema = Joi.object({
  identifier: Joi.string()
    .required()
    .messages({
      'any.required': 'Nickname ou email é obrigatório',
    }),
  senha: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha é obrigatória',
    }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token é obrigatório',
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
};
