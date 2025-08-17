const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const { parseUnits } = require("ethers");
const {
  abi: ERC20abi,
} = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const { Wallet, JsonRpcProvider, Interface } = require("ethers");
const { convertQuoteToRoute, getQuote, createConfig } = require("@lifi/sdk");

createConfig({
  integrator: 'EffiSend',
  apiKey: '0264669f-xxxxxxxxxxxxxxxxxxxxxxxxx',
})

const providerSei = new JsonRpcProvider(
  "https://sei-mainnet.g.alchemy.com/v2/xxxxxxxxxxxxxxxxxxxxxxxx"
);

const tokens = [
  {
    name: "Sei Token",
    color: "#9e1a13",
    symbol: "SEI",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    coingecko: "sei-network",
  },
  {
    name: "USDC",
    color: "#2775ca",
    symbol: "USDC",
    address: "0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392",
    decimals: 6,
    coingecko: "usd-coin",
  },
  {
    name: "USDC Noble",
    color: "#2775ca",
    symbol: "USDCN",
    address: "0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1",
    decimals: 6,
    coingecko: "usd-coin",
  },
  {
    name: "Tether",
    color: "#008e8e",
    symbol: "USDT",
    address: "0xB75D0B03c06A926e488e2659DF1A861F860bD3d1",
    decimals: 6,
    coingecko: "tether",
  },
  {
    name: "Frax",
    color: "#202020",
    symbol: "FRAX",
    address: "0x80Eede496655FB9047dd39d9f418d5483ED600df",
    decimals: 18,
    coingecko: "layerzero-bridged-frxusd",
  },
  {
    name: "Wrapped BTC",
    color: "#f09242",
    symbol: "WBTC",
    address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
    decimals: 8,
    coingecko: "wrapped-bitcoin",
  },
  {
    name: "Wrapped Sei",
    color: "#9e1a13",
    symbol: "WSEI",
    address: "0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7",
    decimals: 18,
    coingecko: "wrapped-sei",
  },
  {
    name: "Wrapped ETH",
    color: "#808080",
    symbol: "WETH",
    address: "0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8",
    decimals: 18,
    coingecko: "weth",
  },
]

const chainId = 1329;

const quoteRequest = {
  fromChain: chainId, // Sei
  toChain: chainId, // Sei
  options: {
    order: "CHEAPEST",
  },
};

const contractInterface = new Interface(ERC20abi);

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
      // Inputs
      const { amount, fromToken, toToken } = req.body;
      const { address: addressUser, privateKey: privateKeyUser } = query.docs[0].data();
      // Walllet
      const fromWallet = new Wallet(
        privateKeyUser,
        providerSei
      );
      // Quote and Tokens
      const tokenFrom = tokens.find((token) => token.symbol === fromToken);
      const tokenTo = tokens.find((token) => token.symbol === toToken);
      const quote = await getQuote(
        {
          ...quoteRequest,
          fromAmount: parseUnits(amount, tokenFrom.decimals),
          fromAddress: addressUser,
          fromToken: tokenFrom.address,
          toToken: tokenTo.address,
          toAddress: addressUser
        },
        {
          integrator: "li.fi-playground",
          order: "CHEAPEST",
          bridges: {
            allow: ["relay"],
          },
        }
      );
      const route = convertQuoteToRoute(quote);
      // Bridge Tx
      const bridgeTx = route.steps[0].transactionRequest;
      let hash;
      if (tokenFrom.address === tokens[0].address) { // from Sei to Token
        console.log({
          bridgeTx,
        });
        const tx = await fromWallet.sendTransaction(bridgeTx);
        await waitWithDelay(tx, providerSei);
        console.log(`https://seitrace.com/tx/${tx.hash}`);
        hash = tx.hash;
        console.log(`Operation took ${((Date.now() - start) / 1000).toFixed(2)} seconds`);
      }
      else { // From Token to Any - Approve and Bridge
        const approveTxData = await contractInterface.encodeFunctionData("approve", [
          bridgeTx.to,
          parseUnits(amount, tokenFrom.decimals),
        ]);
        const approveTx = {
          to: tokenFrom.address,
          data: approveTxData,
          from: addressUser,
        };
        console.log({
          approveTx,
          bridgeTx,
        });
        const tx = await fromWallet.sendTransaction(approveTx);
        await waitWithDelay(tx, providerSei);
        console.log(`https://seitrace.com/tx/${tx.hash}`);
        const tx2 = await fromWallet.sendTransaction(bridgeTx);
        await waitWithDelay(tx2, providerSei);
        console.log(`https://seitrace.com/tx/${tx2.hash}`);
        hash = tx2.hash;
        console.log(`Operation took ${((Date.now() - start) / 1000).toFixed(2)} seconds`);
      }
      res.send({
        error: null,
        result: {
          hash
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