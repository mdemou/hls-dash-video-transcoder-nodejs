import config from './../../config/config';
import requestService from './../../services/axios.service';
import logger from './../../services/logger.service';

export const notifyTranscodingStatus = async (
  status: string,
  trackingId?: string,
  message?: string,
): Promise<void> => {
  const url = config.domain.transcoder.webhooks.status.url;

  if (!url) {
    logger.info(__filename, 'notifyTranscodingStatus', 'No notification URL configured. Skipping.');
    return;
  }

  try {
    await requestService.post(
      url,
      {
        trackingId: trackingId,
        status: status,
        message: message,
      },
      {
        headers: { 
          'Authorization': config.domain.transcoder.webhooks.authorizationHeader,
          'Content-Type': 'application/json',
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
