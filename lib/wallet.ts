import { WalletContextState } from "@mysten/dapp-kit";
import { UserSettings } from "@/contexts/settings-context";

export const disconnectWallet = async (
  wallet: WalletContextState,
  settings: UserSettings,
  updateZkLoginSettings: (newSettings: Partial<UserSettings["zkLogin"]>) => void
) => {
  // Disconnect the wallet if connected
  if (wallet.currentWallet?.disconnect) {
    wallet.currentWallet.disconnect();
  }

  // Handle ZkLogin disconnection if enabled
  if (settings.zkLogin.isEnabled) {
    const { default: ZkLogin } = await import("./zklogin");
    const zkLogin = new ZkLogin();
    zkLogin.disconnect(updateZkLoginSettings);
  }

  // Clear wallet connection from localStorage to prevent auto-reconnect
  localStorage.removeItem("suiWallet");
  localStorage.removeItem("sui:preferredWallet");

  // Force reload to ensure wallet state is completely reset
  window.location.reload();
};
