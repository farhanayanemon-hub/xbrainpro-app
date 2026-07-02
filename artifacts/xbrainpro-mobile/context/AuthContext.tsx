import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  setAuthTokenGetter,
  type User,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

const TOKEN_KEY = "xbrainpro_token";

const isWeb = Platform.OS === "web";

// SecureStore is not available on web, so fall back to localStorage there.
const tokenStore = {
  async get(): Promise<string | null> {
    if (isWeb) {
      try {
        return window.localStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string): Promise<void> {
    if (isWeb) {
      try {
        window.localStorage.setItem(TOKEN_KEY, token);
      } catch {
        // ignore storage errors on web
      }
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async remove(): Promise<void> {
    if (isWeb) {
      try {
        window.localStorage.removeItem(TOKEN_KEY);
      } catch {
        // ignore storage errors on web
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

// Module-level token so the api-client's auth getter can read it before every
// request. Registered once at module load (outside any component).
let memoryToken: string | null = null;
setAuthTokenGetter(() => memoryToken);

async function persistToken(token: string | null): Promise<void> {
  memoryToken = token;
  if (token) {
    await tokenStore.set(token);
  } else {
    await tokenStore.remove();
  }
}

interface AuthContextValue {
  user: User | null;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await tokenStore.get();
        if (stored) {
          memoryToken = stored;
          const me = await getCurrentUser();
          if (active) setUser(me);
        }
      } catch {
        await persistToken(null);
        if (active) setUser(null);
      } finally {
        if (active) setIsBootstrapping(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin({ email, password });
      queryClient.clear();
      await persistToken(res.token);
      setUser(res.user);
    },
    [queryClient],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await apiRegister({ name, email, password });
      queryClient.clear();
      await persistToken(res.token);
      setUser(res.user);
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore network/logout errors — we clear local state regardless
    }
    await persistToken(null);
    setUser(null);
    // Drop all cached query data so the next account never sees prior user's data.
    queryClient.clear();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const me = await getCurrentUser();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isBootstrapping, signIn, signUp, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
