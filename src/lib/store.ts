import { Result } from "neverthrow";
import os from "os";
import path from "path";
import { type Device } from "../server.js";
import { AppError } from "./error.js";
import { FileSystem } from "./fs.js";

const storeDirPath = path.join(os.homedir(), ".local", "share", "hinata");
const storeFilePath = path.join(storeDirPath, "store.json");

export namespace Store {
  export class StoreError extends AppError {
    public readonly tag = "StoreError";
  }

  export type Data = {
    thisdevice: Device;
    knownDevices: Device[];
    secret: string;
    pid: number | undefined;
    lastScan: Date;
  };

  export const init = () =>
    FileSystem.safeMkdir(storeDirPath, { recursive: true })
      .andThen((_) => FileSystem.safeOpen(storeFilePath, "a"))
      .map(async (file) => await file.close());

  export const write = (data: Partial<Data>) =>
    init()
      .andThen(read)
      .andThen((prevData) =>
        FileSystem.safeWriteFile(
          storeFilePath,
          JSON.stringify({ ...prevData, ...data }),
        ),
      );

  export class JSONError extends AppError {
    public tag = "JSONError";
  }
  export const read = () =>
    FileSystem.safeReadFile(storeFilePath)
      .map((s) => s.toString())
      .andThen((string) =>
        Result.fromThrowable(
          () => (string.length ? (JSON.parse(string) as Data) : null),
          (e) => new JSONError("error parsing json string", e),
        )(),
      );

  export const validateRequiredData = (data: Data) =>
    // data.secret &&
    data.thisdevice && data.thisdevice.name && data.thisdevice.uname
      ? true
      : false;
}
