import { spawn } from "child_process";
import { Store } from "./lib/store.js";
import { logger } from "./lib/logger.js";
import path from "path";
import process from "process";
import { AppError } from "./lib/error.js";
import { err, ok } from "neverthrow";

export namespace Daemon {
  export class DaemonError extends AppError {
    public readonly tag = "DaemonError";
  }
  const readPID = () => Store.read().map((data) => data?.pid);
  const savePID = (pid: number) => Store.write({ pid });
  const purgePID = () => Store.write({ pid: undefined });

  const isRunning = (pid: number) => {
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

  export const status = () =>
    readPID().map((pid) => {
      if (!pid) return false;

      if (isRunning(pid)) return true;
      return false;
    });

  export const start = () =>
    status()
      .andThen((isRunning) => {
        if (isRunning) {
          logger.warn("hinata server already running");
          return err(new DaemonError());
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

        if (!child.pid) return err(new DaemonError());

        return ok(child.pid);
      })
      .andThen(savePID);

  export const stop = () =>
    readPID()
      .andThen((pid) => {
        if (!pid) return err(new DaemonError());
        if (!isRunning(pid)) return err(new DaemonError());

        try {
          process.kill(pid);
        } catch (e) {
          return err(new DaemonError("failed to stop daemon", e));
        }

        return ok();
      })
      .andThen(purgePID);
}
