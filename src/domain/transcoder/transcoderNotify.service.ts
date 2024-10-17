import config from './../../config/config';
import requestService from './../../services/axios.service';
import logger from './../../services/logger.service';
import { ITranscoderCreate } from './transcoder.interface';

export const notifyTranscodingStatus = async (
  status: string,
  requestPayload: ITranscoderCreate,
  transcoderError?: string,
): Promise<void> => {
  const url = config.domain.transcoder.statusUrl;

  if (!url) {
    logger.info(__filename, 'notifyTranscodingStatus', 'No notification URL configured. Skipping.');
    return;
  }

  try {
    await requestService.post(
      url,
      {
        status,
        hlsOutputDir: requestPayload.hlsOutputPath,
        dashOutputDir: requestPayload.dashOutputPath,
        inputFile: requestPayload.inputFilePath,
        error: transcoderError,
      },
      {
        headers: {
          'Authorization': config.domain.transcoder.authorizationHeader,
        },
      },
    );
    logger.debug(
      __filename,
      'notifyTranscodingStatus',
      `Transcoding status notification sent: ${status}`,
    );
  } catch (error) {
    logger.error(__filename, 'notifyTranscodingStatus', 'Failed to send transcoding status notification', error);
  }
};
