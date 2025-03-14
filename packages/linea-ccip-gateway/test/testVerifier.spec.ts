import { Server } from '@chainlink/ccip-read-server';
import { makeL2Gateway } from '../src';
import { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider';
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';
import { expect } from 'chai';
import { BrowserProvider, Contract, ethers, FallbackProvider, FetchRequest, JsonRpcProvider, Signer } from 'ethers';
import { ethers as ethersHardhat } from 'hardhat';
import { EthereumProvider } from 'hardhat/types';
import request from 'supertest';
import { L2_RPC_URL_INVALID, L2_TEST_CONTRACT_ADDRESS } from './constants';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(__dirname, '../.env.test'), override: true });

const {
  L1_CHAIN_ID,
  L2_CHAIN_ID,
  L1_PROVIDER_URL,
  L2_PROVIDER_URL,
  L1_ROLLUP_ADDRESS,
  BLOCK_SYNC_BUFFER,
} = process.env;

type ethersObj = typeof ethers &
  Omit<HardhatEthersHelpers, 'provider'> & {
  provider: Omit<HardhatEthersProvider, '_hardhatProvider'> & {
    _hardhatProvider: EthereumProvider;
  };
};

declare module 'hardhat/types/runtime' {
  const ethers: ethersObj;

  interface HardhatRuntimeEnvironment {
    ethers: ethersObj;
  }
}

describe('L1Verifier', () => {
  let l1Provider: BrowserProvider;
  let invalidL2Provider: JsonRpcProvider;
  let validL2Provider: JsonRpcProvider;
  let l1SepoliaProvider: JsonRpcProvider;
  let signer: Signer;
  let target: Contract;

  before(async () => {
    if (
      !L1_CHAIN_ID ||
      !L2_CHAIN_ID ||
      !L1_PROVIDER_URL ||
      !L2_PROVIDER_URL ||
      !L1_ROLLUP_ADDRESS ||
      !BLOCK_SYNC_BUFFER
    ) {
      throw new Error('Missing environment variables');
    }

    const l1ChainId = parseInt(L1_CHAIN_ID);
    const l2ChainId = parseInt(L2_CHAIN_ID);
    const blockSyncBuffer = parseInt(BLOCK_SYNC_BUFFER);

    // Create a Hardhat L1 provider
    l1Provider = new ethersHardhat.BrowserProvider(
      ethersHardhat.provider._hardhatProvider,
    );

    // Create an invalid L2 provider
    invalidL2Provider = new ethersHardhat.JsonRpcProvider(
      L2_RPC_URL_INVALID,
      l2ChainId,
      {
        staticNetwork: true,
      },
    );

    // Create a valid L2 provider
    validL2Provider = new ethersHardhat.JsonRpcProvider(
      L2_PROVIDER_URL,
      l2ChainId,
      {
        staticNetwork: true,
      },
    );

    l1SepoliaProvider = new ethersHardhat.JsonRpcProvider(
      L1_PROVIDER_URL,
      l1ChainId,
      {
        staticNetwork: true,
      },
    );
    signer = await l1Provider.getSigner(0);

    const Rollup = await ethersHardhat.getContractFactory('RollupMock', signer);

    const rollupSepolia = new ethersHardhat.Contract(
      L1_ROLLUP_ADDRESS,
      Rollup.interface,
      l1SepoliaProvider,
    );
    const currentL2BlockNumber = await rollupSepolia.currentL2BlockNumber();
    const stateRootHash = await rollupSepolia.stateRootHashes(
      currentL2BlockNumber,
    );
    const rollup = await Rollup.deploy(currentL2BlockNumber, stateRootHash);

    const gateway = makeL2Gateway(
      new FallbackProvider([(l1Provider as unknown) as JsonRpcProvider]),
      new FallbackProvider([
        { provider: invalidL2Provider, stallTimeout: 1000 },
        { provider: validL2Provider, stallTimeout: 3000 },
      ]),
      await rollup.getAddress(),
      blockSyncBuffer,
    );
    const server = new Server();
    gateway.add(server);
    const app = server.makeApp('/');
    const getUrl = FetchRequest.createGetUrlFunc();
    ethersHardhat.FetchRequest.registerGetUrl(async (req: FetchRequest) => {
      if (req.url != 'test:') return getUrl(req);

      const r = request(app).post('/');
      if (req.hasBody()) {
        r.set('Content-Type', 'application/json').send(
          ethersHardhat.toUtf8String(req.body),
        );
      }
      const response = await r;
      return {
        statusCode: response.statusCode,
        statusMessage: response.ok ? 'OK' : response.statusCode.toString(),
        body: ethersHardhat.toUtf8Bytes(JSON.stringify(response.body)),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    });

    const Mimc = await ethersHardhat.getContractFactory('Mimc', signer);
    const mimc = await Mimc.deploy();

    const SparseMerkleProof = await ethersHardhat.getContractFactory(
      'SparseMerkleProof',
      { libraries: { Mimc: await mimc.getAddress() }, signer },
    );
    const sparseMerkleProof = await SparseMerkleProof.deploy();

    const LineaSparseProofVerifier = await ethersHardhat.getContractFactory(
      'LineaSparseProofVerifier',
      {
        libraries: {
          SparseMerkleProof: await sparseMerkleProof.getAddress(),
        },
        signer,
      },
    );

    const lineaSparseProofVerifier = await LineaSparseProofVerifier.deploy(
      ['test:'],
      await rollup.getAddress(),
    );

    const TestL1 = await ethersHardhat.getContractFactory('TestL1', signer);
    target = await TestL1.deploy(
      await lineaSparseProofVerifier.getAddress(),
      L2_TEST_CONTRACT_ADDRESS,
    );
    await l1Provider.send('evm_mine', []);
  });

  it('simple proofs for fixed values', async () => {
    const result = await target.getLatest({ enableCcipRead: true });
    expect(Number(result)).to.equal(42);
  });

  it('simple proofs for dynamic values', async () => {
    const result = await target.getName({ enableCcipRead: true });
    expect(result).to.equal('Satoshi');
  });

  it('nested proofs for dynamic values', async () => {
    const result = await target.getHighscorer(42, { enableCcipRead: true });
    expect(result).to.equal('Hal Finney');
  });

  it('nested proofs for long dynamic values', async () => {
    const result = await target.getHighscorer(1, { enableCcipRead: true });
    expect(result).to.equal(
      'Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr.',
    );
  });

  it('nested proofs with lookbehind', async () => {
    const result = await target.getLatestHighscore({ enableCcipRead: true });
    expect(Number(result)).to.equal(12345);
  });

  it('nested proofs with lookbehind for dynamic values', async () => {
    const result = await target.getLatestHighscorer({ enableCcipRead: true });
    expect(result).to.equal('Hal Finney');
  });

  it('mappings with variable-length keys', async () => {
    const result = await target.getNickname('Money Skeleton', {
      enableCcipRead: true,
    });
    expect(result).to.equal('Vitalik Buterin');
  });

  it('nested proofs of mappings with variable-length keys', async () => {
    const result = await target.getPrimaryNickname({ enableCcipRead: true });
    expect(result).to.equal('Hal Finney');
  });

  it('treats uninitialized storage elements as zeroes', async () => {
    const result = await target.getZero({ enableCcipRead: true });
    expect(Number(result)).to.equal(0);
  });

  it('treats uninitialized dynamic values as empty strings', async () => {
    const result = await target.getNickname('Santa', { enableCcipRead: true });
    expect(result).to.equal('');
  });
});
