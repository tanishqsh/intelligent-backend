import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY || 'NEYNAR_API_DOCS');

export { neynar };
