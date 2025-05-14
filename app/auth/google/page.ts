"use client";

import { useEffect } from "react";
// import { useRouter } from "next/router";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSettings } from "@/contexts/settings-context";
import ZkLogin from "@/lib/zklogin";

const Callback = () => {
  const router = useRouter();
  const { settings, updateSettings, updateZkLoginSettings } = useSettings();
  useEffect(() => {
    new URLSearchParams(window.location.hash.slice(1)).forEach((value, key) => {
      if (key === "id_token") {
        updateZkLoginSettings({ idToken: value });
        const zkLogin = new ZkLogin();
        zkLogin.initialize(
          { ...settings, zkLogin: { ...settings.zkLogin, idToken: value } },
          updateSettings,
          updateZkLoginSettings
        );
        router.push("/");
      }
    });
  }, [router]);

  return null;
};

export default Callback;
