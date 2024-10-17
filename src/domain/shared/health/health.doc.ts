import Joi from 'joi';

const healthDocs = {
  liveness: {
    responses: {
      200: {
        description: 'Liveness is working',
        schema: Joi.object({
          statusCode: Joi.number().example(200),
          code: Joi.string().example('HLTH2001'),
          message: Joi.string().example('Liveness successfully!'),
        }).label('liveness'),
      },
    },
  },
  readiness: {
    responses: {
      200: {
        description: 'Readiness is working',
        schema: Joi.object({
          statusCode: Joi.number().example(200),
          code: Joi.string().example('HLTH2002'),
          message: Joi.string().example('Readiness successfully!'),
        }).label('readiness'),
      },
      503: {
        description: 'Readiness is unavailable',
        schema: Joi.object({
          statusCode: Joi.number().example(503),
          code: Joi.string().example('GRR50X'),
          message: Joi.string().example('Impossible get readiness'),
        }).label('readiness'),
      },
    },
  },
};

export default healthDocs;
