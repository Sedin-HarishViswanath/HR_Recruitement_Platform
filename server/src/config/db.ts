import knex from 'knex';
import knexConfig from '../../knexfile';
import { env } from './env';

const environment = (process.env.NODE_ENV as 'development') || 'development';
const config = knexConfig[environment];

export const db = knex(config);
