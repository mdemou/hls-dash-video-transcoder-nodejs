import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import logger from '../../services/logger.service';
import config from './../../config/config';
import { ITranscoderCreate, ITranscoderOnProgress } from './transcoder.interface';
import { notifyTranscodingStatus } from './transcoderNotify.service';

async function ensureDirectoryExists(directoryPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(directoryPath, { recursive: true });
    logger.debug(__filename, 'ensureDirectoryExists', `Directory ${directoryPath} is ready.`);
  } catch (error) {
    logger.error(__filename, 'ensureDirectoryExists', `Error creating directory: ${directoryPath}`, error);
    throw new Error(`Failed to create directory: ${directoryPath}`);
  }
}

function runFfmpegProcess(
  transcoder: ffmpeg,
  requestContent: ITranscoderCreate,
  type: string,
): Promise<void> {
  const trackingId = requestContent.trackingId;
  return new Promise((resolve, reject) => {
    transcoder
      .on('start', async (commandLine: string) => {
        logger.debug(__filename, 'go', `Transcoding started with ${commandLine}`);
        if (config.domain.transcoder.webhooks.onStart) {
          await notifyTranscodingStatus(
            config.domain.transcoder.webhooks.status.started,
            trackingId,
            `[${type.toUpperCase()}]`,
          );
        }
      })
      .on('end', async () => {
        logger.debug(__filename, 'go', 'Transcoding finished');
        if (config.domain.transcoder.webhooks.onFinished) {
          await notifyTranscodingStatus(
            config.domain.transcoder.webhooks.status.finished,
            trackingId,
            `[${type.toUpperCase()}]`,
          );
        }
        resolve();
      })
      .on('progress', async (progress: ITranscoderOnProgress) => {
        logger.debug(__filename, 'go', 
          `Processing: frames:${progress.frames} fps:${progress.currentFps} time:${progress.timemark}`,
        );
      })
      .on('error', async (error: any) => {
        logger.error(__filename, 'go', `Transcoding error: ${error}`);
        if (config.domain.transcoder.webhooks.onFailed) {
          await notifyTranscodingStatus(
            config.domain.transcoder.webhooks.status.failed,
            trackingId,
            `[${type.toUpperCase()}] - ${error.message}`);
        }
        reject(error);
      })
      .run();
  });
}

const transcoderOptionsMap = {
  hls: {
    outputOptions: [
      '-codec copy',
      '-start_number 0',
      '-hls_time 10',
      '-hls_list_size 0',
      '-f hls',
    ],
    getOutputPath: (outputPath: string) => `${outputPath}/index.m3u8`,
  },
  dash: {
    outputOptions: [
      '-f dash',
      '-seg_duration 10',
    ],
    getOutputPath: (outputPath: string) => `${outputPath}/manifest.mpd`,
  },
};

export async function addTranscoderByType(
  type: 'hls' | 'dash',
  inputFile: string,
  outputPath: string,
  requestContent: ITranscoderCreate,
): Promise<void> {
  const transcoderConfig = transcoderOptionsMap[type];
  if (outputPath && transcoderConfig) {
    await ensureDirectoryExists(outputPath);
    const transcoder = ffmpeg(inputFile)
      .outputOptions(transcoderConfig.outputOptions)
      .output(transcoderConfig.getOutputPath(outputPath));

    return runFfmpegProcess(transcoder, requestContent, type);
  }
}
