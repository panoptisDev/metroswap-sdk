import { BigintIsh, ChainId, SECONDS_IN_YEAR } from '../constants'
import JSBI from 'jsbi'
import { parseBigintIsh } from '../utils'
import { CurrencyAmount, Fraction, Percent, TokenAmount } from './fractions'
import { PricedTokenAmount } from './fractions/priced-token-amount'
import { Pair } from './pair'
import invariant from 'tiny-invariant'
import { utils } from 'ethers'
import { Token } from './token'

// this value is used as a floor to calculate apy, in order to avoid infinite results
const MINIMUM_STAKED_AMOUNT_NATIVE_CURRENCY: { [chainId in ChainId]: CurrencyAmount } = {
  [ChainId.RINKEBY]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('0.05', Token.getNative(ChainId.RINKEBY).decimals).toString(),
    ChainId.RINKEBY
  ),
  [ChainId.MAINNET]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('0.1', Token.getNative(ChainId.MAINNET).decimals).toString(),
    ChainId.MAINNET
  ),
  [ChainId.XDAI]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.XDAI).decimals).toString(),
    ChainId.XDAI
  ),
  [ChainId.SOKOL]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.SOKOL).decimals).toString(),
    ChainId.SOKOL
  ),
  [ChainId.ARBITRUM_TESTNET_V3]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('0.05', Token.getNative(ChainId.ARBITRUM_TESTNET_V3).decimals).toString(),
    ChainId.ARBITRUM_TESTNET_V3
  ),
  [ChainId.MATIC]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.MATIC).decimals).toString(),
    ChainId.MATIC
  ),
  [ChainId.AVALANCHE]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.AVALANCHE).decimals).toString(),
    ChainId.AVALANCHE
  ),
  [ChainId.BINANCE]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.BINANCE).decimals).toString(),
    ChainId.BINANCE
  ),
  [ChainId.FUSE]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.FUSE).decimals).toString(),
    ChainId.FUSE
  ),
  [ChainId.IOTEX]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.IOTEX).decimals).toString(),
    ChainId.IOTEX
  ),
  [ChainId.FANTOM]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.FANTOM).decimals).toString(),
    ChainId.FANTOM
  ),
  [ChainId.HARMONY]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.HARMONY).decimals).toString(),
    ChainId.HARMONY
  ),
  [ChainId.BITTORRENT]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.BITTORRENT).decimals).toString(),
    ChainId.BITTORRENT
  ),
  [ChainId.CALLISTO]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.CALLISTO).decimals).toString(),
    ChainId.CALLISTO
  ),
  [ChainId.MOONBEAM]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.MOONBEAM).decimals).toString(),
    ChainId.MOONBEAM
  ),
  [ChainId.CELO]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.CELO).decimals).toString(),
    ChainId.CELO
  ),
  [ChainId.EVMOS]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.EVMOS).decimals).toString(),
    ChainId.EVMOS
  ),
  [ChainId.ASTAR]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.ASTAR).decimals).toString(),
    ChainId.ASTAR
  ),
  [ChainId.SMARTBCH]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.SMARTBCH).decimals).toString(),
    ChainId.SMARTBCH
  ),
  [ChainId.TELOS]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.TELOS).decimals).toString(),
    ChainId.TELOS
  ),
  [ChainId.ZYX]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.ZYX).decimals).toString(),
    ChainId.ZYX
  ),
  [ChainId.THUNDERCORE]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.THUNDERCORE).decimals).toString(),
    ChainId.THUNDERCORE
  ),
  [ChainId.ECHELON]: CurrencyAmount.nativeCurrency(
    utils.parseUnits('1000', Token.getNative(ChainId.ECHELON).decimals).toString(),
    ChainId.ECHELON
  )
}

