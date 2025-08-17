const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const {
  abi: abiERC20,
} = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const { Wallet, Contract, parseUnits } = require("ethers");
const { DynamicProvider, FallbackStrategy } = require("ethers-dynamic-provider");

const db = new Firestore({
  projectId: "effisend",
  keyFilename: "credential.json",
});

const Accounts = db.collection("AccountsSei");

const rpcs = [
    "https://sei-mainnet.g.alchemy.com/v2/hvxo_YG7D-gESwdXBI_D_",
    "https://sei-evm-rpc.publicnode.com",
    "https://evm-rpc.sei-apis.com",
    "https://sei.drpc.org",
]

const provider = new DynamicProvider(rpcs, {
  strategy: new FallbackStrategy(),
});

const wallet = new Wallet("0x0000000000000000000000000000000000000000000000000000000000000000", provider);

const contract = new Contract("0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1", abiERC20, wallet)

functions.http('helloHttp', async (req, res) => {
    try {
        const _address = req.body.address
        let query = await Accounts.where("address", "==", _address).get();
        if (!query.empty) {
            const { rewards, user } = query.docs[0].data();
            if (rewards <= 0) {
                throw "NO REWARDS"
            }
            const tx = await contract.transfer(_address, parseUnits(rewards, 6));
            const dataFrameTemp = query.docs[0].data();
            const dataframe = {
                ...dataFrameTemp,
                rewards: "0"
            }
            await Accounts.doc(user).set(dataframe);
            res.send({
                error: null,
                result: {
                    hash: tx.hash
                }
            });
        } else {
            res.send({
                error: "BAD ADDRESS",
                result: null
            });
        }
    }
    catch (e) {
        console.log(e)
        res.send({
            error: "BAD REQUEST",
            result: null
        });
    }
});


