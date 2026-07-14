#!/bin/env node
import { initServer } from "./server.js";
import { program as p } from "commander";
import { Store } from "./lib/store.js";
import { logger } from "./lib/logger.js";
import { scanNetwork } from "./client.js";
import { startDaemon, stopDaemon } from "./daemon.js";

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
    .action(async () => await startDaemon());

  daemon
    .command("stop")
    .description("stop the daemon")
    .action(async () => await stopDaemon());

  program
    .command("scan")
    .description("scan the network")
    .action(async (_) => {
      const res = await scanNetwork();
      if (res.isErr()) {
        res.error.log();
        process.exit();
      }

      console.log(res.value);
    });

  program.parse(process.argv);
};

main().then();
