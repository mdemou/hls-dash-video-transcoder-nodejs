import { ServerRoute } from '@hapi/hapi';
import healthController from './health.controller';
import healthDocs from './health.doc';

export const healthRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/__health/liveness',
    options: {
      description: 'Liveness healthcheck',
      handler: healthController.liveness,
      plugins: {
        'hapi-swagger': {
          responses: healthDocs.liveness.responses,
        },
      },
      tags: ['api', 'health'],
    },
  },
  {
    method: 'GET',
    path: '/__health/readiness',
    options: {
      description: 'Readiness healthcheck',
      handler: healthController.readiness,
      plugins: {
        'hapi-swagger': {
          responses: healthDocs.readiness.responses,
        },
      },
      tags: ['api', 'health'],
    },
  },
];
