import { ServerRoute } from '@hapi/hapi';
import transcoderController from './transcoder.controller';
import transcoderDoc from './transcoder.doc';

export const transcoderRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/transcoder',
    options: {
      description: 'Create transcoder process',
      handler: transcoderController.go,
      plugins: {
        'hapi-swagger': {
          responses: transcoderDoc.go.responses,
        },
      },
      validate: transcoderDoc.go.parameters,
      tags: ['api', 'transcoder'],
    },
  },
];
