#!/bin/env node
import { initServer } from "./server.js";
import { program as p } from "commander";
import { Store } from "./lib/store.js";
import { logger } from "./lib/logger.js";
import { scanNetwork } from "./client.js";
import { Daemon } from "./daemon.js";

const main = async () => {
  await Store.init().match(
    () => null,
    (e) => {
      e.log();
      process.exit();
    },
  );

  const program = p
    .name("hinata")
    .description("discover other hinata servers running on lan")
    .version("v0");

  // program.command("set").command("secret <string>").description("set secret for authentication")
  program
    .command("set")
    .description("set data for hinata")
    .command("device <string>")
    .description("set device name")
    .action(async (arg: string) => {
      const deviceName = arg;
      const deviceUname = arg.toLowerCase().split(" ").join("");

      const res = await Store.write({
        thisdevice: { uname: deviceUname, name: deviceName },
      });
      if (res.isErr()) {
        res.error.log();
        process.exit();
      }

      logger.info("device set successfully");
    });

  program
    .command("start")
    .description("start the server")
    .action(async () => {
      await Store.read().map((data) => {
        if (!data) {
          logger.error("required data not found");
          return;
        }
        if (!Store.validateRequiredData(data)) {
          logger.error("required data not found");
          return;
        }

        initServer(data.thisdevice);
      });
    });

  const daemon = program.command("daemon").description("commands for daemon");

  daemon
    .command("start")
    .description("start the server")
    .action(async () => {
      await Daemon.start().match(
        () => logger.info("daemon started"),
        (e) => e.log(),
      );
    });

  daemon
    .command("stop")
    .description("stop the daemon")
    .action(async () => {
      await Daemon.stop().match(
        () => logger.info("daemon stopped"),
        (e) => {
          e.log();
        },
      );
    });

  daemon
    .command("status")
    .description("check status of the daemon")
    .action(async () => {
      await Daemon.status().match(
        (t) => {
          if (t) {
            logger.info("daemon running");
          } else {
            logger.info("daemon not running");
          }
        },
        (e) => e.log(),
      );
    });

  program
    .command("scan")
    .option("-c, --cache", "cache hit")
    .description("scan the network")
    .action(async (args) => {
      console.log("args", args);
      const cache = (args.cache as boolean) ?? false;
      const storeRes = await Store.read();

      if (storeRes.isErr()) {
        storeRes.error.log();
        process.exit();
      }

      const { knownDevices, lastScan } = storeRes.value!;

      const now = new Date();
      const lastScanTime = new Date(lastScan);

      const diffMinutes =
        (now.getTime() - lastScanTime.getTime()) / (1000 * 60);

      if (cache && diffMinutes > 5 && knownDevices.length != 0) {
        console.log(knownDevices);
        return;
      }

      const res = await scanNetwork();
      if (res.isErr()) {
        res.error.log();
        process.exit();
      }

      await Store.write({
        knownDevices: res.value.map((v) => v.device),
        lastScan: now,
      });

      console.log(res.value);
    });

  program.parse(process.argv);
};

main().then();
