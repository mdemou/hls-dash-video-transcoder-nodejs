import Boom from '@hapi/boom';
import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import logger from '../../services/logger.service';
import { addTranscoderByType } from './ffmpegProcess';
import transcoderErrors from './transcoder.errors';
import { ITranscoderCreate } from './transcoder.interface';

const transcoderService = {
  go: async (requestPayload: ITranscoderCreate): Promise<void> => {
    const inputFile = requestPayload.inputFilePath;
    try {
      logger.debug(__filename, 'create', 'starting transcoding process');

      if (!fs.existsSync(requestPayload.inputFilePath)) {
        logger.error(__filename, 'go', `Input file does not exist: ${requestPayload.inputFilePath}`);
        throw Boom.badRequest(
          transcoderErrors.badRequestFileNotFound.message,
        );
      }

      ffmpeg.setFfmpegPath(ffmpegStatic);
      await Promise.all([
        addTranscoderByType('hls', inputFile, requestPayload.hlsOutputPath, requestPayload),
        addTranscoderByType('dash', inputFile, requestPayload.dashOutputPath, requestPayload),
      ]);
    } catch (error) {
      logger.error(__filename, 'go', 'error', error);
    }
  },
};

export default transcoderService;
