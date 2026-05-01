import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jwtDecode } from "jwt-decode";

import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { checkIsStaff } from "./auth";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

function installLocalStorageMock() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("checkIsStaff", () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(jwtDecode).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when no access token", async () => {
    localStorage.removeItem(ACCESS_TOKEN);
    await expect(checkIsStaff()).resolves.toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it("returns is_staff from /api/user/ when token is valid and not expired", async () => {
    localStorage.setItem(ACCESS_TOKEN, "fake-access");
    vi.mocked(jwtDecode).mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      data: { is_staff: true },
    });

    await expect(checkIsStaff()).resolves.toBe(true);
    expect(api.get).toHaveBeenCalledWith("/api/user/", {
      headers: { Authorization: "Bearer fake-access" },
    });
  });

  it("refreshes access token when expired then checks staff", async () => {
    localStorage.setItem(ACCESS_TOKEN, "old-access");
    localStorage.setItem(REFRESH_TOKEN, "refresh-me");
    vi.mocked(jwtDecode).mockReturnValue({
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    vi.mocked(api.post).mockResolvedValue({
      status: 200,
      data: { access: "new-access" },
    });
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      data: { is_staff: false },
    });

    await expect(checkIsStaff()).resolves.toBe(false);
    expect(api.post).toHaveBeenCalledWith("/api/token/refresh/", {
      refresh: "refresh-me",
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe("new-access");
  });
});
