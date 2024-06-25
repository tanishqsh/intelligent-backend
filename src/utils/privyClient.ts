import { PrivyClient } from '@privy-io/server-auth';

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || '';
const PRIVY_DEV_APP_ID = process.env.PRIVY_DEV_APP_ID || '';
const PRIVY_DEV_APP_SECRET = process.env.PRIVY_DEV_APP_SECRET || '';

const isDev = process.env.NODE_ENV === 'development';

const privyClient = isDev ? new PrivyClient(PRIVY_DEV_APP_ID, PRIVY_DEV_APP_SECRET) : new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

export default privyClient;
