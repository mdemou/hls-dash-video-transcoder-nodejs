import Redis from 'ioredis';
import requestDataSchema from '../api/schemas/transcoder.request';
import config from '../config/config';
import transcoderService from '../domain/transcoder/transcoder.service';
import delayService from './delay.service';
import logger from './logger.service';

interface IClientConfig {
  redisClient: Redis;
  name: string;
}

const clientsConfig: IClientConfig[] = [
  { 
    redisClient: new Redis(
      {
        host: config.redis.host,
        port: Number(config.redis.port),
        password: config.redis.password,
        db: Number(config.redis.db),
      },
    ),
    name: config.redis.listenerClientName,
  },
  // { 
  //   redisClient: new Redis(
  //     {
  //       host: config.redis.host,
  //       port: Number(config.redis.port),
  //       password: config.redis.password,
  //       db: Number(config.redis.db),
  //     },
  //   ),
  //   name: config.redis.publisherClientName,
  // },
];

function validateJobRequest(job: any) {
  const { error } = requestDataSchema.validate(job);
  if (error) {
    logger.error(__filename, 'validateJobRequest', 'error', error.message);
    throw Error(error.message);
  }
}

const redisService = {
  // publish: async (job: any): Promise<void> => {
  //   try {
  //     const redisClientPublisher: Redis = 
  //       clientsConfig.find(configperico => configperico.name === config.redis.publisherClientName).redisClient;
  //     await redisClientPublisher.lpush(config.redis.mainQueue, JSON.stringify(job));
  //     logger.info(
  //       __filename,
  //       'publish',
  //       `[REDIS] Message published to ${config.redis.mainQueue}: ${JSON.stringify(job)}`,
  //     );
  //   } catch (error) {
  //     logger.error(__filename, 'publish', `[REDIS] Failed to publish message to ${config.redis.mainQueue}`, error);
  //   }
  // },

  processQueue: async (redisClientListener: Redis): Promise<void> => {
    try {
      while (true) {
        logger.debug(__filename, 'processQueue', `[REDIS] Listening ${config.redis.mainQueue} queue`);
        const jobData = await redisClientListener.brpop(config.redis.mainQueue, 0);
        if (jobData) {
          try {
            const job = JSON.parse(jobData[1]);
            validateJobRequest(job);
            logger.info(__filename, 'processQueue', `[REDIS] Processing job: ${JSON.stringify(job)}`);
            await transcoderService.go(job);
            logger.debug(__filename, 'processQueue', `[REDIS] Job processed successfully: ${JSON.stringify(job)}`);
          } catch (error) {
            logger.error(__filename, 'processQueue', `[REDIS] Error processing job: ${error}`);
            await redisClientListener.lpush(config.redis.deadLetterQueue, JSON.stringify({
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

  isReady: async (retries = 10, delay = 2000): Promise<void> => {
    // const clients = [config.redis.listenerClientName, config.redis.publisherClientName].map(name => 
    //   clientsConfig.find(configElem => configElem.name === name),
    // );
    const clients = [config.redis.listenerClientName].map(name => 
      clientsConfig.find(configElem => configElem.name === name),
    );
    for (let attempt = 1; attempt <= retries; attempt++) {
      const notReadyClients = clients.filter(client => client?.redisClient?.status !== 'ready');
  
      if (notReadyClients.length === 0) {
        logger.info(__filename, 'isReady', 'All Redis clients are ready');
        return;
      }
  
      for (const client of notReadyClients) {
        logger.warn(__filename, 'isReady',
          `[REDIS ${client.name}] Attempt ${attempt}: Redis is not ready. Retrying in ${delay}ms...`,
        );
      }  
      await delayService.wait(delay);
    }
  
    throw new Error('Redis clients failed to become ready after maximum retries');
  },
};

function setupRedisListeners(redisClientsArray: IClientConfig[]) {

  redisClientsArray.forEach((client) => {
    client.redisClient.on('connect', () => {
      logger.info(__filename, 'create', `[REDIS ${client.name}] Successfully connected`);
    });

    client.redisClient.on('ready', async () => {
      logger.info(__filename, 'create', `[REDIS ${client.name}] Ready`);
      if (client.name === config.redis.listenerClientName) {
        await redisService.processQueue(client.redisClient); // Pass the client to processQueue if needed
      }
    });

    client.redisClient.on('error', (error) => {
      logger.error(__filename, 'create', `[REDIS ${client.name}] Connection error: ${error.message}`);
    });
  });
}

setupRedisListeners(clientsConfig);

export default redisService;
