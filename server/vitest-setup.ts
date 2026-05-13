/**
 * Vitest global setup — runs before every test file.
 *
 * Purpose: prevent tests from accidentally touching the production database.
 *
 * How it works:
 *   - By default, DATABASE_URL is stripped from process.env so `getDb()` returns null.
 *   - Tests that need the real DB must be in files matching `*.integration.test.ts`
 *     and can only run when `INTEGRATION_TESTS=1` is set in the environment.
 *   - A sentinel flag (VITEST_RUNNING=1) is always set so `getDb()` can detect
 *     the test environment and throw a clear error if someone re-injects DATABASE_URL.
 */

// Always mark that we're in a test environment
process.env.VITEST_RUNNING = "1";

// Strip DATABASE_URL unless integration tests are explicitly enabled
if (process.env.INTEGRATION_TESTS !== "1") {
  if (process.env.DATABASE_URL) {
    console.warn(
      "[vitest-setup] Stripping DATABASE_URL to prevent production DB writes. " +
      "Set INTEGRATION_TESTS=1 to run integration tests with real DB."
    );
  }
  delete process.env.DATABASE_URL;
}
