import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers, deployments, getNamedAccounts } from "hardhat";
import { legos } from "@studydefi/money-legos";
import { BigNumber, Signer, utils, Contract } from "ethers";
import { AlchemistV2 } from "../../typechain/AlchemistV2";
import {
  YearnTokenAdapter,
  IYearnVaultV2,
  TransmuterV2,
  TransmuterBuffer,
} from "../../typechain";
import { ITetherToken } from "../../typechain/ITetherToken";
import { IWETH9 } from "../../typechain/IWETH9";
import ITetherTokenArtifact from "../../artifacts/contracts/interfaces/external/tether/ITetherToken.sol/ITetherToken.json";
import VaultAPIArtifact from "../../artifacts/contracts/interfaces/external/yearn/IYearnVaultV2.sol/IYearnVaultV2.json";
import { ERC20 } from "../../typechain/ERC20";
import { AlchemicTokenV1 } from "../../typechain/AlchemicTokenV1";
import AlchemicTokenV1Artifact from "../../artifacts/contracts/AlchemicTokenV1.sol/AlchemicTokenV1.json";
import IWETH9Artifact from "../../artifacts/contracts/interfaces/external/IWETH9.sol/IWETH9.json";
import { parseUsdc } from "../../utils/helpers";
import Familiar from "familiar/lib/src/Familiar";

import {
  mintDaiSpell,
  mintDaiSpellArgs,
  whitelistAlchemistAlUSDSpell,
  setCeilingAlUSDSpell,
  mintUsdcSpell,
  issueUsdtSpell,
  mintUsdtSpell,
  buyTokenSpell,
  getBuyUsdcSpellParams,
  getBuyUsdtSpellParams,
  rektYDaiVaultSpell,
} from "../../utils/spells";

const { parseEther, formatEther } = utils;

chai.use(solidity);

const { expect } = chai;

let fam: Familiar;

if (process.env.INTEGRATION_TESTS_ENABLED) {
  ethers.provider = new ethers.providers.JsonRpcProvider(
    "http://localhost:8545"
  );
  fam = new Familiar(process.env.ALCHEMY_API_KEY || "");
  fam.addSpell(mintDaiSpell);
  fam.addSpell(whitelistAlchemistAlUSDSpell);
  fam.addSpell(setCeilingAlUSDSpell);
  fam.addSpell(mintUsdcSpell);
  fam.addSpell(issueUsdtSpell);
  fam.addSpell(mintUsdtSpell);
  fam.addSpell(buyTokenSpell);
  fam.addSpell(rektYDaiVaultSpell);
}

