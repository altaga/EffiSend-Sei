const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const { parseUnits } = require("ethers");
const {
    abi: ERC20abi,
} = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const { Wallet, JsonRpcProvider, Interface } = require("ethers");
const { convertQuoteToRoute, getQuote, createConfig } = require("@lifi/sdk");
const { Contract } = require("ethers");

createConfig({
  integrator: 'EffiSend',
  apiKey: '0264669f-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
})

const providerSei = new JsonRpcProvider(
    "https://sei-mainnet.g.alchemy.com/v2/xxxxxxxxxxxxxxxx"
);
const providerLinea = new JsonRpcProvider(
    "https://linea-mainnet.g.alchemy.com/v2/xxxxxxxxxxxxxxxxxx"
);

const quoteRequest = {
    fromChain: 1329, // Sei
    toChain: 59144, // Linea
    fromToken: "0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1", // USDT on Sei
    toToken: "0x176211869ca2b568f2a7d4ee941e073a821ee1ff", // USDC on Linea
};

const contractInterface = new Interface(ERC20abi);
const USDClinea = new Contract(
    "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
    ERC20abi,
    providerLinea
);

const db = new Firestore({
    projectId: "effisend",
    keyFilename: "credential.json",
});

const Accounts = db.collection("AccountsSei");

functions.http('helloHttp', async (req, res) => {
    try {
        const start = Date.now();
        const user = req.body.user
        let query = await Accounts.where("user", "==", user).get();
        if (!query.empty) {
            const { amount, to: toAddress } = req.body;
            const { address: addressUser, privateKey: privateKeyUser } = query.docs[0].data();
            const quote = await getQuote(
                {
                    ...quoteRequest,
                    fromAmount: parseUnits(amount, 6),
                    fromAddress: addressUser,
                    toAddress,
                    allowBridges:["relay"],
                    order:"CHEAPEST"
                }
            );
            const route = convertQuoteToRoute(quote);
            // Bridge Tx
            const bridgeTx = route.steps[0].transactionRequest;
            // Approve Tx
            const approveTxData = await contractInterface.encodeFunctionData("approve", [
                bridgeTx.to,
                parseUnits(amount, 6),
            ]);
            const approveTx = {
                to: quoteRequest.fromToken,
                data: approveTxData,
                from: addressUser,
            };
            console.log({
                approveTx,
                bridgeTx,
            });
            const fromWallet = new Wallet(
                privateKeyUser,
                providerSei
            );
            const tx = await fromWallet.sendTransaction(approveTx);
            await waitWithDelay(tx, providerSei);
            console.log(`https://seitrace.com/tx/${tx.hash}`);
            const startBalance = await USDClinea.balanceOf(toAddress);
            const tx2 = await fromWallet.sendTransaction(bridgeTx);
            await waitWithDelay(tx2, providerSei);
            console.log(`https://seitrace.com/tx/${tx2.hash}`);
            console.log("Waiting for balance to change");
            while (true) {
                const currectBalance = await USDClinea.balanceOf(toAddress);
                if (currectBalance > startBalance) {
                    console.log(`.`);
                    console.log(`Balance changed from ${startBalance} to ${currectBalance}`);
                    break;
                }
                process.stdout.write(".");
                if (Date.now() - start > 120000) {
                    throw new Error(
                        "Balance has not changed in 2 minutes, something went wrong"
                    );
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            console.log(`Operation took ${((Date.now() - start) / 1000).toFixed(2)} seconds`);
            res.send({
                error: null,
                result: {
                    hash: tx.hash
                }
            });
        } else {
            console.log(e)
            res.send({
                error: "BAD USER",
                result: null
            });
        }
    }
    catch (e) {
        console.log(e)
        res.send({
            error: "BAD ERROR",
            result: null
        });
    }
});

async function waitWithDelay(tx, provider, delayMs = 1000) {
  const txHash = tx.hash;
  while (true) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && receipt.blockNumber) {
      return receipt;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}