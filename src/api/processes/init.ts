import config from '../../config/config';
import redisService from './../../services/redis.client.service';

export const initializeServices = async () => {
  if (config.redis.enabled) {
    await redisService.isReady();
  }
};
