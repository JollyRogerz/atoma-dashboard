import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function DevnetGuide() {
  return (
    <Card className="text-muted-foreground">
      <CardContent className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Atoma Devnet Guide</h2>
          <p className="text-gray-400 text-sm">
            These instructions will get you set up and running on Atoma Cloud during our Devnet period.
          </p>
        </div>

        <div>
          <h3 className="font-medium mb-2">Prerequisites:</h3>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Sui Wallet (Ensure it is set to Sui Testnet)</li>
            <li>Discord account</li>
            <li>Email</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium mb-1">Step 1:</h3>
          <p className="text-muted-foreground">
            Click the Login or Register button in the top right and register your account using your email
          </p>
        </div>

        <div>
          <h3 className="font-medium mb-1">Step 2:</h3>
          <p className="text-muted-foreground">
            Visit{" "}
            <Link
              href="https://discord.gg/sui"
              className="text-orange-400 hover:text-orange-300 inline-flex items-center" /* Updated color */
              target="_blank"
              rel="noopener noreferrer"
            >
              https://discord.gg/sui <ExternalLink className="ml-1 h-3 w-3" />
            </Link>{" "}
            and enter the testnet-faucet channel and type in the command: !faucet insert_wallet_address
          </p>
        </div>

        <div>
          <h3 className="font-medium mb-1">Step 3:</h3>
          <p className="text-muted-foreground">
            Visit{" "}
            <Link
              href="https://faucet.circle.com/"
              className="text-orange-400 hover:text-orange-300 inline-flex items-center" /* Updated color */
              target="_blank"
              rel="noopener noreferrer"
            >
              https://faucet.circle.com/ <ExternalLink className="ml-1 h-3 w-3" />
            </Link>{" "}
            to claim Sui Testnet USDC
          </p>
        </div>

        <div>
          <h3 className="font-medium mb-1">Step 4:</h3>
          <p className="text-muted-foreground">
            Visit Developer Portal → Billing: Click Add Funds and proceed with prompted instructions to send your
            Testnet USDC to top up your account balance
          </p>
        </div>

        <div>
          <h3 className="font-medium mb-1">Step 5:</h3>
          <p className="text-muted-foreground">
            Begin using Atoma! Simply plug into our API or SDK's (Visit Docs for more information) and you are ready to
            go!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
