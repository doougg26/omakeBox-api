const Joi = require('joi');

const setFavoriteAnimeSchema = Joi.object({
  malId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do anime deve ser um número',
      'any.required': 'malId é obrigatório',
    }),
});

const setAvatarSchema = Joi.object({
  characterMalId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do personagem deve ser um número',
      'any.required': 'characterMalId é obrigatório',
    }),
});

const rateAnimeSchema = Joi.object({
  nota: Joi.number()
    .min(0)
    .max(10)
    .integer()
    .required()
    .messages({
      'number.min': 'Nota mínima é 0',
      'number.max': 'Nota máxima é 10',
      'any.required': 'nota é obrigatória',
    }),
});

const reviewSchema = Joi.object({
  texto: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.min': 'Texto da impressão é obrigatório',
      'string.max': 'Texto deve ter no máximo 500 caracteres',
      'any.required': 'texto é obrigatório',
    }),
});

module.exports = {
  setFavoriteAnimeSchema,
  setAvatarSchema,
  rateAnimeSchema,
  reviewSchema,
};
