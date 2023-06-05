import { Command } from 'commander';
import { ethers } from 'ethers';
import { REGISTRY_ADDRESS } from './constants';

const program = new Command();
program
  .requiredOption(
    '-r --registry <address>',
    'ENS registry address',
    REGISTRY_ADDRESS
  )
  .option(
    '-l1 --l1_provider_url <url1>',
    'L1_PROVIDER_URL',
    'http://127.0.0.1:8545/'
  )
  .option('-i --chainId <chainId>', 'chainId', '31337')
  .option('-n --chainName <chainName>', 'chainName', 'unknown')
  .option('-d --debug', 'debug', false)
  .argument('<name>');

program.parse(process.argv);
const options = program.opts();
const ensAddress = options.registry;
const chainId = parseInt(options.chainId);
const { chainName, l1_provider_url, debug } = options;
console.log('Options:', {
  l1_provider_url,
  ensAddress,
  chainId,
  chainName,
  debug,
});

const provider = new ethers.providers.JsonRpcProvider(l1_provider_url, {
  chainId,
  name: chainName,
  ensAddress,
});

(async () => {
  const name = program.args[0];
  console.log('Subdomain name:', name);
  const node = ethers.utils.namehash(name);
  console.log('Subdomain node:', node);
  const resolverFound = await provider.getResolver(name);
  console.log('Resolver found at address:', resolverFound?.address);

  if (resolverFound) {
    let ethAddress = await resolverFound.getAddress();
    console.log('ETH address for ', name, 'is:', ethAddress);
  } else {
    console.log('No resolver found for:', name);
  }
})();
