import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { getAllStacks, getBalance } from "@/lib/api";
import { useSettings } from "@/contexts/settings-context";
import { useAppState } from "@/contexts/app-state";
import LoadingCircle from "@/components/LoadingCircle";

const USDC_TO_USD = 1_000_000;

export function CreditBalanceCard({ handleAddFunds }: { handleAddFunds: () => void }) {
  const [balance, setBalance] = useState<string | null>(null);
  const [freeBalance, setFreeBalance] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const { settings } = useSettings();
  const { state, updateState } = useAppState();

  const updateBalance = useCallback(async () => {
    if (state.refreshBalance) {
      updateState({ refreshBalance: false });
    }
    setLoggedIn(settings.loggedIn);
    if (!settings.loggedIn) {
      setBalance("-");
      setFreeBalance("-");
      return;
    }
    try {
      const balancePromise = getBalance();
      const allStacksPromise = getAllStacks();
      const [balanceRes, allStacksRes] = await Promise.all([balancePromise, allStacksPromise]);
      const lockedBalance =
        allStacksRes?.data.reduce(
          (acc: number, [stack]: any) =>
            acc +
            ((stack.num_compute_units - stack.already_computed_units) / 1_000_000) *
              stack.price_per_one_million_compute_units,
          0
        ) / USDC_TO_USD;
      const freeBalance = balanceRes?.data / USDC_TO_USD;
      setFreeBalance(isNaN(freeBalance) ? "0" : freeBalance.toFixed(2));
      setBalance(isNaN(freeBalance + lockedBalance) ? "0" : (freeBalance + lockedBalance).toFixed(2));
    } catch (error) {
      console.error("Failed to fetch balance", error);
    }
  }, [settings.loggedIn, updateState, state.refreshBalance]);

  useEffect(() => {
    updateBalance();
  }, [settings.loggedIn, updateBalance]);

  useEffect(() => {
    if (!state.refreshBalance) return;
    updateBalance();
  }, [state.refreshBalance, updateBalance]);

  return (
    <Card className="h-[280px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-primary dark:bg-darkMode">Credit Balance</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="text-5xl font-bold text-foreground">
            {balance !== null ? (
              `$${balance}`
            ) : (
              <div className="w-[3rem] h-[3rem]">
                <LoadingCircle isSpinning={true} size="sm" />
              </div>
            )}
          </div>
          {freeBalance !== null && (
            <div className="text-sm text-muted-foreground mt-2">Unallocated balance: ${freeBalance}</div>
          )}
        </div>
        <Button
          className="w-full bg-primary hover:bg-secondary-foreground text-base"
          onClick={() => (loggedIn ? handleAddFunds() : updateState({ showLogin: true }))}
        >
          {loggedIn ? "Add Funds" : "Sign in"}
        </Button>
      </CardContent>
    </Card>
  );
}
