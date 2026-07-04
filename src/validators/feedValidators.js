const Joi = require('joi');

const createPostSchema = Joi.object({
  animeMalId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do anime deve ser um número',
      'any.required': 'animeMalId é obrigatório',
    }),
  texto: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Texto do post é obrigatório',
      'string.max': 'Texto deve ter no máximo 2000 caracteres',
      'any.required': 'Texto é obrigatório',
    }),
  marcado_como_spoiler: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'marcado_como_spoiler deve ser true ou false',
    }),
});

const createCommentSchema = Joi.object({
  texto: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Texto do comentário é obrigatório',
      'string.max': 'Texto deve ter no máximo 1000 caracteres',
      'any.required': 'Texto é obrigatório',
    }),
});

module.exports = {
  createPostSchema,
  createCommentSchema,
};
