import { RedisOptions } from 'ioredis';
import Redis from 'ioredis';

const env = process.env.NODE_ENV || 'development';

type RedisConfig = {
	host: string | undefined;
	port: number;
	password: string | undefined;
};

const redisConfig: { [key in 'production' | 'development']: RedisConfig } = {
	production: {
		host: process.env.REDIS_PRODUCTION_HOST,
		port: 15585,
		password: process.env.REDIS_PRODUCTION_PASSWORD,
	},
	development: {
		host: process.env.REDIS_DEVELOPMENT_HOST,
		port: 15202,
		password: process.env.REDIS_DEVELOPMENT_PASSWORD,
	},
};

const currentConfig: RedisConfig = redisConfig[env as 'production' | 'development'] || redisConfig.development;
const connectionOptions: RedisOptions = {
	host: currentConfig.host,
	port: currentConfig.port,
	password: currentConfig.password,
	retryStrategy: (times) => {
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
};

export const redis = new Redis(connectionOptions);

redis.on('connect', () => {
	console.log('Redis is connected on:', env);
});

redis.on('error', (err) => {
	console.error('Redis connection error:', err);
});

export default connectionOptions;
