import * as pack from '../../package.json';

export default (): any => ({
  HTTP_PORT: process.env.HTTP_PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  VERSION: pack.version,
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
});
