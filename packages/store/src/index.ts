import envPaths from "env-paths";
import path from "path";
import { Result } from "neverthrow";
import { AppError } from "@hinata/error";
import { FileSystem } from "./fs";

const STORE_DIR_PATH = envPaths("hinata").data;
const STORE_FILE_PATH = path.join(STORE_DIR_PATH, "store.json");

export type Device = {
  name: string;
  uname: string;
};

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
    FileSystem.safeMkdir(STORE_DIR_PATH, { recursive: true })
      .andThen((_) => FileSystem.safeOpen(STORE_FILE_PATH, "a"))
      .map(async (file) => await file.close());

  export const write = (data: Partial<Data>) =>
    init()
      .andThen(read)
      .andThen((prevData) =>
        FileSystem.safeWriteFile(
          STORE_FILE_PATH,
          JSON.stringify({ ...prevData, ...data }),
        ),
      );

  export class JSONError extends AppError {
    public tag = "JSONError";
  }
  export const read = () =>
    FileSystem.safeReadFile(STORE_FILE_PATH)
      .map((s) => s.toString())
      .andThen((string) =>
        Result.fromThrowable(
          () => (string.length ? (JSON.parse(string) as Data) : null),
          (e) => new JSONError("error parsing json string", e),
        )(),
      )
      .map((t) =>
        t ? ({ ...t, lastScan: new Date(t.lastScan) } as Data) : null,
      );

  export const validateRequiredData = (data: Data) =>
    // data.secret &&
    data.thisdevice && data.thisdevice.name && data.thisdevice.uname
      ? true
      : false;
}
