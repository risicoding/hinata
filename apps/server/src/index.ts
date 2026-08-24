import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { scanNetwork } from "./client.js";
import { logger } from "@hinata/logger";
import { type Device } from "@hinata/store";

export const PORT = 6745;

export type Response = {
  name: "hinata";
  device: Device;
  status: "Running";
};

export const initServer = (device: Device) => {
  const app = new Hono();

  app.get("/", async (c) => {
    return c.json({ name: "hinata", device, status: "running" });
  });

  app.get("/devices", async (c) => {
    const res = await scanNetwork();
    if (res.isOk()) {
      return c.json(res.value);
    }

    return c.json({ status: "error" }, 500);
  });

  app.get("/kill", () => {
    logger.warn("Received kill command shutting down...");
    process.exit();
  });

  serve(
    {
      fetch: app.fetch,
      port: 6745,
    },
    (i) => logger.info(`Server running on ${i.port}`),
  );

  process.on("SIGTERM", () => {
    console.log("Received SIGTERM. Shutting down...");
    // Clean up here
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("Received SIGINT");
    process.exit(0);
  });
};
