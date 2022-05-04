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

### Tokens 

#### AlchemicTokenV2.sol (228 loc)
The synthetic token minted by the protocol as an advance on user's yield.
#### CrossChainCanonicalAlchemicTokenV2.sol (22 loc)
An upgradeable version that is compatible with crosschain bridges.
#### gALCX.sol (110 loc)
An autocompounding wrapper for ALCX that is the crosschain native token.
#### CrossChainCanonicalGALCX.sol (19 loc)
An upgradeable version that is compatible with crosschain bridges.

### Core Protocol
#### AlchemistV2.sol (1752 loc)
The AlchemistV2 is the core contract in any Alchemix debt-system that holds Account data and issues that system's debt tokens. The AlchemistV2 is flexible enough to accept deposits in the form of either yield-bearing-assets or underlying collateral assets (and wrapping said underlying tokens into their yield-bearing form).

An Account in the Alchemist has multiple components. The first 2 data-points to understand are **balances** and **debt**.
**Balances** is a mapping of yieldTokens to the Account's respective balance of Alchemist-shares. **Shares** represent a user's deposit of yieldTokens in the AlchemistV2, and provide an accounting abstraction that helps the AlchemistV2 avoid bank-run scenarios.
**Debt** is an int256 type that represents both the account's **debt** (positive values) and **credit** (negative values).
A Account manages its debt by tracking the **lastAccruedWeights** of the various **depositedTokens** that it is holding.
A Account also has the ability to track **mintAllowances** and **withdrawAllowances** that allow 3rd-party accounts to mint and withdraw its assets.
#### TransmuterBuffer.sol (571 loc)
An interface contract to buffer funds between the Alchemist and the Transmuter.

#### TransmuterV2.sol (575 loc)
The TransmuterV2 is the main contract in any Alchemix debt-system that helps put upward pressure on the price of the debt-token relative to its collateral asset(s) by allowing any market participant to exchange the supported debt-token for underlying collateral at a 1:1 rate.
Each TransmuterV2 supports a single underlyingToken as collateral, and is able to exchange debtToken for only that underlyingToken.
The TransmuterV2 recieves underlyingTokens from the AlchemistV2 whenever any of the repay(), liquidate(), or harvest() functions are called. The repaid, liquidated, or harvested collateral is first sent to the TransmuterBuffer, where excess funds that are not exchanged in the TransmuterV2 can be deposited back into the AlchemistV2 to boost yields for Alchemist depositors, or be deployed elsewhere to help maintain the peg.
When debtTokens are deposited into the TransmuterV2, a user recieves "exchanged tokens" into their account over time, representing the amount of debtToken that has been implicitly converted to underlyingToken that have dripped into the TransmuterV2. This rate of conversion is, at most, the rate that collateral is exchanged into the TransmuterV2 multiplied by their overall percent stake of debtTokens in the TransmuterV2. While collateral recieved from harvest() calls has a relatively stable rate, collateral recieved from repay() and liquidate() functions are entirely user dependent, causing the overall transmutation rate to potentially fluctuate.
Additionally, there is a configurable flow rate in the TransmuterBuffer that can be used to control the flow of transmutable collateral. It acts as another cap on the speed at which funds are exchanged into the TransmuterV2.

### Core Protocol Vault Adapters
#### YearnTokenAdapter.sol (58 loc)
An adapter to invest user tokens into Yearn.
#### FuseTokenAdapterV1.sol (109 loc)
An adapter to invest user tokens into Fuse.
#### WstETHAdapterV1.sol (148 loc)
An adapter to invest user tokens into Lido's wstETH.
#### RETHAdapterV1.sol (103 loc)
An adapter to invest user tokens into Rocket Pool's rETH.
#### VesperAdapterV1.sol (107 loc)
An adapter to invest user tokens into Vesper.

### Automated Market Operator
#### TransmuterConduit.sol (43 loc)
A helper contract for admins to move funds between TransmuterV1 and TransmuterV2 during the protocol upgrade.
#### EthAssetManager.sol (724 loc)
An automated market operator to ensure peg stability on alETH and ETH.
#### ThreePoolAssetManager.sol (1040 loc)
An automated market operator to ensure peg stability on alUSD and stablecoins.

### Staking Rewards
#### StakingPools.sol (441 loc)
A staking contract to give ALCX rewards to various LP and single-sided stakers.

### Helper Contracts
#### WETHGateway.sol (96 loc)
Turns ETH into WETH and deposits into the Alchemist.
#### AutoleverageCurveFactoryethpool.sol (49 loc)
Lets users zap into a leveraged collateralized debt position on alETH.
#### AutoleverageCurveMetapool.sol (34 loc)
Lets users zap into a leveraged collateralized debt position on alUSD.
#### Whitelist.sol (63 loc)
A whitelist used for the beta stage of protocol release, restricts access to all EOAs and certain whitelisted contracts.

### Helper Libraries
#### FixedPointMath.sol (181 loc)
A fixed point math library.
#### Limiters.sol (102 loc)
A library to limit debt taken out in a certain timeframe.
#### LiquidityMath.sol (49 loc)
More fixed point math helpers.
#### SafeCast.sol (29 loc)
Transforms values between int256 and uint256.
#### Sets.sol (68 loc)
Implementation of the set datatype.
#### Tick.sol (120 loc)
Implements a linked-list system for use in calculating users' earned yield as it accrues.
#### TokenUtils.sol (159 loc)
Helper methods for interacting with a broad range of contracts that don't implement the ERC20 spec precisely.

## Potential protocol concerns

## Areas of focus for Wardens

We would like wardens to focus on any core functional logic, boundary case errors or similar issues which could be utilized by an attacker to take funds away from clients who have funds deposited in the protocol. We would also encourage focus on any mathematical accounting that could cause users to receive more or less credit than they should. That said, any errors may be submitted by wardens for review and potential reward as per the normal issue impact prioritization. Gas optimizations are welcome but not the main focus of this contest and thus at most 10% of the contest reward will be allocated to gas optimizations. For gas optimizations the most important flows are client deposit and withdrawal flows.

If wardens are unclear on which areas to look at or which areas are important please feel free to ask in the contest Discord channel.

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
