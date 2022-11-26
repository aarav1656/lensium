const { Framework } = require("../node_modules/@superfluid-finance/sdk-core");
const ethers = require("ethers");
require("dotenv").config();
const MUMBAI_API = process.env.NEXT_PUBLIC_ALCHEMY_MUMBAI_API;
const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY1;
const provider = new ethers.providers.AlchemyProvider(
  "maticmum",
   MUMBAI_API
);

const sf = await Framework.create({
  chainId: 80001,
  provider
});
async function sendStream() {
  const signer = sf.createSigner({ privateKey: PRIVATE_KEY, provider });
  const createFlowOperation = sf.cfaV1.createFlow({
    sender: "0x69A0d70271fb5C402a73125D95fadA17C55aD89A",
    receiver: "0xD6E5C56b74841d333938860F7949faa8F991d88D",
    superToken: "0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00",
    flowRate: "1000000000"
  });
  const txnResponse = await createFlowOperation.exec(signer);
  const txnReceipt = await txnResponse.wait();
  console.log(txnReceipt);

}
async function deleteStream(){

  sf.cfaV1.deleteFlow({
    sender: "string",
    receiver: "string",
    superToken: "string",
    //userData: string
  });

}


const run= async () => {
  try {
    await sendStream();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();



//   // Read functions
// await sf.cfaV1.getFlow({
//   superToken: string,
//   sender: string,
//   receiver: string,
//   providerOrSigner: ethers.providers.Provider | ethers.Signer
// });

// await sf.cfaV1.getAccountFlowInfo({
//   superToken: string,
//   account: string,
//   providerOrSigner: ethers.providers.Provider | ethers.Signer
// });

// await sf.cfaV1.getNetFlow({
//   superToken: string,
//   account: string,
//   providerOrSigner: ethers.providers.Provider | ethers.Signer
// });


// // Write operations
// sf.cfaV1.createFlow({
//   sender: string,
//   receiver: string,
//   superToken: string,
//   flowRate: string,
//   userData?: string
// });

// sf.cfaV1.updateFlow({
//   sender: string,
//   receiver: string,
//   superToken: string,
//   flowRate: string,
//   userData?: string
// });

// sf.cfaV1.deleteFlow({
//   sender: string,
//   receiver: string,
//   superToken: string,
//   userData?: string
// });

// //ACL Usage

// sf.cfaV1.updateFlowOperatorPermissions({
//   flowOperator: string,
//   permissions: number, // should enter 1-7
//   flowRateAllowance: string,
//   superToken: string
// });

// sf.cfaV1.revokeFlowOperatorPermissions({
//   flowOperator: string,
//   superToken: string
// })

// sf.cfav1.createFlowByOperator({
//   sender: string,
//   receiver: string,
//   flowRate: string,
//   superToken: string,
//   userData?: string
// });

// sf.cfaV1.updateFlowByOperator({
//   sender: string,
//   receiver: string,
//   flowRate: string,
//   superToken: string,
//   userData?: string
// });

// sf.cfaV1.deleteFlowByOperator({
//   sender: string,
//   receiver: string,
//   superToken: string,
//   userData?: string
// })
// }

