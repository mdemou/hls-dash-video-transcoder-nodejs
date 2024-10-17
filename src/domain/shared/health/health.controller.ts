import { Request, ResponseToolkit } from '@hapi/hapi';
import healthResponses from './health.responses';
import { IResponseData } from '../../../services/responses/responses.interfaces';
import responsesService from '../../../services/responses/responses.service';
import healthService from './health.service';
import logger from '../../../services/logger.service';

const healthController = {
  liveness(request: Request, h: ResponseToolkit) {
    const response: IResponseData = responsesService.createResponseData(
      healthResponses.livenessOk,
    );
    return h.response(response.body).code(response.statusCode);
  },

  async readiness(request: Request, h: ResponseToolkit) {
    let response: IResponseData;
    try {
      await healthService.checkReadiness();
      response = responsesService.createResponseData(
        healthResponses.readinessOk,
      );
    } catch (error) {
      logger.error(__filename, 'readiness', 'error', error);
      response = responsesService.createGeneralError(error);
    }
    return h.response(response.body).code(response.statusCode);
  },

};

export default healthController;
