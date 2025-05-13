import { jwtDecode, type JwtPayload } from "jwt-decode";
import { SuiClient, type SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  genAddressSeed,
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
  jwtToAddress,
} from "@mysten/sui/zklogin";
import { Transaction } from "@mysten/sui/transactions";
import { PROVER_URL, SUI_RPC_URL } from "./local_storage_consts";
import type { UserSettings } from "@/contexts/settings-context";
import { getSalt, googleOAuth } from "./api";

type PartialZkLoginSignature = Omit<Parameters<typeof getZkLoginSignature>["0"]["inputs"], "addressSeed">;

export default class ZkLogin {
  private suiClient: SuiClient;
  private proverUrl: string;
  private ephemeralKeyPair?: Ed25519Keypair;
  private maxEpoch?: number;
  private idToken?: string;
  private zkLoginUserAddress?: string;
  private partialZkLoginSignature?: PartialZkLoginSignature;
  private salt?: bigint;
  private decodeJwt?: JwtPayload;

  constructor() {
    if (!SUI_RPC_URL) {
      throw new Error("SUI RPC URL is not set");
    }
    if (!PROVER_URL) {
      throw new Error("Prover URL is not set");
    }
    const suiClient = new SuiClient({
      url: SUI_RPC_URL,
    });
    this.suiClient = suiClient;
    this.proverUrl = PROVER_URL;
  }

  initialize = async (
    settings: UserSettings,
    updateSettings: (newSettings: Partial<UserSettings>) => void,
    updateZkLoginSettings: (newSettings: Partial<UserSettings["zkLogin"]>) => void
  ) => {
    return await this.getRest(settings, updateSettings, updateZkLoginSettings)
      .then(() => {})
      .catch(err => {
        if (err.name === "TypeError") {
          /// This can happen when you reload the page before the responses from prover server
          return;
        }
        console.error("Error type", err.name);
        console.error("Error message", err.message);
        console.error("Error getting rest", err);
        // There id a id_token but it is invalid so logout
        updateZkLoginSettings({
          isEnabled: false,
          idToken: undefined,
          secretKey: undefined,
          randomness: undefined,
          maxEpoch: undefined,
          zkp: undefined,
          address: undefined,
        });
        updateSettings({ accessToken: undefined, loggedIn: false });
      });
  };

  get zkLoginUserAddressValue() {
    return this.zkLoginUserAddress;
  }

  get partialZkLoginSignatureValue() {
    return this.partialZkLoginSignature;
  }

  get isEnabled() {
    return !!this.partialZkLoginSignature;
  }

  disconnect = (updateZkLoginSettings: (newSettings: Partial<UserSettings["zkLogin"]>) => void) => {
    updateZkLoginSettings({
      isEnabled: false,
      secretKey: undefined,
      randomness: undefined,
      maxEpoch: undefined,
      zkp: undefined,
      address: undefined,
      idToken: undefined,
    });
    this.ephemeralKeyPair = undefined;
    this.maxEpoch = undefined;
    this.idToken = undefined;
    this.zkLoginUserAddress = undefined;
    this.partialZkLoginSignature = undefined;
    this.salt = undefined;
    this.decodeJwt = undefined;
  };

  private getRest = async (
    settings: UserSettings,
    updateSettings: (newSettings: Partial<UserSettings>) => void,
    updateZkLoginSettings: (newSettings: Partial<UserSettings["zkLogin"]>) => void
  ) => {
    const zkLoginSettings = settings.zkLogin;
    console.log("zklogin settings", zkLoginSettings);
    const idToken = zkLoginSettings.idToken;
    if (!idToken) {
      return;
    }
    const local_storage_secret_key = zkLoginSettings.secretKey;
    if (local_storage_secret_key == null) {
      console.warn("NO SECRET KEY");
      throw new Error("Secret key not found");
    }
    this.maxEpoch = zkLoginSettings.maxEpoch;
    if (this.maxEpoch == null) {
      throw new Error("Max epoch not found");
    }
    const randomness = zkLoginSettings.randomness;
    if (randomness == null) {
      throw new Error("Randomness not found");
    }
    this.idToken = idToken;
    this.decodeJwt = jwtDecode(idToken);
    let accessToken = settings.accessToken;
    if (!accessToken) {
      const {
        data: { access_token, refresh_token },
      } = await googleOAuth(idToken);
      updateSettings({ accessToken: access_token, loggedIn: true });
      document.cookie = `refresh_token=${refresh_token}; path=/; secure; HttpOnly; SameSite=Strict`;
      accessToken = access_token;
    }
    // Leave this here for now, we can uncomment this when we decide to use the actual zkLogin
    // const salt = await getSalt();
    // this.salt = BigInt(`0x${Buffer.from(salt.data, "base64").toString("hex")}`);
    // this.zkLoginUserAddress = jwtToAddress(idToken, this.salt);
    // updateZkLoginSettings({ address: this.zkLoginUserAddress });
    // this.ephemeralKeyPair = Ed25519Keypair.fromSecretKey(local_storage_secret_key);
    // const partialZkLogin = zkLoginSettings.zkp;
    // if (!partialZkLogin) {
    //   const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(this.ephemeralKeyPair.getPublicKey());

    //   const response = await fetch(`${this.proverUrl}/v1`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       jwt: idToken,
    //       extendedEphemeralPublicKey: extendedEphemeralPublicKey,
    //       maxEpoch: this.maxEpoch,
    //       jwtRandomness: randomness,
    //       salt: this.salt.toString(),
    //       keyClaimName: "sub",
    //     }),
    //   });
    //   if (!response.ok) {
    //     throw new Error(`Error: ${response.statusText}`);
    //   }

    //   const zkProofResult = await response.json();

    //   this.partialZkLoginSignature = zkProofResult as PartialZkLoginSignature;
    //   updateZkLoginSettings({ zkp: JSON.stringify(this.partialZkLoginSignature), isEnabled: true });
    // } else {
    //   this.partialZkLoginSignature = JSON.parse(partialZkLogin);
    // }
    // updateSettings({ loggedIn: true });
  };