export class LiquidityMiningCampaign {
  public readonly chainId: ChainId
  public readonly address?: string
  public readonly startsAt: BigintIsh
  public readonly endsAt: BigintIsh
  public readonly rewards: PricedTokenAmount[]
  public readonly targetedPair: Pair
  public readonly staked: PricedTokenAmount
  public readonly duration: BigintIsh
  public readonly locked: boolean
  public readonly stakingCap: TokenAmount

  constructor(
    startsAt: BigintIsh,
    endsAt: BigintIsh,
    targetedPair: Pair,
    rewards: PricedTokenAmount[],
    staked: PricedTokenAmount,
    locked: boolean,
    stakingCap: TokenAmount,
    address?: string
  ) {
    invariant(JSBI.lessThan(parseBigintIsh(startsAt), parseBigintIsh(endsAt)), 'INCONSISTENT_DATES')
    invariant(staked.token.equals(targetedPair.liquidityToken), 'STAKED_LP_TOKEN')
    for (const reward of rewards) {
      invariant(staked.token.chainId === reward.token.chainId, 'CHAIN_ID')
    }
    this.chainId = staked.token.chainId
    this.startsAt = startsAt
    this.endsAt = endsAt
    this.rewards = rewards
    this.targetedPair = targetedPair
    this.staked = staked
    this.duration = JSBI.subtract(parseBigintIsh(endsAt), parseBigintIsh(startsAt))
    this.locked = locked
    this.stakingCap = stakingCap
    this.address = address
  }

  public get remainingDistributionPercentage(): Percent {
    const now = JSBI.BigInt(Math.floor(Date.now() / 1000))
    const jsbiStartsAt = parseBigintIsh(this.startsAt)
    const jsbiEndsAt = parseBigintIsh(this.endsAt)
    if (JSBI.lessThan(now, jsbiStartsAt)) return new Percent('100', '100')
    if (JSBI.greaterThanOrEqual(now, jsbiEndsAt)) return new Percent('0', '100')
    return new Percent(JSBI.subtract(jsbiEndsAt, now), this.duration)
  }

  public get remainingRewards(): PricedTokenAmount[] {
    const remainingDistributionPercentage = this.remainingDistributionPercentage
    return this.rewards.map(reward => {
      return new PricedTokenAmount(reward.token, remainingDistributionPercentage.multiply(reward.raw).toFixed(0))
    })
  }

  public get apy(): Percent {
    const remainingRewards = this.remainingRewards

    let stakedValueNativeCurrency = this.staked.nativeCurrencyAmount
    if (stakedValueNativeCurrency.lessThan(MINIMUM_STAKED_AMOUNT_NATIVE_CURRENCY[this.chainId])) {
      stakedValueNativeCurrency = MINIMUM_STAKED_AMOUNT_NATIVE_CURRENCY[this.chainId]
    }

    const cumulativeRemainingRewardAmountNativeCurrency = remainingRewards.reduce(
      (accumulator, remainingRewardAmount) => {
        return accumulator.add(remainingRewardAmount.nativeCurrencyAmount)
      },
      CurrencyAmount.nativeCurrency('0', this.chainId)
    )

    const yieldInPeriod = cumulativeRemainingRewardAmountNativeCurrency.divide(stakedValueNativeCurrency)
    const annualizationMultiplier = new Fraction(SECONDS_IN_YEAR.toString(), this.duration.toString())
    const rawApy = yieldInPeriod.multiply(annualizationMultiplier)
    return new Percent(rawApy.numerator, rawApy.denominator)
  }

  public get currentlyActive(): boolean {
    const now = JSBI.BigInt(Math.floor(Date.now() / 1000))
    return (
      JSBI.lessThanOrEqual(parseBigintIsh(this.startsAt), now) && JSBI.greaterThan(parseBigintIsh(this.endsAt), now)
    )
  }

  public get ended(): boolean {
    return JSBI.greaterThan(JSBI.BigInt(Math.floor(Date.now() / 1000)), parseBigintIsh(this.endsAt))
  }
}
