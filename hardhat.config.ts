import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";

import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "@nomiclabs/hardhat-ethers";
import { generateRandomHex } from "./utils/helpers";

// import "./tasks/testnet";
// import "./tasks/admin";
// import "./tasks/keeper";
// import "./tasks/actions";
// import "./tasks/state";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config = {
  solidity: {
    version: "0.8.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
  },
  paths: {
    sources: "./contracts-hardhat",
    tests: "./test-hardhat"
  },
  namedAccounts: {
    alHarvester: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    proxyAdmin: {
      1: "0xE0fC5CB7665041CdA26969A2D1ceb5cD5046347d",
      250: "0xF55DB61d1e65718ac0d5A163B18CCA3645791265"
    },
    dai: {
      1: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      250: "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E",
      1337: "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E"
    },
    usdc: {
      1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      250: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
      1337: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"
    },
    usdt: {
      1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      250: "0x049d68029688eAbF473097a2fC38ef61633A3C7A", // fUSDT
      1337: "0x049d68029688eAbF473097a2fC38ef61633A3C7A"
    },
    ydai: {
      1: "0xdA816459F1AB5631232FE5e97a05BBBb94970c95",
      250: "0x637eC617c86D24E421328e6CAEa1d92114892439",
      1337: "0x637eC617c86D24E421328e6CAEa1d92114892439"
    },
    yusdc: {
      1: "0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE",
      250: "0xEF0210eB96c7EB36AF8ed1c20306462764935607",
      1337: "0xEF0210eB96c7EB36AF8ed1c20306462764935607"
    },
    yusdt: {
      1: "0x7Da96a3891Add058AdA2E826306D812C638D87a7",
      250: "0x148c05caf1Bb09B5670f00D511718f733C54bC4c",
      1337: "0x148c05caf1Bb09B5670f00D511718f733C54bC4c"
    },
    yweth: "0xa258C4606Ca8206D8aA700cE2143D7db854D168c",
    wsteth: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    reth: "0xae78736Cd615f374D3085123A210448E74Fc6393",
    aleth: "0x0100546F2cD4C9D97f798fFC9755E47865FF7Ee6",
    alusd: {
      1: "0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9",
      250: "0xB67FA6deFCe4042070Eb1ae1511Dcd6dcc6a532E",
      1337: "0xB67FA6deFCe4042070Eb1ae1511Dcd6dcc6a532E"
    },
    treasuryMultisig: {
      1: "0x8392F6669292fA56123F71949B52d883aE57e225",
      250: "0x6b291CF19370A14bbb4491B01091e1E29335e605",
      1337: "0x6b291CF19370A14bbb4491B01091e1E29335e605"
    },
    devMultisig: {
      1: "0x9e2b6378ee8ad2A4A95Fe481d63CAba8FB0EBBF9",
      250: "0x6b291CF19370A14bbb4491B01091e1E29335e605",
      1337: "0x6b291CF19370A14bbb4491B01091e1E29335e605"
    },
    usdcMinter: "0x5b6122c109b78c6755486966148c1d70a50a47d7",
    usdtMinter: "0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828",
    vb: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    deployer: 0,
    governance: 1,
    sentinel: 3,
    teSentinel: '0x4C7815E39cdfB7e335708901e66101B657D67e62',
    scSentinel: '0xf872703F1C8f93fA186869Bac83BAC5A0c87C3c8',
    goSentinel: '0xFfaA3CdA4f169d33291Dd9ddbea8578d1398430E',
    noSentinel: '0x391Fb1b5BabD261Cd0C42B91460859F546D7CA9b',
    foSentinel: '0x13C716188C38CE27B9B2b672a59543cf1170EabE',
    n4Sentinel: '0x15962221e0E7A41dE9Da1615f9cb64cBfFF83408',
    testnetUser1: '0xa12358e39c9cA9d190a5c60130a64c06211bCcBa',
    testnetUser2: '0x526D542FFBAe26D510cD610b8050438586fd203C'
  },
  networks: {
    coverage: {
      url: "http://localhost:8555",
      gas: 15000000000,
      gasPrice: 80000000000,
      baseFee: 1,
    },
    fantom: {
      chainId: 250,
      url: "https://rpc.ankr.com/fantom",
      accounts: [process.env.FANTOM_DEPLOYER_PK || generateRandomHex(64)],
      gasPrice: 2501000000000, // 2501 gwei
    },
    mainnet: {
      chainId: 1,
      hardfork: "london",
      gasPrice: 100000000000,
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env["ALCHEMY_API_KEY"]}`,
      timeout: 60000000,
      accounts: [process.env.MAINNET_DEPLOYER_PK || generateRandomHex(64)]
    },
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: false,
      hardfork: "london",
      accounts: [
        {
          privateKey: process.env.MAINNET_DEPLOYER_PK || generateRandomHex(64),
          balance: "1000000000000000000000000",
        },
        {
          privateKey: process.env.MAINNET_SENTINEL_PK || generateRandomHex(64),
          balance: "2000000000000000000000000",
        },
        {
          privateKey: process.env.MAINNET_CRVGUY_PK || generateRandomHex(64),
          balance: "3000000000000000000000000",
        },
        {
          privateKey: generateRandomHex(64),
          balance: "3000000000000000000000000",
        },
        {
          privateKey: generateRandomHex(64),
          balance: "3000000000000000000000000",
        },
        {
          privateKey: generateRandomHex(64),
          balance: "3000000000000000000000000",
        },
        {
          privateKey: generateRandomHex(64),
          balance: "3000000000000000000000000",
        },
        {
          privateKey: generateRandomHex(64),
          balance: "3000000000000000000000000",
        },
      ],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

if (process.env.FORK) {
  let forking;
  if (process.env.ALCHEMY_API_KEY) {
    forking = {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
    };
  } else {
    forking = {
      url: `${process.env.RPC}`,
    };
  }
  if (process.env.FORK_BLOCK) {
    Object.assign(forking, { blockNumber: Number(process.env.FORK_BLOCK) });
  }
  config.networks.hardhat = Object.assign({}, config.networks.hardhat, {
    forking: forking,
  });
}

export default config;
