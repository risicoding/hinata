import { spawn } from "child_process";
import { Store } from "./lib/store.js";
import { logger } from "./lib/logger.js";
import path from "path";
import process from "process";
import { PORT } from "./server.js";

const readPID = () => Store.read().map((data) => data?.pid);
const savePID = (pid: number) => Store.write({ pid });
const purgePID = () => Store.write({ pid: undefined });

const isProcessRunning = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === "ESRCH") return false;
      if (code === "EPERM") return true;
    }
  }
};

export const startDaemon = () =>
  readPID().match(
    async (pid) => {
      if (pid) {
        if (isProcessRunning(pid)) {
          logger.info(`hinata server already running on ${PORT}`);
          return;
        }
      }

      const daemonPath = path.join(
        path.dirname(process.argv[1]!),
        "start-server.js",
      );

      const child = spawn(process.execPath, [daemonPath], {
        detached: true,
        stdio: "ignore",
      });

      child.unref();

      if (!child.pid) return;

      await savePID(child.pid).match(
        () => logger.info("Hinata server started"),
        (e) => {
          e.log();
          process.exit();
        },
      );
    },
    (e) => {
      e.log();
      process.exit();
    },
  );

export const stopDaemon = async () =>
  await readPID().match(
    async (pid) => {
      if (!pid) {
        logger.error("no running servers");
        return;
      }

      if (!isProcessRunning(pid)) {
        logger.error("no running servers");
        return;
      }

      try {
        process.kill(pid, "SIGTERM");
      } catch (e) {}
      logger.info("hinata server stopped");
      await purgePID();
    },
    (e) => {
      e.log();
      process.exit();
    },
  );
