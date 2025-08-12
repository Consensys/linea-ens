import { Request, Response } from 'express';
import { EVMGateway } from './evm-gateway';
import { FallbackProvider, JsonRpcProvider } from 'ethers';
import { L2ProofService } from './L2ProofService';
import 'dotenv/config';
import { Server } from '@chainlink/ccip-read-server';
import { logError, logInfo } from './utils';

const PRIMARY_PROVIDER_TIMEOUT = parseInt(
  process.env.PRIMARY_PROVIDER_TIMEOUT ?? '2000',
);
const FALLBACK_PROVIDER_TIMEOUT = parseInt(
  process.env.FALLBACK_PROVIDER_TIMEOUT ?? '7000',
);

const l1ProviderUrl = process.env.L1_PROVIDER_URL;
const l1ProviderUrlFallback = process.env.L1_PROVIDER_URL_FALLBACK;
const l1ChainId = parseInt(process.env.L1_CHAIN_ID ?? '11155111');

const l2ProviderUrl = process.env.L2_PROVIDER_URL;
const l2ProviderUrlFallback = process.env.L2_PROVIDER_URL_FALLBACK;
const l2ChainId = parseInt(process.env.L2_CHAIN_ID ?? '59141');

const blockSyncBuffer = parseInt(process.env.BLOCK_SYNC_BUFFER ?? '32');

const rollupAddress =
  process.env.L1_ROLLUP_ADDRESS ?? '0xB218f8A4Bc926cF1cA7b3423c154a0D627Bdb7E5';
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'test';

function createFallbackProvider(
  chainId: number,
  primaryUrl?: string,
  fallbackUrl?: string,
) {
  if (!primaryUrl) {
    throw new Error('Missing provider URL');
  }

  const providers = [
    {
      provider: new JsonRpcProvider(primaryUrl, chainId, {
        staticNetwork: true,
        batchMaxCount: 1,
        cacheTimeout: -1,
        polling: false,
        batchStallTime: 0,
      }),
      polling: false,
      stallTimeout: PRIMARY_PROVIDER_TIMEOUT,
      priority: 1,
      weight: 2,
    },
  ];

  if (fallbackUrl && fallbackUrl.trim() !== '') {
    providers.push({
      provider: new JsonRpcProvider(fallbackUrl, chainId, {
        staticNetwork: true,
        batchMaxCount: 1,
        cacheTimeout: -1,
        polling: false,
        batchStallTime: 0,
      }),
      polling: false,
      stallTimeout: FALLBACK_PROVIDER_TIMEOUT,
      priority: 2,
      weight: 1,
    });
  }

  const fallbackProvider = new FallbackProvider(providers, chainId, {
    quorum: 1,
  });

  fallbackProvider.on('error', error =>
    logError(`Provider error (chainId: ${chainId}):`, error),
  );

  return fallbackProvider;
}

try {
  const providerL1 = createFallbackProvider(
    l1ChainId,
    l1ProviderUrl,
    l1ProviderUrlFallback,
  );
  const providerL2 = createFallbackProvider(
    l2ChainId,
    l2ProviderUrl,
    l2ProviderUrlFallback,
  );

  const gateway = new EVMGateway(
    new L2ProofService(providerL1, providerL2, rollupAddress, blockSyncBuffer),
  );

  const server = new Server();
  gateway.add(server);
  const app = server.makeApp('/');

  logInfo('Server setup complete');

  // Liveness probe
  app.get('/live', async (_req: Request, res: Response) => {
    res.send({
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
    });
  });

  // Readiness probe
  app.get('/ready', async (_req: Request, res: Response) => {
    const readiness = {
      message: 'OK',
      timestamp: Date.now(),
    };
    try {
      const host = _req.protocol + '://' + _req.get('host');
      // Call the actual method to get the results for a specific slot location to check that it resolves correctly
      // Query to retrieve the address of "test.linea.eth" using the mainnet linea ccip gateway
      let urlToCheck = `${host}/0xde16ee87b0c019499cebdde29c9f7686560f679a/0xea9cd3bf00000000000000000000000086c5aed9f27837074612288610fb98ccc1733126000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000001ff0000000000000000000000000000000000000000000000000000000001022003ff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000202700336c8b812cbb94faa6dddb7703eb34783f7fbf9602691decf68e661836640000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000202700336c8b812cbb94faa6dddb7703eb34783f7fbf9602691decf68e66183664.json`;
      if (nodeEnv === 'test') {
        // If on sepolia the values are slightly different
        // Query to retrieve the address of "test.linea-sepolia.eth" using the linea sepolia ccip gateway
        urlToCheck = `${host}/0x64884ed06241c059497aedb2c7a44ccae6bc7937/0xea9cd3bf000000000000000000000000a2008916ed2d7ed0ecd747a8a5309267e42cf1f1000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000001ff000000000000000000000000000000000000000000000000000000000102200304ff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020dde5d7fdc926e668bfdf1fa738b96e0ad0267b06f38e6709478a00dbc5243c17000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020dde5d7fdc926e668bfdf1fa738b96e0ad0267b06f38e6709478a00dbc5243c170000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003c.json`;
      }
      const check = await fetch(urlToCheck);
      if (check.status != 200) {
        readiness.message = check.statusText;
        logError(readiness);
        res.status(check.status).send();
      } else {
        res.send(readiness);
      }
    } catch (error) {
      readiness.message =
        error instanceof Error ? error.message : JSON.stringify(error);
      logError(error, readiness);
      res.status(500).send();
    }
  });

  (async () => {
    app.listen(port, function() {
      logInfo(`Listening on port ${port}`);
    });
  })();
} catch (e) {
  logError(e, { l1ProviderUrl, l2ProviderUrl, l2ChainId, rollupAddress, port });
}
