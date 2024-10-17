import { ServerRoute } from '@hapi/hapi';
import { defaultRoutes } from './default.route';
import { healthRoutes } from '../../domain/shared/health/health.route';
import { transcoderRoutes } from '../../domain/transcoder/transcoder.route';

const routes: Record<string, ServerRoute[]> = {
  defaultRoutes: defaultRoutes,
  healthRoutes: healthRoutes,
  transcoderRoutes: transcoderRoutes,
};

export default routes;
