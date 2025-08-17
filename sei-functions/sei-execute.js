const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const {
    abi: abiERC20,
} = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const { DynamicProvider, FallbackStrategy } = require("ethers-dynamic-provider");
const { parseEther, parseUnits, Interface, Wallet } = require("ethers")

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

functions.http('helloHttp', async (req, res) => {
    try {
        let query = await Accounts.where("user", "==", req.body.user).get();
        if (query.empty) {
            throw "BAD USER"
        }
        const { privateKey } = query.docs[0].data();
        const wallet = new Wallet(privateKey, provider);
        let transaction;
        if (req.body.token === 0) {
            transaction = {
                to: req.body.destination,
                value: parseEther(req.body.amount)
            }
        } else {
            const interface = new Interface(abiERC20);
            const data = interface.encodeFunctionData("transfer", [
                req.body.destination,
                parseUnits(
                    req.body.amount,
                    tokens[req.body.token].decimals
                ),
            ]);
            transaction = {
                to: tokens[req.body.token].address,
                data
            }
        }
        const result = await wallet.sendTransaction(transaction)
        res.send({
            error: null,
            result: result.hash,
        });
    }
    catch (e) {
        console.log(e);
        res.send({
            error: "Bad Request",
            result: null,
        });
    }
});
