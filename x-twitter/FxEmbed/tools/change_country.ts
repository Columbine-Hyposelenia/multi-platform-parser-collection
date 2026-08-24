/**
 * Set X account country outside UK/EU. Run: npm run credentials:change-country
 * Reads repo-root credentials.json: { "twitter": { "accounts": [...] } }
 */
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ClientTransaction } from '@fxembed/atmosphere/providers/twitter/proxy/transaction/transaction';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const credPath = join(repoRoot, 'credentials.json');

const forbiddenCountries = [
  'at',
  'be',
  'bg',
  'hr',
  'cy',
  'cz',
  'dk',
  'ee',
  'fi',
  'fr',
  'de',
  'gr',
  'hu',
  'ie',
  'it',
  'lv',
  'lt',
  'lu',
  'mt',
  'nl',
  'pl',
  'pt',
  'ro',
  'sk',
  'si',
  'es',
  'se',
  'is',
  'li',
  'no',
  'gb'
];

const replacementCountries = ['ca', 'us'];

const baseHeaders = {
  'accept': '*/*',
  'accept-language': 'en',
  'authorization':
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
  'sec-ch-ua': '"Chromium";v="138", "Not)A;Brand";v="24", "Google Chrome";v="138"',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-twitter-active-user': 'yes',
  'x-twitter-auth-type': 'OAuth2Session',
  'x-twitter-client-language': 'en'
};

async function setCountry(
  account: { authToken: string; csrfToken: string; username: string },
  transactionId: string,
  country: string
) {
  const params = new URLSearchParams({ country_code: country });
  const response = await fetch('https://api.x.com/1.1/account/settings.json', {
    headers: {
      ...baseHeaders,
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': `auth_token=${account.authToken}; ct0=${account.csrfToken}`,
      'x-csrf-token': account.csrfToken,
      'x-client-transaction-id': transactionId
    },
    referrer: 'https://x.com/settings/your_twitter_data/account',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: params,
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<{ country_code?: string }>;
}

async function getSettings(
  account: { authToken: string; csrfToken: string; username: string },
  transactionId: string
) {
  const response = await fetch('https://api.x.com/1.1/account/settings.json', {
    headers: {
      ...baseHeaders,
      'content-type': 'application/json',
      'cookie': `auth_token=${account.authToken}; ct0=${account.csrfToken}`,
      'x-csrf-token': account.csrfToken,
      'x-client-transaction-id': transactionId
    },
    referrer: 'https://x.com/settings/your_twitter_data/account',
    referrerPolicy: 'strict-origin-when-cross-origin',
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<{ country_code?: string }>;
}

async function main() {
  let clientTransaction: ClientTransaction;
  try {
    console.log('Initializing client transaction...');
    clientTransaction = await ClientTransaction.create();
    console.log('Client transaction initialized successfully');
  } catch (error) {
    console.error('Failed to initialize client transaction:', error);
    return;
  }

  type TwitterAccount = { authToken: string; csrfToken: string; username: string };
  let credentials: { twitter?: { accounts: TwitterAccount[] } };
  try {
    credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  } catch (error) {
    console.error('Failed to read credentials file:', error);
    return;
  }

  if (!credentials.twitter?.accounts?.length) {
    console.error(`${credPath} must contain twitter.accounts[]`);
    return;
  }
  const accounts = credentials.twitter.accounts;

  console.log(`Accounts count: ${accounts.length}`);

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    try {
      console.log(`Processing account ${i + 1}/${accounts.length}: ${account.username}`);

      let txId = await clientTransaction.generateTransactionId('GET', '/1.1/account/settings.json');
      const settings = (await getSettings(account, txId)) as { country_code?: string };

      console.log(`Account: ${account.username} has country: ${settings.country_code ?? '?'}`);

      if (settings.country_code && forbiddenCountries.includes(settings.country_code)) {
        const newCountry =
          replacementCountries[Math.floor(Math.random() * replacementCountries.length)];
        console.log(`Setting account: ${account.username} to country: ${newCountry}`);
        txId = await clientTransaction.generateTransactionId('POST', '/1.1/account/settings.json');
        const updated = (await setCountry(account, txId, newCountry)) as { country_code?: string };
        console.log(
          `Account: ${account.username} has been set to country: ${updated.country_code ?? '?'}`
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error processing account ${account.username}:`);
      console.error(message);

      if (message.includes('429')) {
        console.log('Rate limited, waiting 10 seconds...');
        await sleep(10000);
      } else {
        await sleep(2000);
      }
    }
  }

  console.log('Finished processing all accounts');
}

main().catch(error => {
  console.error('Fatal error in main:', error);
});
