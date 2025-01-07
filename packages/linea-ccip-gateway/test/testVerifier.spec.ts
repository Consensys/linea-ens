import { Server } from '@chainlink/ccip-read-server';
import { makeL2Gateway } from '../src';
import { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider';
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';
import { expect } from 'chai';
import {
  BrowserProvider,
  Contract,
  ethers,
  FallbackProvider,
  FetchRequest,
  JsonRpcProvider,
  Signer,
} from 'ethers';
import { ethers as ethersHardhat } from 'hardhat';
import { EthereumProvider } from 'hardhat/types';
import request from 'supertest';
import {
  CHAIN_ID_L1,
  CHAIN_ID_L2,
  L1_RPC_URL,
  L2_RPC_URL,
  L2_TEST_CONTRACT_ADDRESS,
  ROLLUP_SEPOLIA_ADDRESS,
} from './constants';

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
  let l2Provider: JsonRpcProvider;
  let l1SepoliaProvider: JsonRpcProvider;
  let signer: Signer;
  let target: Contract;

  before(async () => {
    l1Provider = new ethersHardhat.BrowserProvider(
      ethersHardhat.provider._hardhatProvider,
    );
    l2Provider = new ethersHardhat.JsonRpcProvider(L2_RPC_URL, CHAIN_ID_L2, {
      staticNetwork: true,
    });
    l1SepoliaProvider = new ethersHardhat.JsonRpcProvider(
      L1_RPC_URL,
      CHAIN_ID_L1,
      {
        staticNetwork: true,
      },
    );
    signer = await l1Provider.getSigner(0);

    const Rollup = await ethersHardhat.getContractFactory('RollupMock', signer);

    const rollupSepolia = new ethersHardhat.Contract(
      ROLLUP_SEPOLIA_ADDRESS,
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
      new FallbackProvider([l2Provider]),
      await rollup.getAddress(),
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
