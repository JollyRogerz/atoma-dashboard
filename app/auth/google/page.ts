"use client";

import { useEffect } from "react";
// import { useRouter } from "next/router";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSettings } from "@/contexts/settings-context";

const Callback = () => {
  const router = useRouter();
  const { settings, updateSettings, updateZkLoginSettings } = useSettings();
  useEffect(() => {
    const processAuth = async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const idToken = params.get("id_token");

      if (idToken) {
        updateZkLoginSettings({ idToken: idToken });
        const { default: ZkLogin } = await import("@/lib/zklogin");
        const zkLogin = new ZkLogin();
        await zkLogin.initialize(
          { ...settings, zkLogin: { ...settings.zkLogin, idToken: idToken } },
          updateSettings,
          updateZkLoginSettings
        );
        router.push("/");
      }
    };

    processAuth();
  }, [router, settings, updateSettings, updateZkLoginSettings]);

  return null;
};

export default Callback;
