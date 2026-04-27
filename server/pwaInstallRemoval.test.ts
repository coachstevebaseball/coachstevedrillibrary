/**
 * Regression tests: PWA install prompt permanently removed
 *
 * These tests guard against accidental re-introduction of any install UI.
 * They run in the Node.js vitest environment (no DOM), so they verify the
 * source-code level — file existence, imports, and grep patterns — rather
 * than mounting a browser DOM.
 */
import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

const CLIENT_SRC = path.resolve(__dirname, "../client/src");

function grepDir(dir: string, pattern: RegExp): string[] {
  const hits: string[] = [];
  function walk(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && /\.(tsx?|jsx?|js)$/.test(entry.name)) {
        const content = fs.readFileSync(full, "utf8");
        if (pattern.test(content)) {
          hits.push(full.replace(CLIENT_SRC + "/", ""));
        }
      }
    }
  }
  walk(dir);
  return hits;
}

describe("PWA Install Prompt — permanent removal regression", () => {
  it("PWAInstallBanner component file does not exist", () => {
    const file = path.join(CLIENT_SRC, "components/PWAInstallBanner.tsx");
    expect(fs.existsSync(file)).toBe(false);
  });

  it("usePWA hook file does not exist", () => {
    const file = path.join(CLIENT_SRC, "hooks/usePWA.ts");
    expect(fs.existsSync(file)).toBe(false);
  });

  it("no source file imports PWAInstallBanner", () => {
    const hits = grepDir(CLIENT_SRC, /PWAInstallBanner/);
    expect(hits).toEqual([]);
  });

  it("no source file imports or uses usePWA", () => {
    const hits = grepDir(CLIENT_SRC, /usePWA/);
    expect(hits).toEqual([]);
  });

  it("no source file registers a beforeinstallprompt event listener", () => {
    const hits = grepDir(CLIENT_SRC, /beforeinstallprompt/);
    expect(hits).toEqual([]);
  });

  it("no source file reads or writes pwa-ios-dismissed localStorage key", () => {
    const hits = grepDir(CLIENT_SRC, /pwa.ios.dismissed|pwa_install_dismissed|installPromptShown|iosInstallSeen/i);
    expect(hits).toEqual([]);
  });

  it("no source file contains iOS install modal text (Add to Home Screen / Got it)", () => {
    const hits = grepDir(
      CLIENT_SRC,
      /add to home screen|got it!|Install on iPhone|iosInstall|IOSInstall/i
    );
    expect(hits).toEqual([]);
  });

  it("no source file contains BeforeInstallPromptEvent type or state", () => {
    const hits = grepDir(CLIENT_SRC, /BeforeInstallPromptEvent/);
    expect(hits).toEqual([]);
  });

  it("service worker registration code is still present in App.tsx (kept intact)", () => {
    const appTsx = path.join(CLIENT_SRC, "App.tsx");
    const content = fs.readFileSync(appTsx, "utf8");
    expect(content).toContain("serviceWorker");
    expect(content).toContain("sw.js");
  });
});
