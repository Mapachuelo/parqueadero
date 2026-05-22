import cron from "node-cron";
import { checkSubscriptionExpiry } from "./subscription-expiry.js";
import { checkCreditLowBalance } from "./credit-low-balance.js";

let schedulerStarted = false;

export function startScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  cron.schedule("0 6 * * *", async () => {
    await checkSubscriptionExpiry().catch((err) =>
      console.error("[subscription-expiry]", err)
    );
  });

  cron.schedule("0 6 * * *", async () => {
    await checkCreditLowBalance().catch((err) =>
      console.error("[credit-low-balance]", err)
    );
  });

  console.log("[scheduler] Jobs programados iniciados");
}
