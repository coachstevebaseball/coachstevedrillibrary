import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Tests to verify mobile enhancement components exist and are properly structured.
 * These are structural/integration tests since the mobile components are client-side React.
 */

const CLIENT_SRC = path.resolve(__dirname, "../client/src");

describe("Mobile Enhancement Components", () => {
  describe("Component files exist", () => {
    const mobileComponents = [
      "components/mobile/BottomSheet.tsx",
      "components/mobile/PullToRefresh.tsx",
      "components/mobile/ScrollToTop.tsx",
      "components/mobile/SwipeableCard.tsx",
      "components/mobile/FloatingActionButton.tsx",
      "components/mobile/MobileTouch.tsx",
      "components/mobile/index.ts",
    ];

    mobileComponents.forEach((file) => {
      it(`${file} exists`, () => {
        const filePath = path.join(CLIENT_SRC, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Haptics utility", () => {
    it("haptics.ts exists with expected exports", () => {
      const filePath = path.join(CLIENT_SRC, "lib/haptics.ts");
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("hapticLight");
      expect(content).toContain("hapticMedium");
      expect(content).toContain("hapticHeavy");
      expect(content).toContain("hapticSuccess");
      expect(content).toContain("hapticError");
      expect(content).toContain("hapticCelebration");
    });
  });

  describe("Swipe navigation hook", () => {
    it("useSwipeNavigation.ts exists", () => {
      const filePath = path.join(CLIENT_SRC, "hooks/useSwipeNavigation.ts");
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("useSwipeNavigation");
      expect(content).toContain("threshold");
      expect(content).toContain("backUrl");
    });
  });

  describe("Mobile barrel export", () => {
    it("index.ts exports all components", () => {
      const filePath = path.join(CLIENT_SRC, "components/mobile/index.ts");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("BottomSheet");
      expect(content).toContain("PullToRefresh");
      expect(content).toContain("ScrollToTop");
      expect(content).toContain("SwipeableCard");
      expect(content).toContain("FloatingActionButton");
      expect(content).toContain("MobileTouch");
    });
  });

  describe("Integration with existing components", () => {
    it("AthletePortal imports PullToRefresh", () => {
      const filePath = path.join(CLIENT_SRC, "pages/AthletePortal.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("PullToRefresh");
      expect(content).toContain("SwipeableCard");
      expect(content).toContain("ScrollToTop");
      expect(content).toContain("hapticSuccess");
    });

    it("Home page imports ScrollToTop", () => {
      const filePath = path.join(CLIENT_SRC, "pages/Home.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("ScrollToTop");
    });

    it("OverviewPage imports CoachDashboardFAB", () => {
      const filePath = path.join(CLIENT_SRC, "pages/dashboard/OverviewPage.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("CoachDashboardFAB");
      expect(content).toContain("ScrollToTop");
    });

    it("MobileTabBar uses haptic feedback", () => {
      const filePath = path.join(CLIENT_SRC, "components/dashboard/MobileTabBar.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("hapticLight");
      expect(content).toContain("active:scale-90");
    });

    it("TopBar has backdrop blur and active:scale", () => {
      const filePath = path.join(CLIENT_SRC, "components/dashboard/TopBar.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("backdrop-blur-md");
      expect(content).toContain("active:scale-90");
      expect(content).toContain("hapticLight");
    });

    it("CompletionModal uses hapticCelebration", () => {
      const filePath = path.join(CLIENT_SRC, "components/CompletionModal.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("hapticCelebration");
    });

    it("StickyMobileCTA uses haptic feedback", () => {
      const filePath = path.join(CLIENT_SRC, "components/drill/StickyMobileCTA.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("hapticSuccess");
      expect(content).toContain("hapticMedium");
      expect(content).toContain("active:scale-95");
    });
  });

  describe("CSS mobile enhancements", () => {
    it("index.css contains mobile UX styles", () => {
      const filePath = path.join(CLIENT_SRC, "index.css");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("ENHANCED MOBILE UX STYLES");
      expect(content).toContain("-webkit-tap-highlight-color");
      expect(content).toContain("overscroll-behavior-y: contain");
      expect(content).toContain("press-feedback");
      expect(content).toContain("page-enter");
      expect(content).toContain("mobile-skeleton");
      expect(content).toContain("celebration-burst");
      expect(content).toContain("safe-area-bottom");
    });
  });
});
