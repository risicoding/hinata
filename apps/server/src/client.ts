import { err, ok, Result, ResultAsync } from "neverthrow";
import { generateIpRange, getIp, IpError } from "./lib/ip";
import { PORT, type Response } from "./index";
import { AppError } from "@hinata/error";
import type { DeviceWithSelf } from "@hinata/store";

class FetchError extends AppError {
  public readonly tag = "FetchError";
}
class AuthenticationError extends AppError {
  public readonly tag = "AuthenticationError";
}

export const connect = (ip: string) =>
  ResultAsync.fromPromise(
    fetch(`http://${ip}:${PORT}`, {}),
    (e) =>
      new FetchError(`cant connect to ${ip}:${PORT}`, e, { ip, port: PORT }),
  )
    .map((res) => res.json())
    .andThen((data) =>
      data.name === "hinata"
        ? ok({ ...data, ip } as Response)
        : err(
            new AuthenticationError("server not found", null, {
              ip,
            }),
          ),
    );

export const scanNetwork = async (): Promise<
  Result<DeviceWithSelf[], IpError>
> => {
  const ip = await getIp();
  if (ip.isErr()) return err(ip.error);

  const ips = generateIpRange(ip.value);

  const res = await Promise.all(ips.map(connect));

  return ok(
    res
      .filter((v) => v.isOk())
      .map(
        (v) =>
          ({
            ...v.value.device,
            self: v.value.ip === ip.value,
          }) as DeviceWithSelf,
      ),
  );
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

let cache: DeviceWithSelf[];

export const updateCache = async (): Promise<Result<void, IpError>> => {
  const res = await scanNetwork();
  if (res.isErr()) return err(res.error);

  cache = res.value;

  return ok();
};

export const revalidate = async () => {
  await updateCache();
  void (async () => {
    while (true) {
      const res = await updateCache();
      if (res.isErr()) return err(res.error);
      await sleep(60000);
    }
  })();
};

export const getDevices = async () => {
  if (!cache) {
    await updateCache();
  }
  return cache;
};
