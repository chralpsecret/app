import log from 'loglevel';
import config from './config';
import { default as axios, AxiosResponse } from 'axios';

// Post application to provider
export const createApplicationAPI = async ({ application_id, first_name, last_name }: any) => {
  try {
    const response: AxiosResponse = await axios.post(`${config.lendo.url}/api/applications`, {
      id: application_id,
      first_name,
      last_name
    })
    return response.data
  } catch (error: any) {
    log.warn(error?.response?.data.error)
    return error?.response?.data;
  }
}

// Get status of application from provider
export const getApplicationAPI = async (application_id: string) => {
  try {
    const response: AxiosResponse = await axios.get(`${config.lendo.url}/api/jobs`, {
      params: {
        application_id
      }
    });
    return response.data
  } catch (error: any) {
    log.warn(error?.response?.data.error)
    return error?.response?.data;
  }
}
