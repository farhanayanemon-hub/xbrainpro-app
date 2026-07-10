import React from "react";
import { View } from "react-native";
import { render, screen, waitFor, act } from "@testing-library/react-native";

// The lobby hero pulls in the full react-three-fiber / three.js stack once it
// flips to the 3D-ready state. None of that is relevant to the retry loop under
// test, so stub every heavy dependency down to inert placeholders. The mocked
// GameCanvas renders a testID we can assert on and intentionally ignores its
// three.js children so no real WebGL/three code executes.
jest.mock("@react-three/fiber", () => ({ useFrame: () => {} }));
jest.mock("@/game/GameCanvas", () => {
  const { View: RNView } = require("react-native");
  return {
    __esModule: true,
    default: () => <RNView testID="game-canvas" />,
  };
});
jest.mock("@/game/Avatar", () => ({ __esModule: true, default: () => null }));
jest.mock("@/game/resources", () => ({
  ensureAvatarCached: jest.fn(() => Promise.resolve()),
}));

const mockGetManifest = jest.fn();
const mockResolveAvatar = jest.fn();
jest.mock("@/game/assetManifest", () => ({
  getManifest: (force?: boolean) => mockGetManifest(force),
}));
jest.mock("@/game/assetResolver", () => ({
  resolveAvatar: (id: string) => mockResolveAvatar(id),
}));

import LobbyAvatarStage from "./LobbyAvatarStage";

const AVATAR_ID = "hero-1";
const CDN_URL = "https://cdn.example/hero-1.glb";

beforeEach(() => {
  mockGetManifest.mockReset();
  mockResolveAvatar.mockReset();
});

describe("LobbyAvatarStage recovery", () => {
  it("recovers to the 3D-ready state after the first manifest load fails", async () => {
    jest.useFakeTimers();
    try {
      // First attempt: manifest unavailable (offline/startup race) so the
      // avatar cannot resolve yet — the stage must stay on the fallback.
      // Second attempt: manifest is available and the avatar resolves to a
      // real CDN url, so the stage must flip to the 3D-ready state.
      mockGetManifest
        .mockResolvedValueOnce(null)
        .mockResolvedValue({ version: 1, configured: true, assets: [] });
      mockResolveAvatar.mockReturnValueOnce("").mockReturnValue(CDN_URL);

      render(<LobbyAvatarStage avatarId={AVATAR_ID} fallbackPhotoUrl={null} />);

      // Flush the first (failed) attempt: still on the fallback, no canvas.
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByTestId("game-canvas")).toBeNull();

      // Advance past the exponential-backoff delay to trigger the retry.
      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000);
      });

      expect(screen.getByTestId("game-canvas")).toBeTruthy();
      // The retry loop kept calling until the avatar resolved to a real url.
      expect(mockGetManifest).toHaveBeenCalledTimes(2);
      expect(mockGetManifest).toHaveBeenLastCalledWith(true);
      expect(mockResolveAvatar).toHaveBeenLastCalledWith(AVATAR_ID);
      expect(mockResolveAvatar).toHaveLastReturnedWith(CDN_URL);
    } finally {
      jest.useRealTimers();
    }
  });

  it("renders the 3D-ready state immediately when the manifest resolves on the first try", async () => {
    mockGetManifest.mockResolvedValue({ version: 1, configured: true, assets: [] });
    mockResolveAvatar.mockReturnValue(CDN_URL);

    render(<LobbyAvatarStage avatarId={AVATAR_ID} fallbackPhotoUrl={null} />);

    await waitFor(() => expect(screen.getByTestId("game-canvas")).toBeTruthy());
    expect(mockGetManifest).toHaveBeenCalledTimes(1);
    expect(mockGetManifest).toHaveBeenCalledWith(false);
    expect(mockResolveAvatar).toHaveLastReturnedWith(CDN_URL);
  });
});
