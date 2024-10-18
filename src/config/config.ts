import dotenv from 'dotenv';
import { IConfig } from './config.interface';
dotenv.config();

const config: IConfig = {
  appName: process.env.APP_NAME || 'ts-backend',
  domain: {
    transcoder: {
      webhooks: {
        authorizationHeader: process.env.NOTIFICATION_AUTHORIZATION_HEADER,
        status: {
          url: process.env.NOTIFICATION_TRANSCODED_STATUS_HOOK_URL,
          started: 'started'.toUpperCase(),
          finished: 'finished'.toUpperCase(),
          failed: 'failed'.toUpperCase(),
        },
        onStart: JSON.parse(process.env.NOTIFICATION_WEBHOOK_ON_START_ENABLED) || false,
        onFinished: JSON.parse(process.env.NOTIFICATION_WEBHOOK_ON_FINISHED_ENABLED) || false,
        onFailed: JSON.parse(process.env.NOTIFICATION_WEBHOOK_ON_FAILED_ENABLED) || false,
      },
    },
  },
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'debug',
  port: process.env.PORT || '3002',
  redis: {
    enabled: JSON.parse(process.env.REDIS_ENABLED) || false,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
    mainQueue: process.env.REDIS_TRANSCODER_MAIN_QUEUE || 'transcoder_jobs_queue',
    deadLetterQueue: process.env.REDIS_TRANSCODER_DEAD_LETTER_QUEUE || 'transcoder_jobs_dead_letter_queue',
    publisherClientName: 'publisher'.toUpperCase(),
    listenerClientName: 'listener'.toUpperCase(),
  },
  swagger: {
    options: {
      documentationPath: '/documentation',
      info: {
        description: `${process.env.APP_NAME} Backend API doc`,
        title: `${process.env.APP_NAME} Backend API Documentation`,
        version: 'latest',
      },
      schemes: ['http', 'https'],
      grouping: 'tags',
      documentationPage: process.env.NODE_ENV !== 'production',
    },
  },
};

export default config;
