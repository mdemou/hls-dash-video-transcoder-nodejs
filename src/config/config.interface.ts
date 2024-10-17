export interface IConfig {
  appName: string;
  domain: {
    transcoder: {
      statusUrl: string;
      authorizationHeader: string;
      webhooks: {
        status: {
          started: string;
          finished: string;
          failed: string;
        }
        onStart: boolean,
        onFinished: boolean,
        onFailed: boolean,
      }
    }
  },
  host: string;
  logLevel: string;
  port: string;
  redis: {
    enabled: boolean;
    host: string;
    port: string;
    password: string;
    db: string;
    mainQueue: string;
    deadLetterQueue: string;
  },
  swagger: {
    options: {
      // host: string;
      documentationPath: string;
      info: {
        description: string;
        title: string;
        version: string;
      },
      schemes: string[];
      grouping: string;
      documentationPage: boolean;
    },
  },
}
