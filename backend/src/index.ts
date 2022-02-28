import log from 'loglevel';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import config from './config';
import { createClient } from 'redis';
import { getApplicationStatus, createApplication } from './req-handler';
import Database from './Database';
import { applicationHandler } from './application-handler';

const loglevel: any = process.env.LOG_LEVEL || 'info';
log.setLevel(loglevel);

const PROTO_PATH = "./src/proto/application.proto";

const GRPCoptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

(async () => {

  const GRPCdefinition = protoLoader.loadSync(PROTO_PATH, GRPCoptions);
  const applicationPROTO: any = grpc.loadPackageDefinition(GRPCdefinition).applications;

  const server = new grpc.Server();

  const client = createClient({ url: `${config.redis.url}` });
  await client.connect();

  Database.setDB(client);

  client.on('error', (err) => log.warn('Redis client error', err));

  // Set conf for events of expired keys
  // Expired keys will be our way to handle lookups to providers API
  client.configSet('notify-keyspace-events', 'Ex');

  const subClient = client.duplicate();
  subClient.connect();

  // Subscribe to expired keys from redis
  subClient.subscribe('__keyevent@0__:expired', (key: string) => applicationHandler({ type: 'expired', key, data: key }));

  // Subscribe to channel new
  subClient.subscribe('new', (key) => applicationHandler({ type: 'new', key: '', data: key }))

  server.addService(applicationPROTO.Applications.service, {
    CreateApplication: createApplication,
    GetApplicationStatus: getApplicationStatus,
  });

  server.bindAsync(`${config.grpc.address}:${config.grpc.port}`, grpc.ServerCredentials.createInsecure(), (error) => {
    if (error) {
      // Something is wrong, log and kill process
      log.warn(error);
      process.exit(-1);
    };

    log.info(`Server running at http://${config.grpc.address}:${config.grpc.port}`);
    server.start();
  });
})();
