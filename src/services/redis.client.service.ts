import Redis from 'ioredis';
import requestDataSchema from '../api/schemas/transcoder.request';
import config from '../config/config';
import transcoderService from '../domain/transcoder/transcoder.service';
import logger from './logger.service';
import delayService from './delay.service';

const redisClient = new Redis({
  host: config.redis.host,
  port: Number(config.redis.port),
  password: config.redis.password,
  db: Number(config.redis.db),
});

function validateJobRequest(job: any) {
  const { error } = requestDataSchema.validate(job);
  if (error) {
    logger.error(__filename, 'validateJobRequest', 'error', error.message);
    throw Error(error.message);
  }
}

const redisService = {
  publish: async (job: any): Promise<void> => {
    try {
      await redisClient.lpush(config.redis.mainQueue, JSON.stringify(job));
      logger.info(
        __filename,
        'publish',
        `[REDIS] Message published to ${config.redis.mainQueue}: ${JSON.stringify(job)}`,
      );
    } catch (error) {
      logger.error(__filename, 'publish', `[REDIS] Failed to publish message to ${config.redis.mainQueue}`, error);
    }
  },

  processQueue: async (): Promise<void> => {
    try {
      while (true) {
        logger.debug(__filename, 'processQueue', `[REDIS] Listening ${config.redis.mainQueue} queue`);
        const jobData = await redisClient.brpop(config.redis.mainQueue, 0);
        if (jobData) {
          try {
            const job = JSON.parse(jobData[1]);
            validateJobRequest(job);
            logger.info(__filename, 'processQueue', `[REDIS] Processing job: ${JSON.stringify(job)}`);
            await transcoderService.go(job);
            logger.debug(__filename, 'processQueue', `[REDIS] Job processed successfully: ${JSON.stringify(job)}`);
          } catch (error) {
            logger.error(__filename, 'processQueue', `[REDIS] Error processing job: ${error}`);
            await redisClient.lpush(config.redis.deadLetterQueue, JSON.stringify({
              datePushed: new Date(),
              job: jobData[1],
              message: error.message,
            }));
          }
        }
      }
    } catch (error) {
      logger.error(__filename, 'processQueue', 'Error while processing queue', error);
    }
  },

  isReady: async (retries = 5, delay = 1000): Promise<void> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      if (redisClient?.status !== 'ready') {
        logger.warn(__filename, 'isReady', `[REDIS] Attempt ${attempt}: Redis is not ready. Retrying in ${delay}ms...`);
        await delayService.wait(delay);
      }
    }
  },
};

const setupRedisListeners = () => {
  redisClient.on('connect', () => {
    logger.info(__filename, 'create', '[REDIS] Successfully connected');
  });

  redisClient.on('ready', async () => {
    logger.info(__filename, 'create', '[REDIS] Ready');
    await redisService.processQueue();
  });

  redisClient.on('error', (error) => {
    logger.error(__filename, 'create', `[REDIS] Connection error: ${error.message}`);
  });
};

setupRedisListeners();

export default redisService;
