import { ICreateGeneralError, ICreateResponseData, IResponseData } from './responses.interfaces';

const responseService = {
  createResponseData: (result: ICreateResponseData, extraData?: Object) => {
    let response: IResponseData = {
      statusCode: result.statusCode,
      body: {
        statusCode: result.statusCode,
        code: result.code,
        message: result.message,
      },
    };
    if (extraData) {
      response.body.data = extraData;
    }
    return response;
  },

  createInternalResponse(statusCode: number, code: string, message: string) {
    return {
      statusCode,
      code,
      message,
    };
  },

  createGeneralError(error: ICreateGeneralError) {
    return {
      statusCode: error.output.statusCode,
      body: {
        statusCode: error.output.statusCode,
        code: error.data && error.data.code ? error.data.code : 'GRR000X',
        message: error.message,
      },
    };

  },
};

export default responseService;
