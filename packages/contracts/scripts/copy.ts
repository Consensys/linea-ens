import * as fs from "fs";
import * as path from "path";

export const copyAbiToGateway = () => {
  const fromDir = path.join(__dirname, "../artifacts/contracts/l1/LineaResolverStub.sol");
  const toDir = path.join(__dirname, "../../gateway/abi");

  const jsonFile = fs.readFileSync(path.join(fromDir, "IResolverService.json"), {
    encoding: "utf8",
  });

  fs.writeFileSync(path.join(toDir, "IResolverService.json"), jsonFile);
};
