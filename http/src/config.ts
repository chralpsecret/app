export default {
  grpc: {
    address: process.env.GRPC_ADDRESS || 'localhost',
    port: process.env.GRPC_PORT || '50051',
  },
  loglevel: process.env.LOG_LEVEL || 'info',
};
