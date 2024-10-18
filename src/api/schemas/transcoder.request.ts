import Joi from 'joi';

const requestDataSchema = Joi.object({
  inputFilePath: Joi.string()
    .trim()
    .example('./volumes/myvideo.mp4')
    .error(new Error('inputFilePath is required and should be a string'))
    .required(),
  trackingId: Joi.string()
    .trim()
    .example('whatever')
    .error(new Error('trackingId must be a string')),
  hlsOutputPath: Joi.string()
    .trim()
    .example('./volumes/hls/myvideo')
    .error(new Error('hlsOutputPath is required and should be a string')),
  dashOutputPath: Joi.string()
    .trim()
    .example('./volumes/dash/myvideo')
    .error(new Error('dashPutputPath is required and should be a string')),
}).or('hlsOutputPath', 'dashOutputPath');

export default requestDataSchema;
