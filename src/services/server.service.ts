import Hapi, { Server, ServerRoute } from '@hapi/hapi';
import config from '../config/config';
import { registerPlugins } from './../api/plugins/plugins';
import { initializeServices } from './../api/processes/init';
import { handleProcessEvents } from './../api/processes/lifecycle';
import logger from './logger.service';

export let server: Server;
export const init = async function (routes: Record<string, ServerRoute[]>): Promise<Server> {
  server = Hapi.server({
    port: config.port,
    host: config.host,
    routes: {
      cors: true,
    },
  });

  // plugins
  await registerPlugins(server);

  /* routes */
  for (const route in routes) {
    server.route(routes[route]);
  }

  return server;
};

export const start = async function (): Promise<void> {
  try {
    await initializeServices();
    logger.info(__filename, 'init', `Server running on ${server.settings.host}:${server.settings.port}`, {});
    return await server.start();
  } catch (error) {
    logger.error(__filename, 'init', `Failed when trying to run server: ${error.message}`, error);
  }
};

// Handle process events (unhandledRejection, SIGINT)
handleProcessEvents();
