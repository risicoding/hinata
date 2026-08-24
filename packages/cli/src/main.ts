#!/bin/env node
import { initServer } from "@hinata/server";
import { scanNetwork } from "@hinata/server/client";
import { program as p } from "commander";
import { Store } from "@hinata/store";
import { logger } from "@hinata/logger";
import { Daemon } from "@/daemon";

const main = async () => {
  await Store.init().match(
    () => null,
    (e) => {
      logger.error(e.log());
      logger.debug(e);
    },
  );

  const program = p
    .name("hinata")
    .description("discover other hinata servers running on lan")
    .version("v1.0.0");

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
        logger.error(res.error.log());
        logger.debug(res.error);
        return;
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
        (e) => {
          logger.error(e.log());
          logger.debug(e);
        },
      );
    });

  daemon
    .command("stop")
    .description("stop the daemon")
    .action(async () => {
      await Daemon.stop().match(
        () => logger.info("daemon stopped"),
        (e) => {
          logger.error(e.log());
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
        (e) => {
          logger.error(e.log());
          logger.debug(e);
        },
      );
    });

  program
    .command("scan")
    .description("scan the network")
    .action(async () => {
      const res = await scanNetwork();
      if (res.isErr()) {
        logger.error(res.error.log());
        logger.debug(res.error);
        return;
      }

      console.log(res.value);
    });

  program.parse(process.argv);
};

main().then();
