import axios, { AxiosResponse } from 'axios';
import logger from './logger.service';

type ServiceResponse<T> = {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
};

const requestService = {
  get: async <T>(url: string, options: Object = {}): Promise<ServiceResponse<T>> => {
    try {
      logger.debug(__filename, 'get', `Getting ${url}`);
      const response: AxiosResponse<T> = await axios.get(url, options);
      return {
        success: true,
        status: response.status,
        message: 'Request successful',
        data: response.data,
      };
    } catch (error: any) {
      logger.error(__filename, 'get', error.message || error);
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.message,
        data: error.response?.data || null,
      };
    }
  },

  post: async <T>(url: string, payload: Object, options: Object): Promise<ServiceResponse<T>> => {
    try {
      logger.debug(__filename, 'post', `Posting ${url}`);
      const response = await axios.post(url, payload, options);
      return {
        success: true,
        status: response.status,
        message: 'Request successful',
        data: response.data,
      };
    } catch (error: any) {
      logger.error(__filename, 'post', error.message || error);
      return {
        success: false,
        message: error.message,
        status: error.response?.status || 500,
        data: error.response?.data || null,
      };
    }
  },
};

export default requestService;