describe("AlchemistV2", () => {
  let signers: Signer[];
  let deployer: Signer;
  let governance: Signer;
  let user: Signer;
  let user2: Signer;
  let alchemist: AlchemistV2;
  let daiToken: ERC20;
  let usdcToken: ERC20;
  let usdtToken: ITetherToken;
  let alusdContract: AlchemicTokenV1;
  let yearnAdapterDai: YearnTokenAdapter;
  let yearnAdapterUsdc: YearnTokenAdapter;
  let yearnAdapterUsdt: YearnTokenAdapter;
  let yDaiVault: IYearnVaultV2;
  let yUsdcVault: IYearnVaultV2;
  let yUsdtVault: IYearnVaultV2;
  let transmuterBuffer: TransmuterBuffer;

  before(async function () {
    if (!process.env.INTEGRATION_TESTS_ENABLED) {
      this.skip();
      return;
    }
    await fam.reset(14309576);
  });

  beforeEach(async function () {
    this.timeout(50000);
    const { alusd, treasuryMultisig, usdt, usdcMinter, usdtMinter, ydai } =
      await getNamedAccounts();
    await deployments.fixture(["alUSD-fixture"]);
    signers = await ethers.getSigners();
    deployer = signers[0];
    governance = signers[1];
    user = signers[2];
    user2 = signers[3];

    // send some funds to treaury for tx costs
    await user.sendTransaction({
      to: treasuryMultisig,
      value: parseEther("1.0"),
    });
    await user.sendTransaction({ to: usdcMinter, value: parseEther("1.0") });
    await user.sendTransaction({ to: usdtMinter, value: parseEther("1.0") });
    await fam.provider.send("hardhat_setBalance", [
      ydai,
      "0x10000000000000000",
    ]);
    const alchemistDeployment = await deployments.get("AlchemistV2");
    alchemist = new Contract(
      alchemistDeployment.address,
      alchemistDeployment.abi,
      deployer
    ) as AlchemistV2;
    daiToken = new Contract(
      legos.erc20.dai.address,
      legos.erc20.dai.abi,
      user
    ) as ERC20;
    usdcToken = new Contract(
      legos.erc20.usdc.address,
      legos.erc20.usdc.abi,
      user
    ) as ERC20;
    usdtToken = new Contract(
      usdt,
      ITetherTokenArtifact.abi,
      user
    ) as ITetherToken;
    alusdContract = new Contract(
      alusd,
      AlchemicTokenV1Artifact.abi,
      user
    ) as AlchemicTokenV1;
    fam.cast("issueUsdt", "usdtMinter", [parseUsdc("1000000000")]);

    const transmuterBufferDeployed = await deployments.get(
      "TransmuterBuffer_alUSD"
    );
    transmuterBuffer = new Contract(
      transmuterBufferDeployed.address,
      transmuterBufferDeployed.abi,
      deployer
    ) as TransmuterBuffer;

    // yearn dai strat
    const yearnAdapterDeploymentDai = await deployments.get("YearnAdapter_DAI");
    yearnAdapterDai = new Contract(
      yearnAdapterDeploymentDai.address,
      yearnAdapterDeploymentDai.abi,
      deployer
    ) as YearnTokenAdapter;

    const yDaiVaultAddress = await yearnAdapterDai.token();
    yDaiVault = new Contract(
      yDaiVaultAddress,
      VaultAPIArtifact.abi,
      deployer
    ) as IYearnVaultV2;

    // yearn usdc strat
    const yearnAdapterDeploymentUsdc = await deployments.get(
      "YearnAdapter_USDC"
    );
    yearnAdapterUsdc = new Contract(
      yearnAdapterDeploymentUsdc.address,
      yearnAdapterDeploymentUsdc.abi,
      deployer
    ) as YearnTokenAdapter;

    const yUsdcVaultAddress = await yearnAdapterUsdc.token();
    yUsdcVault = new Contract(
      yUsdcVaultAddress,
      VaultAPIArtifact.abi,
      deployer
    ) as IYearnVaultV2;

    // yearn usdt strat
    const yearnAdapterDeploymentUsdt = await deployments.get(
      "YearnAdapter_USDT"
    );
    yearnAdapterUsdt = new Contract(
      yearnAdapterDeploymentUsdt.address,
      yearnAdapterDeploymentUsdt.abi,
      deployer
    ) as YearnTokenAdapter;

    const yUsdtVaultAddress = await yearnAdapterUsdt.token();
    yUsdtVault = new Contract(
      yUsdtVaultAddress,
      VaultAPIArtifact.abi,
      deployer
    ) as IYearnVaultV2;
  });

  describe("run deployment", () => {
    it("create the fixture", async () => {
      // this is just here to keep the deployment noise out of the tests
    });
  });

  describe("vault happy paths", () => {
		const yieldableAmt = parseEther("100000");
		const depositAmtUnderlying = parseEther("1005000");
		let depositAmt: BigNumber;
		let userAddress: string;

    beforeEach(async () => {
      userAddress = await user.getAddress();
      await fam
        .as(deployer)
        .cast("mintDai", deployer, mintDaiSpellArgs(yieldableAmt));
      await fam
        .as(user)
        .cast("mintDai", user, mintDaiSpellArgs(depositAmtUnderlying.mul(2)));
      await fam.cast("whitelistAlchemistAlUSD", "treasuryMultisig", [
        alchemist.address,
        true,
      ]);
      await fam.cast("setCeilingAlUSD", "treasuryMultisig", [
        alchemist.address,
        parseEther("100000000"),
      ]); // 100m
      await daiToken
        .connect(user)
        .approve(yDaiVault.address, depositAmtUnderlying);
      await yDaiVault
        .connect(user)
        ["deposit(uint256,address)"](
          depositAmtUnderlying,
          await user.getAddress()
        );
      depositAmt = await yDaiVault.balanceOf(await user.getAddress());
    });

    describe("yearn", () => {
      describe("DAI", () => {
        it("deposits underlying into the vault", async () => {
          const vaultValueBefore = await yDaiVault.totalAssets();
          await yDaiVault.connect(user).approve(alchemist.address, depositAmt);
          await daiToken
            .connect(user)
            .approve(alchemist.address, depositAmt.mul(2));
          await alchemist
            .connect(user)
            .depositUnderlying(
              yDaiVault.address,
              depositAmt,
              await user.getAddress(),
              "0x00"
            );

          const vaultValueAfter = await yDaiVault.totalAssets();

          expect(vaultValueAfter).equal(vaultValueBefore.add(depositAmt));
        });

        describe("withdraws underlying from the vault", () => {
          let userDaiBalBefore: BigNumber,
            userDaiBalAfter: BigNumber,
            vaultValueBefore: BigNumber,
            vaultValueAfter: BigNumber,
            price: BigNumber,
            withdrawAmt: BigNumber;
          beforeEach(async () => {
            withdrawAmt = depositAmt.div(2);

            await yDaiVault
              .connect(user)
              .approve(alchemist.address, depositAmt);
            await alchemist
              .connect(user)
              .deposit(yDaiVault.address, depositAmt, await user.getAddress());

            vaultValueBefore = await yDaiVault.totalAssets();
            userDaiBalBefore = await daiToken.balanceOf(
              await user.getAddress()
            );

            price = await alchemist.getUnderlyingTokensPerShare(
              yDaiVault.address
            );
            await alchemist
              .connect(user)
              .withdrawUnderlying(
                yDaiVault.address,
                withdrawAmt.mul(parseEther("1")).div(price),
                await user.getAddress(),
                0
              );

            vaultValueAfter = await yDaiVault.totalAssets();
            userDaiBalAfter = await daiToken.balanceOf(await user.getAddress());
          });

          it("withdraws the correct user balance", async () => {
            expect(userDaiBalAfter).closeTo(
              userDaiBalBefore.add(withdrawAmt),
              parseEther("1").div(1000).toNumber()
            );
          });

          it("removes funds from the vault", async () => {
            expect(vaultValueAfter).closeTo(
              vaultValueBefore.sub(withdrawAmt),
              parseEther("1").div(1000).toNumber()
            );
          });

          it("conserves funds between vault and recipient", async () => {
            expect(vaultValueBefore.sub(vaultValueAfter)).equal(
              userDaiBalAfter.sub(userDaiBalBefore)
            );
          });
        });

        it("liquidates from the vault", async () => {
          const mintAmt = depositAmt.div(4);
          const liquidateAmt = depositAmt.div(2); // alchemist will cap liquidation at total debt

          await yDaiVault.connect(user).approve(alchemist.address, depositAmt);
          await alchemist
            .connect(user)
            .deposit(yDaiVault.address, depositAmt, userAddress);

          const vaultValueBefore = await yDaiVault.totalAssets();
          const useryDaiBalBefore = await yDaiVault.balanceOf(
            await user.getAddress()
          );
          const useralusdBalBefore = await alusdContract.balanceOf(
            await user.getAddress()
          );

          await alchemist.connect(user).mint(mintAmt, await user.getAddress());
          await alchemist
            .connect(user)
            .liquidate(yDaiVault.address, liquidateAmt, 0);
          const userPos = await alchemist.positions(
            userAddress,
            yDaiVault.address
          );
          const ydaiPerShare = await alchemist.getYieldTokensPerShare(
            yDaiVault.address
          );
          const userBal = userPos.shares.mul(ydaiPerShare).div(parseEther("1"));
          await alchemist
            .connect(user)
            .withdraw(
              yDaiVault.address,
              userPos.shares,
              await user.getAddress()
            );

          const vaultValueAfter = await yDaiVault.totalAssets();
          const useryDaiBalAfter = await yDaiVault.balanceOf(
            await user.getAddress()
          );
          const useralusdBalAfter = await alusdContract.balanceOf(
            await user.getAddress()
          );

          // expect the value to be very close
          expect(Number(formatEther(useryDaiBalAfter))).closeTo(
            Number(formatEther(useryDaiBalBefore.add(userBal))),
            0.01
          );
          // real value is less than expected value b/c of yvault linear share-price increase
          expect(useryDaiBalAfter).lte(useryDaiBalBefore.add(userBal));
          // rounding issues originate in yearn
          expect(vaultValueAfter).closeTo(
            vaultValueBefore.sub(mintAmt),
            1000000
          );
          expect(useralusdBalAfter).equal(useralusdBalBefore.add(mintAmt));
        });

        it("harvests from the vault", async () => {
          const yieldAmt = parseEther("10000");
          const mintAmt = depositAmt.div(4);

          await yDaiVault.connect(user).approve(alchemist.address, depositAmt);
          await alchemist
            .connect(user)
            .deposit(yDaiVault.address, depositAmt, await user.getAddress());

          await alchemist.connect(user).mint(mintAmt, await user.getAddress());

          const vaultValueInit = await yDaiVault.totalAssets();

          await daiToken
            .connect(deployer)
            .transfer(yDaiVault.address, yieldAmt);

          const cdpDataBefore = await alchemist
            .connect(user)
            .accounts(await user.getAddress());

          await alchemist
            .connect(deployer)
            .harvest(yDaiVault.address, 0);

          await alchemist.poke(await user.getAddress());
          const cdpDataAfter = await alchemist
            .connect(user)
            .accounts(await user.getAddress());

          const vaultValueEnd = await yDaiVault.totalAssets();

          const yieldForAlchemist = yieldAmt
            .mul(depositAmt)
            .div(vaultValueInit);
          const debtYield = yieldForAlchemist.mul(9).div(10);
          const expectedCdpDebt = cdpDataBefore.debt.sub(debtYield);

          // small mergin of error in the way yearn vault distributes yield
          expect(expectedCdpDebt.sub(cdpDataAfter.debt)).lte(parseEther("1"));

          // strat values based on strat.totalValue, which takes into account price per share,
          // which takes into account locked profit in vault, which slowly changes over time
          // this is why we need the error margin
          //
          // vaultValueAfter = vaultValueAfter - alchemistYieldAmt
          // yieldAmt gets sent to transmuter buffer and protocol fee receiver
          expect(
            vaultValueEnd
              .sub(vaultValueInit)
              .add(yieldForAlchemist)
              .sub(yieldAmt)
          ).lte(parseEther("1"));
        });

        describe("rekt vault", () => {
          beforeEach(async () => {
            await daiToken
              .connect(user)
              .approve(alchemist.address, depositAmt.mul(2));
            await alchemist
              .connect(user)
              .depositUnderlying(
                yDaiVault.address,
                depositAmt,
                await user.getAddress(),
                "0x00"
              );
            fam.cast("rektYearnVault", "ydai", [
              "0x0000000000000000000000000000000000000000",
              parseEther("1000000"),
            ]);
          });

          describe("rekt vault assertions", () => {
            it("stops users from depositing", async () => {
              await yDaiVault
                .connect(user)
                .approve(alchemist.address, depositAmt);

              try {
                await alchemist
                  .connect(user)
                  .deposit(yDaiVault.address, depositAmt, userAddress);
              } catch (e: any) {
                expect(e.body).include("LossExceeded");
              }
            }).timeout(50000);

            it("stops users from depositing underlying", async () => {
              const daiDepositAmt = parseEther("100");
              await daiToken
                .connect(user)
                .approve(alchemist.address, daiDepositAmt);

              try {
                await alchemist
                  .connect(user)
                  .depositUnderlying(
                    yDaiVault.address,
                    daiDepositAmt,
                    userAddress,
                    0
                  );
              } catch (e: any) {
                expect(e.body).include("LossExceeded");
              }
            }).timeout(50000);

            it("stops users from withdrawing underlying", async () => {
              try {
                await alchemist
                  .connect(user)
                  .withdrawUnderlying(
                    yDaiVault.address,
                    parseEther("100"),
                    userAddress,
                    utils.defaultAbiCoder.encode(
                      ["tuple(uint256 maxLoss)"],
                      [{ maxLoss: 0 }]
                    )
                  );
              } catch (e: any) {
                expect(e.body).include("LossExceeded");
              }
            }).timeout(50000);

            it("stops users from withdrawing underlying from another account", async () => {
              const user2Address = await user2.getAddress();
              await alchemist
                .connect(user)
                .approveWithdraw(
                  user2Address,
                  yDaiVault.address,
                  parseEther("100")
                );
              try {
                await alchemist
                  .connect(user)
                  .withdrawUnderlyingFrom(
                    userAddress,
                    yDaiVault.address,
                    parseEther("100"),
                    user2Address,
                    utils.defaultAbiCoder.encode(
                      ["tuple(uint256 maxLoss)"],
                      [{ maxLoss: 0 }]
                    )
                  );
              } catch (e: any) {
                expect(e.body).include("LossExceeded");
              }
            }).timeout(50000);

            it("stops users from liquidating", async () => {
              const yTokenData = await alchemist.getYieldTokenParameters(
                yDaiVault.address
              );
              const pps = await yearnAdapterDai.price();
              console.log(
                `expected bal: ${formatEther(yTokenData.expectedValue)}`,
                `current bal: ${formatEther(
                  yTokenData.activeBalance.mul(pps).div(parseEther("1"))
                )}`
              );
              try {
                await alchemist
                  .connect(user)
                  .liquidate(
                    yDaiVault.address,
                    parseEther("100"),
                    utils.defaultAbiCoder.encode(
                      ["tuple(uint256 maxLoss)"],
                      [{ maxLoss: 0 }]
                    )
                  );
              } catch (e: any) {
                expect(e.body).include("LossExceeded");
              }
            }).timeout(50000);
          }).timeout(50000);
        }).timeout(50000);
      }).timeout(50000);
    }).timeout(50000);

    describe("transmuter happy paths", () => {
      const initMintAmtDai = parseEther("10000000");
      const initMintAmtUsdc = parseUsdc("10000000");
      const initMintAmtUsdt = parseUsdc("10000000");
      const yieldableAmt = parseEther("1000000");
      const depositAmtUnderlyingDai = parseEther("10000000");
      const depositAmtUnderlyingUsdc = parseUsdc("10000000");
      let depositAmtDai1: BigNumber;
      let depositAmtDai2: BigNumber;
      let depositAmtUsdc1: BigNumber;
      let depositAmtUsdc2: BigNumber;
      let depositAmtUsdt1: BigNumber;
      let depositAmtUsdt2: BigNumber;
      let transmuter: TransmuterV2;
      let user1Address: string;
      let user2Address: string;
      let deployerAddress: string;

      beforeEach(async () => {
        user1Address = await user.getAddress();
        user2Address = await user2.getAddress();
        deployerAddress = await deployer.getAddress();

        await fam
          .as(deployer)
          .cast("mintDai", deployer, mintDaiSpellArgs(yieldableAmt));

        const wethContract = new Contract(
          "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          IWETH9Artifact.abi,
          deployer
        ) as IWETH9;
        await wethContract.deposit({ value: parseEther("1000") });
        await wethContract.approve(
          "0xE592427A0AEce92De3Edee1F18E0157C05861564",
          parseEther("1000000000")
        );
        const theBlock = await fam.provider.getBlock();
        const blockTimestamp: number = theBlock.timestamp;
        const oneHour = 60 * 60;

        const buyUsdcParams = getBuyUsdcSpellParams(
          deployerAddress,
          (blockTimestamp + oneHour).toString(),
          parseUsdc("1000000")
        );
        await fam.cast("buyToken", deployer, buyUsdcParams);

        // await fam.cast("mintUsdc", "usdcMinter", [deployerAddress, yieldableAmt]);
        const buyUsdtParams = getBuyUsdtSpellParams(
          deployerAddress,
          (blockTimestamp + oneHour).toString(),
          parseUsdc("1000000")
        );
        await fam.cast("buyToken", deployer, buyUsdtParams);
        // await fam.cast("mintUsdt", "usdtMinter", [deployerAddress, yieldableAmt]);

        await fam
          .as(user)
          .cast("mintDai", user, mintDaiSpellArgs(initMintAmtDai));
        await fam
          .as(user2)
          .cast("mintDai", user2, mintDaiSpellArgs(initMintAmtDai));

        await fam.cast("mintUsdc", "usdcMinter", [
          user1Address,
          initMintAmtUsdc,
        ]);
        await fam.cast("mintUsdc", "usdcMinter", [
          user2Address,
          initMintAmtUsdc,
        ]);

        await fam.cast("mintUsdt", "usdtMinter", [
          user1Address,
          initMintAmtUsdt,
        ]);
        await fam.cast("mintUsdt", "usdtMinter", [
          user2Address,
          initMintAmtUsdt,
        ]);

        await fam.cast("whitelistAlchemistAlUSD", "treasuryMultisig", [
          alchemist.address,
          true,
        ]);
        await fam.cast("setCeilingAlUSD", "treasuryMultisig", [
          alchemist.address,
          parseEther("100000000"),
        ]); // 100m

        const transmuterV2Deployment = await deployments.get(
          "TransmuterV2_DAI"
        );
        transmuter = new Contract(
          transmuterV2Deployment.address,
          transmuterV2Deployment.abi,
          deployer
        ) as TransmuterV2;

        await daiToken
          .connect(user)
          .approve(yDaiVault.address, depositAmtUnderlyingDai);
        await yDaiVault
          .connect(user)
          ["deposit(uint256,address)"](depositAmtUnderlyingDai, user1Address);
        depositAmtDai1 = await yDaiVault.balanceOf(user1Address);
        await daiToken
          .connect(user2)
          .approve(yDaiVault.address, depositAmtUnderlyingDai);
        await yDaiVault
          .connect(user2)
          ["deposit(uint256,address)"](depositAmtUnderlyingDai, user2Address);
        depositAmtDai2 = await yDaiVault.balanceOf(user2Address);

        await usdcToken
          .connect(user)
          .approve(yUsdcVault.address, depositAmtUnderlyingUsdc);
        await yUsdcVault
          .connect(user)
          ["deposit(uint256,address)"](depositAmtUnderlyingUsdc, user1Address);
        depositAmtUsdc1 = await yUsdcVault.balanceOf(user1Address);
        await usdcToken
          .connect(user2)
          .approve(yUsdcVault.address, depositAmtUnderlyingUsdc);
        await yUsdcVault
          .connect(user2)
          ["deposit(uint256,address)"](depositAmtUnderlyingUsdc, user2Address);
        depositAmtUsdc2 = await yUsdcVault.balanceOf(user2Address);

        await usdtToken
          .connect(user)
          .approve(yUsdtVault.address, depositAmtUnderlyingUsdc);
        await yUsdtVault
          .connect(user)
          ["deposit(uint256,address)"](depositAmtUnderlyingUsdc, user1Address);
        depositAmtUsdt1 = await yUsdtVault.balanceOf(user1Address);
        await usdtToken
          .connect(user2)
          .approve(yUsdtVault.address, depositAmtUnderlyingUsdc);
        await yUsdtVault
          .connect(user2)
          ["deposit(uint256,address)"](depositAmtUnderlyingUsdc, user2Address);
        depositAmtUsdt2 = await yUsdtVault.balanceOf(user2Address);

        await yDaiVault
          .connect(user)
          .approve(alchemist.address, depositAmtDai1);
        await yDaiVault
          .connect(user2)
          .approve(alchemist.address, depositAmtDai2);
        await yUsdcVault
          .connect(user)
          .approve(alchemist.address, depositAmtUsdc1);
        await yUsdcVault
          .connect(user2)
          .approve(alchemist.address, depositAmtUsdc2);
        await yUsdtVault
          .connect(user)
          .approve(alchemist.address, depositAmtUsdt1);
        await yUsdtVault
          .connect(user2)
          .approve(alchemist.address, depositAmtUsdt2);

        await transmuterBuffer
          .connect(deployer)
          .setWeights(
            alusdContract.address,
            [yDaiVault.address, yUsdcVault.address],
            [1, 2]
          );
      });

      it("exchanges collateral correctly", async () => {
        const mintAmt1 = parseEther("200000");
        const mintAmt2 = parseEther("500000");
        const liqAmt1 = mintAmt1.div(2);
        const liqAmt2 = mintAmt2.div(2);

        await alchemist
          .connect(user)
          .deposit(yDaiVault.address, depositAmtDai1, user1Address);
        await alchemist
          .connect(user2)
          .deposit(yDaiVault.address, depositAmtDai2, user2Address);

        await alchemist.connect(user).mint(mintAmt1, user1Address);
        await alchemist.connect(user2).mint(mintAmt2, user2Address);

        await alusdContract.connect(user).approve(transmuter.address, mintAmt1);
        await alusdContract
          .connect(user2)
          .approve(transmuter.address, mintAmt2);

        await transmuter.connect(user).deposit(mintAmt1, user1Address);
        await transmuter.connect(user2).deposit(mintAmt2, user2Address);

        const theBlock = await fam.provider.getBlock();
        const blockTimestamp: number = theBlock.timestamp;
        const timePassed = 60 * 60 * 24;
        await fam.setNextBlockTimestamp(timePassed + blockTimestamp);

        await alchemist
          .connect(user)
          .liquidate(yDaiVault.address, liqAmt1, 0);
        await alchemist
          .connect(user2)
          .liquidate(yDaiVault.address, liqAmt2, 0);

        const user1Exchanged = await transmuter
          .connect(user)
          .getExchangedBalance(user1Address);
        const user2Exchanged = await transmuter
          .connect(user2)
          .getExchangedBalance(user2Address);

        await transmuter.connect(user).claim(user1Exchanged, user1Address);
        await transmuter.connect(user2).claim(user2Exchanged, user2Address);

        const user1Bal = await daiToken.balanceOf(user1Address);
        const user2Bal = await daiToken.balanceOf(user2Address);

        // there are currently some small rounding errors in the way the transmuter handles exchange()
        // on the order of 1wei * order of the exchanged amount
        // we check for this with an acceptable margin
        const expectedUser1Bal = liqAmt1
          .add(liqAmt2)
          .mul(mintAmt1)
          .div(mintAmt1.add(mintAmt2));
        const expectedUser2Bal = liqAmt1
          .add(liqAmt2)
          .mul(mintAmt2)
          .div(mintAmt1.add(mintAmt2));
        expect(user1Bal).closeTo(expectedUser1Bal, 1000000);
        expect(user2Bal).closeTo(expectedUser2Bal, 1000000);
      }).timeout(50000);

      it("burns its credit in the alchemist", async () => {
        const ydaiYieldAmt = parseEther("100000");
        const yusdcYieldAmt = parseUsdc("200000");
        const yusdtYieldAmt = parseUsdc("300000");

        const mintAmt1 = parseEther("400000");
        const mintAmt2 = parseEther("600000");

        const u1daiDepositYearn = parseEther("500000");
        const u2daiDepositYearn = parseEther("400000");
        const u1usdcDeposit = parseUsdc("500000");
        const u2usdcDeposit = parseUsdc("1000000");
        const u1usdtDeposit = parseUsdc("500000");
        const u2usdtDeposit = parseUsdc("1000000");
        // let u1daiDepositAave = parseEther("200000");
        // let u2daiDepositAave = parseEther("600000");

        const liqAmt1Dai = parseEther("10000");
        const liqAmt1Usdc = parseUsdc("10000");

        /*
                  Users deposit funds
              */

        await alchemist
          .connect(user)
          .deposit(yDaiVault.address, u1daiDepositYearn, user1Address);
        await alchemist
          .connect(user2)
          .deposit(yDaiVault.address, u2daiDepositYearn, user2Address);
        await alchemist
          .connect(user)
          .deposit(yUsdcVault.address, u1usdcDeposit, user1Address);
        await alchemist
          .connect(user2)
          .deposit(yUsdcVault.address, u2usdcDeposit, user2Address);
        await alchemist
          .connect(user)
          .deposit(yUsdtVault.address, u1usdtDeposit, user1Address);
        await alchemist
          .connect(user2)
          .deposit(yUsdtVault.address, u2usdtDeposit, user2Address);
        // await alchemist.connect(user).deposit(3, u1daiDepositAave, user1Address);
        // await alchemist.connect(user2).deposit(3, u2daiDepositAave, user2Address);

        /*
                  Users mint debt
              */
        await alchemist.connect(user).mint(mintAmt1, user1Address);
        await alchemist.connect(user2).mint(mintAmt2, user2Address);

        /*
            Users liquidate collateral (send to transmuter buffer)
        */
        await alchemist
          .connect(user)
          .liquidate(yDaiVault.address, liqAmt1Dai, 0);
        await alchemist
          .connect(user)
          .liquidate(yUsdcVault.address, liqAmt1Usdc, 0);
        await alchemist
          .connect(user)
          .liquidate(yUsdtVault.address, liqAmt1Usdc, 0);
        // await alchemist.connect(user).liquidate(3, liqAmt1Dai);
        await alchemist
          .connect(user2)
          .liquidate(yDaiVault.address, liqAmt1Dai, 0);
        await alchemist
          .connect(user2)
          .liquidate(yUsdcVault.address, liqAmt1Usdc, 0);
        await alchemist
          .connect(user2)
          .liquidate(yUsdtVault.address, liqAmt1Usdc, 0);
        // await alchemist.connect(user2).liquidate(3, liqAmt1Dai);

        /*
                  Transmuter buffer deposits funds back into alchemist
              */
        const daiBal = await daiToken.balanceOf(transmuterBuffer.address);
        const usdcBal = await usdcToken.balanceOf(transmuterBuffer.address);
        const usdtBal = await usdtToken.balanceOf(transmuterBuffer.address);
  
        const curExDai = await transmuterBuffer.currentExchanged(daiToken.address);
        const curExUsdc = await transmuterBuffer.currentExchanged(usdcToken.address);
        const curExUsdt = await transmuterBuffer.currentExchanged(usdtToken.address);

        await transmuterBuffer
          .connect(deployer)
          .depositFunds(daiToken.address, daiBal.sub(curExDai));
        await transmuterBuffer
          .connect(deployer)
          .depositFunds(usdcToken.address, usdcBal.sub(curExUsdc));
        await transmuterBuffer
          .connect(deployer)
          .depositFunds(usdtToken.address, usdtBal.sub(curExUsdt));

        /*
                  Generate yield
              */
        await daiToken
          .connect(deployer)
          .transfer(yDaiVault.address, ydaiYieldAmt);
        await usdcToken
          .connect(deployer)
          .transfer(yUsdcVault.address, yusdcYieldAmt);
        await usdtToken
          .connect(deployer)
          .transfer(yUsdtVault.address, yusdtYieldAmt);

        const theBlock = await fam.provider.getBlock();
        const blockTimestamp: number = theBlock.timestamp;
        const timePassed = 60 * 60 * 24 * 2;
        await fam.setNextBlockTimestamp(timePassed + blockTimestamp);
        await alchemist
          .connect(deployer)
          .harvest(yDaiVault.address, 0);
        await alchemist
          .connect(deployer)
          .harvest(yUsdcVault.address, 0);
        await alchemist
          .connect(deployer)
          .harvest(yUsdtVault.address, 0);
        // await alchemist.connect(deployer).harvest(3);

        /*
                  Poke cdps
              */
        await alchemist.poke(user1Address);
        await alchemist.poke(user2Address);
        await alchemist.poke(transmuterBuffer.address);

        const user1DataBefore = await alchemist
          .connect(user)
          .accounts(user1Address);
        const user2DataBefore = await alchemist
          .connect(user2)
          .accounts(user2Address);
        const transmuterBufferData = await alchemist
          .connect(user2)
          .accounts(transmuterBuffer.address);

        /*
                  Burn transmuter buffer credit
              */
        await transmuterBuffer.connect(deployer).burnCredit();

        /*
                  Check assertions
              */
        await alchemist.poke(user1Address);
        await alchemist.poke(user2Address);

        const user1DataAfter = await alchemist
          .connect(user)
          .accounts(user1Address);
        const user2DataAfter = await alchemist
          .connect(user2)
          .accounts(user2Address);

        const user1GainedCredit = user1DataBefore.debt.sub(user1DataAfter.debt);
        const user2GainedCredit = user2DataBefore.debt.sub(user2DataAfter.debt);

        const transmuterBufferDataAfter = await alchemist
          .connect(user2)
          .accounts(transmuterBuffer.address);

        expect(transmuterBufferDataAfter.debt).equal(0);
        // some margin of error occurs during the credit burning process
        // it is in favor of the protocol, so things should remain stable
        const delta = parseEther("1").div(1000);
        expect(transmuterBufferData.debt.mul(-1)).closeTo(
          user1GainedCredit.add(user2GainedCredit),
          delta.toNumber()
        );
      }).timeout(50000);

      it("force exchanges collateral", async () => {
        const mintAmt1 = parseEther("200000");
        const mintAmt2 = parseEther("500000");
        const liqAmt1 = mintAmt1.div(2);
        const liqAmt2 = mintAmt2.div(2);

        await alchemist
          .connect(user)
          .deposit(yDaiVault.address, depositAmtDai1, user1Address);
        await alchemist
          .connect(user2)
          .deposit(yDaiVault.address, depositAmtDai2, user2Address);

        await alchemist.connect(user).mint(mintAmt1, user1Address);
        await alchemist.connect(user2).mint(mintAmt2, user2Address);

        await alusdContract.connect(user).approve(transmuter.address, mintAmt1);
        await alusdContract
          .connect(user2)
          .approve(transmuter.address, mintAmt2);

        await transmuter.connect(user).deposit(mintAmt1, user1Address);
        await transmuter.connect(user2).deposit(mintAmt2, user2Address);

        await alchemist
          .connect(user)
          .liquidate(yDaiVault.address, liqAmt1, 0);
        await alchemist
          .connect(user2)
          .liquidate(yDaiVault.address, liqAmt2, 0);

        const theBlock = await fam.provider.getBlock();
        const blockTimestamp: number = theBlock.timestamp;
        const timePassed = 60 * 60 * 24;
        await fam.setNextBlockTimestamp(timePassed + blockTimestamp);

        await transmuterBuffer
          .connect(deployer)
          .exchange(yDaiVault.address);

        const user1Exchanged = await transmuter
          .connect(user)
          .getExchangedBalance(user1Address);
        const user2Exchanged = await transmuter
          .connect(user2)
          .getExchangedBalance(user2Address);

        await transmuter.connect(user).claim(user1Exchanged, user1Address);
        await transmuter.connect(user2).claim(user2Exchanged, user2Address);

        const user1Bal = await daiToken.balanceOf(user1Address);
        const user2Bal = await daiToken.balanceOf(user2Address);

        // there are currently some small rounding errors in the way the transmuter handles exchange()
        // on the order of 1wei * order of the exchanged amount
        // we check for this with an acceptable margin
        const expectedUser1Bal = liqAmt1
          .add(liqAmt2)
          .mul(mintAmt1)
          .div(mintAmt1.add(mintAmt2));
        const expectedUser2Bal = liqAmt1
          .add(liqAmt2)
          .mul(mintAmt2)
          .div(mintAmt1.add(mintAmt2));
        expect(user1Bal).closeTo(expectedUser1Bal, 1000000);
        expect(user2Bal).closeTo(expectedUser2Bal, 1000000);
      }).timeout(50000);
    }).timeout(50000);
  }).timeout(50000);
});
