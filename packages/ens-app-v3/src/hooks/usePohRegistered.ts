import { Address } from 'viem'
import { useReadContract } from 'wagmi'

import { useContractAddress } from './chain/useContractAddress'

export const usePohRegistered = (address: Address) => {
  const ethRegistrarControllerAddress = useContractAddress({
    contract: 'ensEthRegistrarController',
  })

  return useReadContract({
    abi: [
      {
        inputs: [{ name: '', type: 'address' }],
        name: 'hasRegisteredPoh',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    address: ethRegistrarControllerAddress,
    args: [address],
    functionName: 'hasRegisteredPoh',
  })
}