  private prepare = async (
    zkLoginSettings: UserSettings["zkLogin"],
    updateZkLoginSettings: (newSettings: Partial<UserSettings["zkLogin"]>) => void
  ) => {
    const local_storage_secret_key = zkLoginSettings.secretKey;
    if (local_storage_secret_key !== undefined) {
      this.ephemeralKeyPair = Ed25519Keypair.fromSecretKey(local_storage_secret_key);
    } else {
      this.ephemeralKeyPair = new Ed25519Keypair();
      updateZkLoginSettings({ secretKey: this.ephemeralKeyPair.getSecretKey() });
    }
    console.warn("SECRET KEY SET");
    const { epoch } = await this.suiClient.getLatestSuiSystemState();
    this.maxEpoch = Number(epoch) + 2;
    updateZkLoginSettings({ maxEpoch: this.maxEpoch });
    const randomness = generateRandomness();
    updateZkLoginSettings({ randomness });
    const nonce = generateNonce(this.ephemeralKeyPair.getPublicKey(), this.maxEpoch, randomness);
    return nonce;
  };

  getURL = async (
    zkLoginSettings: UserSettings["zkLogin"],
    updateZkLoginSettings: (newSettings: Partial<UserSettings["zkLogin"]>) => void
  ) => {
    const scope = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_SCOPE;
    const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirect_uri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    const nonce = await this.prepare(zkLoginSettings, updateZkLoginSettings);
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&response_type=id_token&redirect_uri=${redirect_uri}&scope=${scope}&nonce=${nonce}`;
  };

  signMessage = async (message: string) => {
    if (!this.salt) {
      throw new Error("Salt not found");
    }
    if (!this.ephemeralKeyPair) {
      throw new Error("Ephemeral key pair not found");
    }
    if (!this.decodeJwt?.sub || !this.decodeJwt?.aud) {
      throw new Error("Sub or aud not found");
    }
    if (!this.maxEpoch) {
      throw new Error("Max epoch not found");
    }
    if (!this.partialZkLoginSignature) {
      throw new Error("Partial zk login signature not found");
    }
    const data = new TextEncoder().encode(message);
    const { signature: userSignature } = await this.ephemeralKeyPair.signPersonalMessage(data);
    const aud = Array.isArray(this.decodeJwt.aud) ? this.decodeJwt.aud[0] : this.decodeJwt.aud;
    const addressSeed = genAddressSeed(this.salt, "sub", this.decodeJwt.sub, aud).toString();
    const zkLoginSignature = getZkLoginSignature({
      inputs: {
        ...this.partialZkLoginSignature,
        addressSeed,
      },
      maxEpoch: this.maxEpoch,
      userSignature,
    });
    return zkLoginSignature;
  };

  payUSDC = async (amount: number, client: SuiClient): Promise<SuiTransactionBlockResponse> => {
    const USDC_TYPE = process.env.NEXT_PUBLIC_USDC_TYPE;
    const accountAddress = this.zkLoginUserAddress;
    if (!accountAddress) {
      throw new Error("ZkLogin user address not found");
    }
    if (!this.salt) {
      throw new Error("Salt not found");
    }
    if (!this.ephemeralKeyPair) {
      throw new Error("Ephemeral key pair not found");
    }
    if (!this.decodeJwt?.sub || !this.decodeJwt?.aud) {
      throw new Error("Sub or aud not found");
    }
    if (!this.maxEpoch) {
      throw new Error("Max epoch not found");
    }
    if (!this.partialZkLoginSignature) {
      throw new Error("Partial zk login signature not found");
    }

    // This part is identical to normal payUSDC function
    // TODO: Refactor this part

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

    // Sign the transaction using zkLogin

    const { bytes, signature: userSignature } = await tx.sign({ client, signer: this.ephemeralKeyPair });

    const aud = Array.isArray(this.decodeJwt.aud) ? this.decodeJwt.aud[0] : this.decodeJwt.aud;

    const addressSeed = genAddressSeed(this.salt, "sub", this.decodeJwt.sub, aud).toString();
    const zkLoginSignature = getZkLoginSignature({
      inputs: {
        ...this.partialZkLoginSignature,
        addressSeed,
      },
      maxEpoch: this.maxEpoch,
      userSignature,
    });
    return await client.executeTransactionBlock({ transactionBlock: bytes, signature: zkLoginSignature });
  };
}
