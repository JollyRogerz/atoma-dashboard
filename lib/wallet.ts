// @mysten/dapp-kit no longer exports WalletContextState; use 'any' as placeholder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WalletContextState = any;
import { UserSettings } from "@/contexts/settings-context";
import ZkLogin from "./zklogin";

export const disconnectWallet = (
  wallet: WalletContextState,
  settings: UserSettings,
  updateZkLoginSettings: (newSettings: Partial<UserSettings["zkLogin"]>) => void
) => {
  // Disconnect the wallet if connected
  if (wallet?.currentWallet?.disconnect) {
    wallet.currentWallet.disconnect();
  }

  // Handle ZkLogin disconnection if enabled
  if (settings.zkLogin.isEnabled) {
    const zkLogin = new ZkLogin();
    zkLogin.disconnect(updateZkLoginSettings);
  }

  // Clear wallet connection from localStorage to prevent auto-reconnect
  localStorage.removeItem("suiWallet");
  localStorage.removeItem("sui:preferredWallet");

  // Force reload to ensure wallet state is completely reset
  window.location.reload();
};
