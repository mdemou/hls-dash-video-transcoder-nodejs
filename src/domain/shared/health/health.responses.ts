import responsesService from '../../../services/responses/responses.service';

const healthResponses = {
  livenessOk: responsesService.createInternalResponse(200, 'HLTH2001', 'Liveness successfully!'),
  readinessOk: responsesService.createInternalResponse(200, 'HLTH2002', 'Readiness successfully!'),
};

export default healthResponses;
