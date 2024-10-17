import { init, start } from './services/server.service';
import routes from './api/routes/routes';

(async function () {
  await init(routes);
  await start();
})();
