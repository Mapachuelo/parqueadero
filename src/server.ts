import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Servidor ejecutandose en http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
