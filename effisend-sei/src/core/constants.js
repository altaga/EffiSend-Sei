import { Dimensions, Image, PixelRatio, Platform } from "react-native";
// Blockchain
import SEI from "../assets/logos/sei.png";
import USDC from "../assets/logos/usdc.png";
import USDT from "../assets/logos/usdt.png";
import WETH from "../assets/logos/weth.png";
import WBTC from "../assets/logos/wbtc.png";
import FRAX from "../assets/logos/frax.png";

const normalizeFontSize = (size) => {
  let { width, height } = Dimensions.get("window");
  if (Platform.OS === "web" && height / width < 1) {
    width /= 2.3179;
    height *= 0.7668;
  }
  const scale = Math.min(width / 375, height / 667); // Based on a standard screen size
  return PixelRatio.roundToNearestPixel(size * scale);
};

const w = normalizeFontSize(50);
const h = normalizeFontSize(50);

export const refreshTime = 1000 * 60 * 0.25;

export const USDCicon = (
  <Image source={USDC} style={{ width: 30, height: 30, borderRadius: 10 }} />
);

export const iconsBlockchain = {
  usdc: (
    <Image source={USDC} style={{ width: w, height: h, borderRadius: 10 }} />
  ),
  usdt: (
    <Image source={USDT} style={{ width: w, height: h, borderRadius: 10 }} />
  ),
  weth: (
    <Image source={WETH} style={{ width: w, height: h, borderRadius: 10 }} />
  ),
  wbtc: (
    <Image source={WBTC} style={{ width: w, height: h, borderRadius: 10 }} />
  ),
  sei: <Image source={SEI} style={{ width: w, height: h, borderRadius: 10 }} />,
  frax: (
    <Image source={FRAX} style={{ width: w, height: h, borderRadius: 10 }} />
  ),
};

export const blockchain = {
  network: "Sei Blockchain",
  token: "SEI",
  chainId: 1329,
  blockExplorer: "https://seistream.app/",
  rpc: [
    "https://sei-evm-rpc.publicnode.com",
    "https://evm-rpc.sei-apis.com",
    "https://sei.drpc.org",
  ],
  iconSymbol: "sei",
  decimals: 18,
  batchBalancesAddress: "0x7e84101f9505c06EBA72e010603507fFa30B4B54",
  color: "#9e1a13",
  tokens: [
    {
      name: "Sei Token",
      color: "#9e1a13",
      symbol: "SEI",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      icon: iconsBlockchain.sei,
      coingecko: "sei-network",
    },
    {
      name: "USD Coin",
      color: "#2775ca",
      symbol: "USDC",
      address: "0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392",
      decimals: 6,
      icon: iconsBlockchain.usdc,
      coingecko: "usd-coin",
    },
    {
      name: "USDC Noble",
      color: "#2775ca",
      symbol: "USDCN",
      address: "0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1",
      decimals: 6,
      icon: iconsBlockchain.usdc,
      coingecko: "usd-coin",
    },
    {
      name: "Tether",
      color: "#008e8e",
      symbol: "USDT",
      address: "0xB75D0B03c06A926e488e2659DF1A861F860bD3d1",
      decimals: 6,
      icon: iconsBlockchain.usdt,
      coingecko: "tether",
    },
    {
      name: "Frax",
      color: "#202020",
      symbol: "FRAX",
      address: "0x80Eede496655FB9047dd39d9f418d5483ED600df",
      decimals: 18,
      icon: iconsBlockchain.frax,
      coingecko: "layerzero-bridged-frxusd",
    },
    {
      name: "Wrapped BTC",
      color: "#f09242",
      symbol: "WBTC",
      address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
      decimals: 8,
      icon: iconsBlockchain.wbtc,
      coingecko: "wrapped-bitcoin",
    },
    {
      name: "Wrapped Sei",
      color: "#9e1a13",
      symbol: "WSEI",
      address: "0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7",
      decimals: 18,
      icon: iconsBlockchain.sei,
      coingecko: "wrapped-sei",
    },
    {
      name: "Wrapped ETH",
      color: "#808080",
      symbol: "WETH",
      address: "0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8",
      decimals: 18,
      icon: iconsBlockchain.weth,
      coingecko: "weth",
    },
  ],
};
