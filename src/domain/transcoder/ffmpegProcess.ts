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
    getOutputOptions: (keyInfoFilePath?: string, segmentDuration: number = 4) => {
      // Build hls_flags based on whether encryption is enabled
      let hlsFlags = 'independent_segments+split_by_time';
      if (keyInfoFilePath) {
        hlsFlags = 'independent_segments+delete_segments+discont_start+split_by_time';
      }

      const baseOptions = [
        // Video encoding - iOS-compatible settings matching livestream
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-profile:v', 'main',           // H.264 Main profile for iOS compatibility
        '-level', '3.1',                 // Level 3.1 (supports up to 1280x720@30fps)
        '-s:v', '1280x720',              // Force 720p resolution
        '-b:v', '2500k',                 // Target bitrate (CBR)
        '-maxrate', '2500k',             // Max bitrate (enforce CBR)
        '-bufsize', '5000k',             // Buffer size (2x bitrate for CBR)
        '-r', '30',                      // Force 30fps frame rate

        // Audio encoding - iOS-compatible settings matching livestream
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '48000',                  // 48kHz sample rate
        '-ac', '2',                      // Stereo

        // GOP/Keyframe settings - aligned with 4s segments at 30fps
        '-g', '120',                     // GOP size: 30fps * 4s = 120 frames
        '-keyint_min', '120',            // Minimum keyframe interval
        '-sc_threshold', '0',            // Disable scene change detection for consistent GOP
        '-force_key_frames', `expr:gte(t,n_forced*${segmentDuration})`,

        // HLS settings
        '-start_number', '0',
        '-hls_time', `${segmentDuration}`,
        '-hls_list_size', '0',
        '-f', 'hls',
        '-hls_flags', hlsFlags,
        '-hls_segment_type', 'mpegts',
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
