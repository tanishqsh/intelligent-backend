import { Pool } from 'pg';

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
});

pool.on('connect', () => {
	console.log('Mimir is alive 🟡');
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initializeMimir = async () => {
	await pool.connect();
};
