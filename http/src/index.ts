import express from 'express';
import log from 'loglevel';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import config from './config';

// Ensure port number as type Number if env.Port is provided
const httpPort: number = Number(process.env.PORT) || 3333;

const PROTO_PATH = './src/proto/application.proto';

log.setLevel('info');

const app = express();
app.use(express.json());

let packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

let application_proto: any = grpc.loadPackageDefinition(packageDefinition).applications;

let client = new application_proto.Applications(`${config.grpc.address}:${config.grpc.port}`, grpc.credentials.createInsecure());

app.get('/api/application/getstatus', (req, res) => {
  const { application_id } = req.body;
  if (!application_id) return res.json({ error: 'application_id was not provided' })
  client.GetApplicationStatus({ application_id }, (err, response) => {
    if (!response?.application_id) return res.json({ error: `No application found with id ${application_id}` });
    return res.json(response);
  });
});

app.post('/api/application/create', (req, res) => {
  const { first_name, last_name } = req.body;
  if (!first_name || !last_name) return res.json({ error: 'first_name or last_name missing' })
  client.CreateApplication({ first_name, last_name }, (err, response) => {
    return res.json(response);
  });
});

app.listen(httpPort, () =>
  log.info(`http-api listening on port ${httpPort}`),
);
