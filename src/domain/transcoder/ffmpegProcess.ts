import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import logger from '../../services/logger.service';
import config from './../../config/config';
import { ITranscoderCreate, ITranscoderOnProgress, ITranscoderOptionsMap } from './transcoder.interface';
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

async function createHlsKeyInfoFile(
  outputPath: string,
  encryptionKeyPath: string,
  encryptionKeyUrl: string,
): Promise<string> {
  try {
    logger.debug(__filename, 'createHlsKeyInfoFile', 'Creating HLS key info file for encryption');

    // Read the encryption key to get its hex representation
    const encryptionKeyBuffer = await fs.promises.readFile(encryptionKeyPath);
    const encryptionKeyHex = encryptionKeyBuffer.toString('hex');

    // Create key info file content
    const keyInfoContent = [
      encryptionKeyUrl,
      encryptionKeyPath,
      encryptionKeyHex,
    ].join('\n');

    // Write key info file
    const keyInfoFilePath = path.join(outputPath, 'key_info.txt');
    await fs.promises.writeFile(keyInfoFilePath, keyInfoContent);

    logger.debug(__filename, 'createHlsKeyInfoFile', `Key info file created at: ${keyInfoFilePath}`);
    return keyInfoFilePath;
  } catch (error) {
    logger.error(__filename, 'createHlsKeyInfoFile', 'Error creating HLS key info file', error);
    throw new Error(`Failed to create HLS key info file: ${error.message}`);
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

const transcoderOptionsMap: ITranscoderOptionsMap = {
  hls: {
    getOutputOptions: (keyInfoFilePath?: string, segmentDuration: number = 10) => {
      // Calculate GOP size (frames per keyframe) based on segment duration
      // Assuming 30 fps, adjust if your videos have different frame rates
      // This ensures keyframes align with segment boundaries
      const fps = 30; // Default FPS, can be made configurable if needed
      const gopSize = Math.round(fps * segmentDuration);

      // Build hls_flags based on whether encryption is enabled
      let hlsFlags = 'split_by_time';
      if (keyInfoFilePath) {
        hlsFlags = 'delete_segments+discont_start+split_by_time';
      }

      const baseOptions = [
        // Re-encode video to enable exact segment duration control
        // Using libx264 with fast preset for reasonable speed/quality balance
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23', // Good quality (lower = better quality, 18-28 is typical range)
        '-c:a', 'aac',
        '-b:a', '192k',
        // Force keyframes at exact segment intervals for precise segment duration
        '-force_key_frames', `expr:gte(t,n_forced*${segmentDuration})`,
        // Set GOP size to match segment duration
        '-g', `${gopSize}`,
        '-start_number', '0',
        '-hls_time', `${segmentDuration}`,
        '-hls_list_size', '0',
        '-f', 'hls',
        // Use split_by_time to ensure segments are split at exact time intervals
        '-hls_flags', hlsFlags,
      ];

      if (keyInfoFilePath) {
        baseOptions.push('-hls_key_info_file', keyInfoFilePath);
      }

      return baseOptions;
    },
    getOutputPath: (outputPath: string) => `${outputPath}/index.m3u8`,
  },
  dash: {
    getOutputOptions: (segmentDuration: number = 10) => [
      '-f dash',
      `-seg_duration ${segmentDuration}`,
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
  if (!outputPath) {
    return;
  }

  await ensureDirectoryExists(outputPath);

  const segmentDuration = requestContent.segmentDuration || 10;
  let outputOptions: string[];
  let outputFilePath: string;

  if (type === 'hls') {
    const hlsConfig = transcoderOptionsMap.hls;
    if (requestContent.encryptionKeyPath && requestContent.encryptionKeyUrl) {
      const keyInfoFilePath = await createHlsKeyInfoFile(
        outputPath,
        requestContent.encryptionKeyPath,
        requestContent.encryptionKeyUrl,
      );
      outputOptions = hlsConfig.getOutputOptions(keyInfoFilePath, segmentDuration);
      logger.info(
        __filename,
        'addTranscoderByType',
        `HLS encryption enabled for ${requestContent.trackingId} with segment duration: ${segmentDuration}s`,
      );
    } else {
      outputOptions = hlsConfig.getOutputOptions(undefined, segmentDuration);
      logger.info(
        __filename,
        'addTranscoderByType',
        `HLS transcoding without encryption for ${requestContent.trackingId}` +
        ` with segment duration: ${segmentDuration}s`,
      );
    }
    outputFilePath = hlsConfig.getOutputPath(outputPath);
  } else {
    const dashConfig = transcoderOptionsMap.dash;
    outputOptions = dashConfig.getOutputOptions(segmentDuration);
    outputFilePath = dashConfig.getOutputPath(outputPath);
    logger.info(
      __filename,
      'addTranscoderByType',
      `DASH transcoding for ${requestContent.trackingId}` +
      ` with segment duration: ${segmentDuration}s`,
    );
  }

  const transcoder = ffmpeg(inputFile)
    .outputOptions(outputOptions)
    .output(outputFilePath);

  return runFfmpegProcess(transcoder, requestContent, type);
}
