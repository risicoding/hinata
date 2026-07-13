#!/bin/env node
import { initServer } from "./server.js";
import { program as p } from "commander";
import { Store } from "./store.js";
import { logger } from "./logger.js";
import { scanNetwork } from "./client.js";

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
      const data = await Store.read();
      if (data.isErr()) {
        data.error.log();
        process.exit();
      }

      if (!data.value) return;
      const valid = Store.validateRequiredData(data.value);
      if (!valid) {
        logger.error("missing required data please set secret or device");
        process.exit();
      }

      initServer(data.value.thisdevice);
    });

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
