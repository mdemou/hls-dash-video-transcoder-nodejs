import config from '../../config/config';
import logger from './../../services/logger.service';
import redisService from './../../services/redis.client.service';

export const initializeServices = async () => {
  if (config.redis.enabled) {
    await redisService.isReady();
    logger.info(__filename, 'isReady', '[REDIS] All Redis clients are ready');
  }
};
