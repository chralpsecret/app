export default {
  lendo: {
    url: process.env.LENDO_APP || 'http://localhost:8000',
  },
  grpc: {
    address: process.env.GRPC_ADDRESS || 'localhost',
    port: process.env.GRPC_PORT || 50051,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  loglevel: process.env.LOG_LEVEL || 'info',
};
