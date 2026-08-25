import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { getDevices, revalidate, updateCache } from "./client.js";
import { logger } from "@hinata/logger";
import type { Device, DeviceWithIP } from "@hinata/store";
import { getIp } from "./lib/ip.js";

export const PORT = 6745;

export type Response = {
  name: "hinata";
  device: DeviceWithIP;
  status: "Running";
  ip: string;
};

export const initServer = async (device: Device) => {
  const app = new Hono();

  void revalidate();

  app.get("/", async (c) => {
    const ip = await getIp();
    if (ip.isErr()) {
      return c.json({ status: "error", message: "cant find ip" }, 500);
    }
    const deviceWithIP = { ...device, ip: ip.value } as DeviceWithIP;
    return c.json({ name: "hinata", device: deviceWithIP, status: "running" });
  });

  app.get("/devices", async (c) => {
    const res = await getDevices();
    return c.json(res);
  });

  app.get("/revalidate", async (c) => {
    await updateCache();

    return c.json({ success: "true", message: "cache updated" });
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
