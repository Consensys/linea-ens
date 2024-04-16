import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  assert,
  beforeAll,
  describe,
  newMockEvent,
  test,
} from "matchstick-as/assembly/index";
import { handleNameUnwrapped } from "../src/nameWrapper";
import { NameUnwrapped } from "../src/types/NameWrapper/NameWrapper";
import { Domain, WrappedDomain } from "../src/types/schema";
import { ETH_NODE } from "../src/utils";
import { DEFAULT_OWNER, setEthOwner } from "./testUtils";

beforeAll(() => {
  setEthOwner();
});

const NAME_WRAPPER_ADDRESS = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
// test.eth
const testEthNamehash =
  "0xeb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1";

const createNameUnwrappedEvent = (
  node: string,
  owner: string
): NameUnwrapped => {
  let mockEvent = newMockEvent();
  let newNameUnwrappedEvent = new NameUnwrapped(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt
  );
  newNameUnwrappedEvent.parameters = new Array();
  let nodeParam = new ethereum.EventParam(
    "node",
    ethereum.Value.fromBytes(Bytes.fromHexString(node))
  );
  let ownerParam = new ethereum.EventParam(
    "owner",
    ethereum.Value.fromAddress(Address.fromString(owner))
  );
  newNameUnwrappedEvent.parameters.push(nodeParam);
  newNameUnwrappedEvent.parameters.push(ownerParam);
  return newNameUnwrappedEvent;
};

describe("handleNameUnwrapped", () => {
  test("does not set expiryDate to null if name is .eth", () => {
    // test
    const labelhash =
      "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658";

    let domain = new Domain(testEthNamehash);
    domain.name = "test.eth";
    domain.labelName = "test";
    domain.labelhash = Bytes.fromHexString(labelhash);
    domain.parent = ETH_NODE;
    domain.subdomainCount = 0;
    domain.isMigrated = true;
    domain.createdAt = BigInt.fromI32(0);
    domain.owner = NAME_WRAPPER_ADDRESS;
    domain.registrant = NAME_WRAPPER_ADDRESS;
    domain.wrappedOwner = DEFAULT_OWNER;
    domain.expiryDate = BigInt.fromI32(123456789);
    domain.save();

    const wrappedDomain = new WrappedDomain(testEthNamehash);
    wrappedDomain.domain = testEthNamehash;
    wrappedDomain.expiryDate = BigInt.fromI32(123456789);
    wrappedDomain.fuses = 0;
    wrappedDomain.owner = DEFAULT_OWNER;
    wrappedDomain.name = "test.eth";
    wrappedDomain.save();

    const nameUnwrappedEvent = createNameUnwrappedEvent(
      testEthNamehash,
      DEFAULT_OWNER
    );

    handleNameUnwrapped(nameUnwrappedEvent);

    assert.fieldEquals("Domain", testEthNamehash, "expiryDate", "123456789");
  });
  test("sets expiryDate to null if name is not .eth", () => {
    // cool.test.eth
    const subNamehash =
      "0x85c47d906feeeed4795f21773ab20983af35e85837d2de39549f650c8fb50c0f";
    // cool
    const labelhash =
      "0x678c189fde5058554d934d6af17e41750fa2a94b61371c5ea958a7595e146324";

    let domain = new Domain(subNamehash);
    domain.name = "cool.test.eth";
    domain.labelName = "cool";
    domain.labelhash = Bytes.fromHexString(labelhash);
    domain.parent = testEthNamehash;
    domain.subdomainCount = 0;
    domain.isMigrated = true;
    domain.createdAt = BigInt.fromI32(0);
    domain.owner = NAME_WRAPPER_ADDRESS;
    domain.registrant = NAME_WRAPPER_ADDRESS;
    domain.wrappedOwner = DEFAULT_OWNER;
    domain.expiryDate = BigInt.fromI32(123456789);
    domain.save();

    const wrappedDomain = new WrappedDomain(subNamehash);
    wrappedDomain.domain = subNamehash;
    wrappedDomain.expiryDate = BigInt.fromI32(123456789);
    wrappedDomain.fuses = 0;
    wrappedDomain.owner = DEFAULT_OWNER;
    wrappedDomain.name = "test.eth";
    wrappedDomain.save();

    const nameUnwrappedEvent = createNameUnwrappedEvent(
      subNamehash,
      DEFAULT_OWNER
    );

    handleNameUnwrapped(nameUnwrappedEvent);

    assert.fieldEquals("Domain", subNamehash, "expiryDate", "null");
  });
});
