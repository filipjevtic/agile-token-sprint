import { useEffect, useState } from "react";
import type { AuthProviders } from "../components/auth/SSOButtons.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useAuthProviders() {
  const [providers, setProviders] = useState<AuthProviders | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/providers`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setProviders(data); })
      .catch(() => {});
  }, []);

  return providers;
}
