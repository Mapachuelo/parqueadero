import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { env } from "../config/env.js";

const execAsync = promisify(exec);

export async function runDailyBackup(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(env.BACKUP_DIR, `backup-${timestamp}.sql`);

  try {
    const url = new URL(env.DATABASE_URL);
    const dbName = url.pathname.replace("/", "");
    const user = url.username;
    const pass = url.password;
    const host = url.hostname;
    const port = url.port || "5432";

    await execAsync(
      `mkdir -p "${env.BACKUP_DIR}" && PGPASSWORD="${pass}" pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} -F p > "${backupFile}"`
    );

    console.log(`[backup] Backup creado: ${backupFile}`);

    const files = await execAsync(`ls -t "${env.BACKUP_DIR}"/backup-*.sql`);
    const fileList = files.stdout.trim().split("\n");
    if (fileList.length > 30) {
      const toDelete = fileList.slice(30);
      for (const f of toDelete) {
        await execAsync(`rm "${f}"`);
      }
      console.log(`[backup] Eliminados ${toDelete.length} backups antiguos`);
    }
  } catch (err) {
    console.error("[backup] Error creando backup:", err);
  }
}
