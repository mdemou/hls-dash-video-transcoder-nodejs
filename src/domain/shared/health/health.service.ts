import Boom from '@hapi/boom';
import redisService from './../../../services/redis.client.service';
import healthErrors from './health.errors';

const healthService = {
  checkReadiness: async (): Promise<void> => {
    try {
      // logger.info(__filename, 'checkReadiness', 'checking readiness');
      await redisService.isReady();
    } catch (error) {
      throw Boom.serverUnavailable(
        healthErrors.serverUnavailable.message,
        { code: healthErrors.serverUnavailable.code },
      );
    }
  },
};

export default healthService;
