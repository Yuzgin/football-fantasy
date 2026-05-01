import { describe, expect, it } from "vitest";

import api from "./api";
import { ACCESS_TOKEN } from "./constants";

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

describe("api axios instance", () => {
  it("adds Authorization header when token exists", () => {
    installLocalStorageMock();
    localStorage.setItem(ACCESS_TOKEN, "test-token");

    const handler = api.interceptors.request.handlers[0]?.fulfilled;
    expect(typeof handler).toBe("function");

    const config = handler({ headers: {} });
    expect(config.headers.Authorization).toBe("Bearer test-token");
  });

  it("does not add Authorization header when token missing", () => {
    installLocalStorageMock();
    localStorage.removeItem(ACCESS_TOKEN);

    const handler = api.interceptors.request.handlers[0]?.fulfilled;
    expect(typeof handler).toBe("function");

    const config = handler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});

