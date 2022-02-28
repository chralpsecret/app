import { randomUUID } from 'crypto';
import Database from './Database';

export const getApplicationStatus = async ({ request }: any, cb: Function) => {
  const { application_id } = request;
  const key = `application:${application_id}`;

  // Get application from redis database
  // We dont want to call provider on each http request from http-service
  const result: any = await Database.get(key);
  return cb(null, { ...result });
};

export const createApplication = async ({ request }: any, cb: Function) => {
  const { ...data } = request;
  const application_id = randomUUID();
  const status = 'queued';
  const message = {
    application_id,
    status,
    ...data
  };

  // Save the whole application in redis
  await Database.set(`application:${application_id}`, message);

  // Publish message to channel new
  await Database.publish({ channel: 'new', message });

  return cb(null, { application_id, status, ...data });
};
