import { AppError } from "@hinata/error";
import { ResultAsync } from "neverthrow";
import type { DeviceWithSelf } from "@hinata/store";

export namespace HinataApi {
  export class HinataApiError extends AppError {
    public readonly tag = "HinataApiError";
  }

  export type ServerParams = {
    ip: string;
    port: number;
  };

  export type GetDevicesParams = ServerParams & {
    stale: boolean;
  };

  export const getDevices = ({
    ip = "localhost",
    port = 6745,
    stale = true,
  }: Partial<GetDevicesParams>) =>
    ResultAsync.fromPromise(
      fetch(`http://${ip}:${port}/${stale ? "devices" : "scan"}`),
      (e) => new HinataApiError("cant get devices", e),
    ).andThen(
      (res): ResultAsync<DeviceWithSelf[], HinataApiError> =>
        ResultAsync.fromPromise(
          res.json(),
          (e) => new HinataApiError("cant parse json", e),
        ),
    );

  export const revalidate = ({ ip, port }: ServerParams) =>
    ResultAsync.fromPromise(
      fetch(`http://${ip}:${port}/revalidate`),
      (e) => new HinataApiError("cant revalidate data", e),
    );
}
