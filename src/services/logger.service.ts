import pino from 'pino';
import config from '../config/config';

const pinoLog = pino({
  name: config.appName,
  level: config.logLevel,
  timestamp: () => `,"humanDate":"${new Date().toISOString()}"`,
});

function formatResponse(fileName: string, methodName: string, logItem?: Object) {
  return {
    filename: fileName.slice(fileName.lastIndexOf('/') + 1, -3),
    methodName,
    extra: logItem ? JSON.stringify(logItem, Object.getOwnPropertyNames(logItem)) : {},
  };
}

const logger = {
  trace: (fileName: string, methodName: string, message: string, logItem?: Object) => {
    return pinoLog.trace(formatResponse(fileName, methodName, logItem), message);
  },
  debug: (fileName: string, methodName: string, message: string, logItem?: Object) => {
    return pinoLog.debug(formatResponse(fileName, methodName, logItem), message);
  },
  info: (fileName: string, methodName: string, message: string, logItem?: Object) => {
    return pinoLog.info(formatResponse(fileName, methodName, logItem), message);
  },
  warn: (fileName: string, methodName: string, message: string, logItem?: Object) => {
    return pinoLog.warn(formatResponse(fileName, methodName, logItem), message);
  },
  error: (fileName: string, methodName: string, message: string, logItem?: Object) => {
    return pinoLog.error(formatResponse(fileName, methodName, logItem), message);
  },
  fatal: (fileName: string, methodName: string, message: string, logItem?: Object) => {
    return pinoLog.fatal(formatResponse(fileName, methodName, logItem), message);
  },
};

export default logger;
