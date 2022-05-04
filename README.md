# ✨ So you want to sponsor a contest

This `README.md` contains a set of checklists for our contest collaboration.

Your contest will use two repos: 
- **a _contest_ repo** (this one), which is used for scoping your contest and for providing information to contestants (wardens)
- **a _findings_ repo**, where issues are submitted. 

Ultimately, when we launch the contest, this contest repo will be made public and will contain the smart contracts to be reviewed and all the information needed for contest participants. The findings repo will be made public after the contest is over and your team has mitigated the identified issues.

Some of the checklists in this doc are for **C4 (🐺)** and some of them are for **you as the contest sponsor (⭐️)**.

---

# Contest setup

## ⭐️ Sponsor: Provide contest details

Under "SPONSORS ADD INFO HERE" heading below, include the following:

- [ ] Name of each contract and:
  - [ ] source lines of code (excluding blank lines and comments) in each
  - [ ] external contracts called in each
  - [ ] libraries used in each
- [ ] Describe any novel or unique curve logic or mathematical models implemented in the contracts
- [ ] Does the token conform to the ERC-20 standard? In what specific ways does it differ?
- [ ] Describe anything else that adds any special logic that makes your approach unique
- [ ] Identify any areas of specific concern in reviewing the code
- [ ] Add all of the code to this repo that you want reviewed
- [ ] Create a PR to this repo with the above changes.

---

# Contest prep

