import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import * as HapiSwagger from 'hapi-swagger';
import config from '../../config/config';

export const registerPlugins = async (server: Hapi.Server) => {
  const plugins: Array<Hapi.ServerRegisterPluginObject<any>> = [
    { plugin: Inert },
    { plugin: Vision },
    {
      plugin: HapiSwagger,
      options: config.swagger.options,
    },
  ];
  await server.register(plugins);
};
