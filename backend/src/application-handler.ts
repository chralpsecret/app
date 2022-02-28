import log from 'loglevel';
import { createApplicationAPI, getApplicationAPI } from './provider-api';
import Database from './Database';

interface ApplicationHandler {
  type: string;
  key: string;
  data: string;
}
// "Last status strings", if we encounter this from providers API
// we do not want to requeue message for lookup
const STATUS_DONE = ['rejected', 'completed'];

export const applicationHandler = async ({ type, key, data }: ApplicationHandler) => {

  // Handle new application
  if (type === 'new') {
    const parsed = JSON.parse(data);

    // Post application to provider
    const result = await createApplicationAPI(parsed);
    if (result?.error) {
      // If error save application with status not valid
      await Database.set(`application:${parsed.application_id}`, { ...parsed, status:'not valid'});
      return false;
    }

    // Overwrite / save application with status from provider
    await Database.set(`application:${parsed.application_id}`, {
      ...parsed,
      status: result.status
    });

    // Also save a key with TTL so we can handle lookup again
    await Database.set(`${parsed.application_id}`, {}, { EX: 1 });
  }

  // Handle expired key
  if (type === 'expired') {

    // Get object from database first
    const dbResult: any = await Database.get(`application:${key}`);

    // Unless status is completed or rejected we want to check providers API
    if (!(STATUS_DONE.includes(dbResult.status))) {
      const apiResult: any = await getApplicationAPI(key);

      // Requeue id to check later
      if (!(STATUS_DONE.includes(apiResult.status))) {
        log.debug(`Requeuing application id ${dbResult.application_id}`);

        // Requeue key with TTL
        await Database.set(`${dbResult.application_id}`, {}, { EX: 1 });
      }

      // Update data in db with new status
      if (dbResult.status !== apiResult.status) {
        const message = {
          ...dbResult,
          id: apiResult.id,
          status: apiResult.status
        };
        log.debug(`Application data saved`);
        await Database.set(`application:${dbResult.application_id}`, message);
      }
    }
  }
}
