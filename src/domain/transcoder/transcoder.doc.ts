import Joi from 'joi';
import transcoderResponses from '../../domain/transcoder/transcoder.responses';
import responsesService from '../../services/responses/responses.service';
import requestDataSchema from './../../api/schemas/transcoder.request';

const transcoderDocs = {
  go: {
    responses: {
      201: {
        description: 'Creating transcoding process',
        schema: Joi.object({
          statusCode: Joi.number().example(201),
          code: Joi.string().example('TRNS2011'),
          message: Joi.string().example('Transcoding process created successfully'),
        }).label('created'),
      },
      400: {
        description: 'BadRequest',
        schema: Joi.object({
          statusCode: Joi.number().example(400),
          error: Joi.string().example('TRNS4001'),
          message: Joi.string().example('"inputFilePath" is required"'),
        }).label('badRequest'),
      },
    },
    parameters: {
      payload: requestDataSchema,
      headers: Joi.object({}).unknown(),
      failAction: async (request, h, error) => {
        const response = responsesService.createResponseData(
          transcoderResponses.badRequest(
            error.output.statusCode,
            error.output.payload.message,
          ),
        );
        return h.response(response.body).code(response.statusCode).takeover();
      },
    },
  },
};

export default transcoderDocs;
