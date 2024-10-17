export interface ICreateGeneralError {
  isBoom?: boolean;
  data?: {
    code?: string;
    message?: string;
  }
  message: string;
  output: {
    statusCode: number;
  }
}

export interface ICreateResponseData {
  statusCode: number;
  code: string;
  message: string;
}

export interface IResponseData {
  statusCode: number;
  body: {
    statusCode: number;
    code: string;
    message: string;
    data?: Object;
  }
}
