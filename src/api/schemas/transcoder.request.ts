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
  encryptionKeyPath: Joi.string()
    .trim()
    .example('./volumes/vods/uuid/hls/encryption.key')
    .error(new Error('encryptionKeyPath must be a string'))
    .when('dashOutputPath', {
      is: Joi.exist(),
      then: Joi.forbidden().error(new Error('encryptionKeyPath is not allowed with DASH output')),
    }),
  encryptionKeyUrl: Joi.string()
    .trim()
    .example('/keys/vods/uuid/encryption.key')
    .error(new Error('encryptionKeyUrl must be a string'))
    .when('dashOutputPath', {
      is: Joi.exist(),
      then: Joi.forbidden().error(new Error('encryptionKeyUrl is not allowed with DASH output')),
    }),
  segmentDuration: Joi.number()
    .integer()
    .default(6)
    .min(1)
    .example(10)
    .error(new Error('segmentDuration must be a number and greater than 0')),
})
  .or('hlsOutputPath', 'dashOutputPath')
  .with('encryptionKeyPath', 'encryptionKeyUrl')
  .with('encryptionKeyUrl', 'encryptionKeyPath');

export default requestDataSchema;