## ⭐️ Sponsor: Contest prep
- [ ] Make sure your code is thoroughly commented using the [NatSpec format](https://docs.soliditylang.org/en/v0.5.10/natspec-format.html#natspec-format).
- [ ] Modify the bottom of this `README.md` file to describe how your code is supposed to work with links to any relevent documentation and any other criteria/details that the C4 Wardens should keep in mind when reviewing. ([Here's a well-constructed example.](https://github.com/code-423n4/2021-06-gro/blob/main/README.md))
- [ ] Please have final versions of contracts and documentation added/updated in this repo **no less than 8 hours prior to contest start time.**
- [ ] Ensure that you have access to the _findings_ repo where issues will be submitted.
- [ ] Promote the contest on Twitter (optional: tag in relevant protocols, etc.)
- [ ] Share it with your own communities (blog, Discord, Telegram, email newsletters, etc.)
- [ ] Optional: pre-record a high-level overview of your protocol (not just specific smart contract functions). This saves wardens a lot of time wading through documentation.
- [ ] Delete this checklist and all text above the line below when you're ready.

---

# Alchemix contest details
- $118,750 DAI main award pot
- $6,250 DAI gas optimization award pot
- Join [C4 Discord](https://discord.gg/code4rena) to register
- Submit findings [using the C4 form](https://code4rena.com/contests/2022-05-Alchemix-contest/submit)
- [Read our guidelines for more details](https://docs.code4rena.com/roles/wardens)
- Starts May 05, 2022 00:00 UTC
- Ends May 18, 2022 23:59 UTC

This repo will be made public before the start of the contest. (C4 delete this line when made public)

[ ⭐️ SPONSORS ADD INFO HERE ]

# Contest Scope
This contest is open for two weeks to give wardens time to understand the protocol properly. Submissions can only be made in the second week of the contest. Representatives from gro will be available in the Code Arena Discord to answer any questions during the contest period. The focus for the contest is to try and find any logic errors or ways to drain funds from the protocol in a way that is advantageous for an attacker at the expense of users with funds invested in the protocol. Wardens should assume that governance variables are set sensibly (unless they can find a way to change the value of a governance variable, and not counting social engineering approaches for this).

## Protocol Overview
Alchemix Finance is a future-yield-backed synthetic asset platform and community DAO. The platform gives you advances on your yield farming via a synthetic token that represents a fungible claim on any underlying collateral in the Alchemix protocol. The DAO will focus on funding projects that will help the Alchemix ecosystem grow, as well as the greater Ethereum community.

- ALCX, the protocol governance token used to incentivize pool liquidity for synthetic assets
- gALCX, an autocompounding wrapper for the single-sided farm that can be used in governance
- alUSD, a synthetic stablecoin pegged to $1 issued to users as an advance on their future yield
- alETH, a synthetic token pegged to 1 ETH issued to users as an advance on their future yield

## Smart Contracts

All the contracts in this section are to be reviewed. Any contracts not in this list are to be ignored for this contest. A further breakdown of contracts and their dependencies can be found [here]().

AlchemicTokenV2.sol (228 loc)
CrossChainCanonicalAlchemicTokenV2.sol (22 loc)
CrossChainCanonicalGALCX.sol (19 loc)
gALCX.sol (110 loc)
StakingPools.sol (441 loc)
TransmuterBuffer.sol (571 loc)
TransmuterConduit.sol (43 loc)
TransmuterV2.sol (575 loc)
WETHGateway.sol (96 loc)

AutoleverageCurveFactoryethpool.sol (49 loc)
AutoleverageCurveMetapool.sol (34 loc)
EthAssetManager.sol (724 loc)
ThreePoolAssetManager.sol (1040 loc)

YearnTokenAdapter.sol (58 loc)
FuseTokenAdapterV1.sol (109 loc)
WstETHAdapterV1.sol (148 loc)
RETHAdapterV1.sol (103 loc)
VesperAdapterV1.sol (107 loc)

libraries/
FixedPointMath.sol (181 loc)
Limiters.sol (102 loc)
LiquidityMath.sol (49 loc)
SafeCast.sol (29 loc)
Sets.sol (68 loc)
Tick.sol (120 loc)
TokenUtils.sol (159 loc)

## Potential protocol concerns

## Areas of focus for Wardens

## Tests

A full suite of unit tests is provided for the repo. As Alchemix is in the process of migrating from Hardhat to Foundry, some slight configuration tweaks may be needed to run the suite.

## Mainnet deployment

A working instance of Alchemix v2 has been deployed on Ethereum mainnet in a beta launch, with deposit caps on all vaults. Mint functionality Mint functionality is open for all synthetics, and users are welcome to use and play around with the protocol. But if you want to do do an extensive amount of interactions with the protocol, we would kindly ask you to do so on a fork. All issues should be reported privately via code4rena rather than demonstrated on mainnet to maintain eligibility.

The following contracts are deployed:

alUSD Alchemist: 0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd
alETH Alchemist: 0x062Bf725dC4cDF947aa79Ca2aaCCD4F385b13b5c

Transmuter (DAI): 0xA840C73a004026710471F727252a9a2800a5197F
Transmuter (USDC): 0x49930AD9eBbbc0EB120CCF1a318c3aE5Bb24Df55
Transmuter (USDT): 0xfC30820ba6d045b95D13a5B8dF4fB0E6B5bdF5b9
TransmuterBuffer: 0x1EEd2DbeB9fc23Ab483F447F38F289cA15f79Bac

alUSD AMO: 0x9735f7d3ea56b454b24ffd74c58e9bd85cfad31b
alETH AMO: 0xe761bf731a06fe8259fee05897b2687d56933110

alUSD Conduit: 0xf65a1e41d0491621596d4b61b85e73e38cf7e424
alETH Conduit: 0xefc8a5a82d09d1068d26ad57e2f57c0037c4f20f

yDAI Adaptor: 0xA7AA5BE408B817A516b40Daea7a919664f13f193
yUSDC Adaptor: 0x1D28D426e4e20B9d43130C23252b8eD6F9cB388E
yDAI Adaptor: 0x5951f159eF502f0571A5D7e136a580DcadEa42Eb

gALCX: 0x93dede06ae3b5590af1d4c111bc54c3f717e4b35

Alchemist Whitelist: 0x78537a6CeBa16f412E123a90472C6E0e9A8F1132
Transmuter Whitelist (DAI): 0xdd8AC2d5A739Bb4a591C5b0c7e613B810fE83fF1
Transmuter Whitelist(USDC): 0x35b2c16de6F283Ab0949964d90cCf930f378ade6
Transmuter Whitelist (USDT): 0x46f992D00C2Dfb6FbbbB64d69Ab353c2fC435ACE
