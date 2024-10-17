import { Request, ResponseToolkit } from '@hapi/hapi';
import transcoderResponses from '../../domain/transcoder/transcoder.responses';
import transcoderService from '../../domain/transcoder/transcoder.service';
import logger from '../../services/logger.service';
import { IResponseData } from '../../services/responses/responses.interfaces';
import responsesService from '../../services/responses/responses.service';
import { ITranscoderCreate } from './../../domain/transcoder/transcoder.interface';

const transcoderController = {
  async go(request: Request, h: ResponseToolkit) {
    let response: IResponseData;
    try {
      transcoderService.go(<ITranscoderCreate>request.payload); // no await to avoid waiting until transcode is finished
      response = responsesService.createResponseData(
        transcoderResponses.ok,
      );
    } catch (error) {
      logger.error(__filename, 'create', 'error', error);
      response = responsesService.createGeneralError(error);
    }
    return h.response(response.body).code(response.statusCode);
  },
};

export default transcoderController;
