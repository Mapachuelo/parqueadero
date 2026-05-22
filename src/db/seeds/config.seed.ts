import { PrismaClient } from "@prisma/client";

export async function seedConfig(prisma: PrismaClient) {
  const configEntries = [
    { key: "parking_capacity", value: "100" },
    { key: "free_minutes", value: "15" },
    { key: "rounding_policy", value: "next_hour" },
    { key: "session_timeout_minutes", value: "30" },
    { key: "occupancy_warning_percent", value: "90" },
    { key: "occupancy_alert_percent", value: "95" },
    { key: "occupancy_critical_percent", value: "99" },
    { key: "data_retention_days", value: "365" },
    { key: "custody_terms_version", value: "1.0" },
  ];

  for (const entry of configEntries) {
    await prisma.systemConfig.upsert({
      where: { key: entry.key },
      update: { value: entry.value },
      create: entry,
    });
  }
}
