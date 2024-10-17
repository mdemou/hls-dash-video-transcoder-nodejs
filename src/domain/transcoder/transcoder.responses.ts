import responsesService from '../../services/responses/responses.service';

const transcoderResponses = {
  ok: responsesService.createInternalResponse(201, 'TRNS2011', 'Transcode request initialized successfully'),
  badRequest: (statusCode: number, message: string) => {
    return responsesService.createInternalResponse(statusCode, 'TRNS4001', message);
  },
};
export default transcoderResponses;