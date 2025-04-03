import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getAllStacks, getBalance } from "@/lib/api";
import { useSettings } from "@/contexts/settings-context";
import { useAppState } from "@/contexts/app-state";
import LoadingCircle from "@/components/LoadingCircle";

export function CreditBalanceCard({ handleAddFunds }: { handleAddFunds: () => void }) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const { settings } = useSettings();
  const { state, updateState } = useAppState();

  const updateBalance = async () => {
    updateState({ refreshBalance: false });
    setLoggedIn(settings.loggedIn);
    if (!settings.loggedIn) {
      setBalance("-");
      return;
    }
    try {
      const balancePromise = getBalance();
      const allStacksPromise = getAllStacks();
      const [balanceRes, allStacksRes] = await Promise.all([balancePromise, allStacksPromise]);
      let partialBalance = allStacksRes?.data.reduce(
        (acc: number, [stack]: any) =>
          acc +
          ((stack.num_compute_units - stack.already_computed_units) / 1000000) *
            stack.price_per_one_million_compute_units,
        0
      );
      let balance = (balanceRes?.data + partialBalance) / 1000000;
      setBalance(isNaN(balance) ? "0" : balance.toFixed(2));
    } catch (error) {
      console.error("Failed to fetch balance", error);
    }
  };

  useEffect(() => {
    updateBalance();
  }, [settings.loggedIn]);

  useEffect(() => {
    if (!state.refreshBalance) return;
    updateBalance();
  }, [state.refreshBalance]);

  return (
    <Card className="h-[280px] flex flex-col">
      <CardHeader>
        <CardTitle className="bg-primary-foreground dark:bg-darkMode">Credit Balance</CardTitle>
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
          <div className="text-sm text-muted-foreground mt-2">Available Credits</div>
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
