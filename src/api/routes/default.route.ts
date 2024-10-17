import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import logger from '../../services/logger.service';

export const defaultRoutes: ServerRoute[] = [
  {
    method: '*',
    path: '/{any*}',
    options: {
      auth: false,
      description: '404 Not found',
      handler: (request: Request, h: ResponseToolkit) => {
        logger.info(__dirname, 'defaultRoutes', '404 not found!!');
        return h.response({
          statusCode: 404,
          code: 'NTFND404',
          message: 'Resource not found',
        }).code(404);
      },
      tags: ['api', 'default'],
    },
  },
];
