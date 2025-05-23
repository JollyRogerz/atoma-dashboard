import type { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import type { UseMutateAsyncFunction } from "@tanstack/react-query";
import { WalletAccount } from "@mysten/wallet-standard";

const USDC_TYPE = process.env.NEXT_PUBLIC_USDC_TYPE;

export const payUSDC = async (
  amount: number,
  client: SuiClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signAndExecuteTransaction: UseMutateAsyncFunction<any, any, any, unknown>,
  account: WalletAccount
): Promise<unknown> => {
  const accountAddress = account.address;
  const { data: coins } = await client.getCoins({
    owner: accountAddress,
    coinType: USDC_TYPE,
  });
  const tx = new Transaction();
  let remainingAmount = Math.floor(amount);
  const selectedCoins = [];

  for (const coin of coins) {
    if (parseInt(coin.balance) >= remainingAmount) {
      const [splitCoin] = tx.splitCoins(coin.coinObjectId, [tx.pure.u64(remainingAmount)]);
      selectedCoins.push(splitCoin);
      remainingAmount = 0;
      break;
    } else {
      selectedCoins.push(coin.coinObjectId);
      remainingAmount -= parseInt(coin.balance);
    }
  }

  if (remainingAmount > 0) {
    throw new Error("Insufficient balance to cover the amount");
  }
  if (process.env.NEXT_PUBLIC_PROXY_WALLET == null) {
    throw new Error("Proxy wallet address not found");
  }
  tx.transferObjects(selectedCoins, process.env.NEXT_PUBLIC_PROXY_WALLET);
  tx.setSender(accountAddress);
  return await signAndExecuteTransaction({
    transaction: tx,
    account,
  });
};
