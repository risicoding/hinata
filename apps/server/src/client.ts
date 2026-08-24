import { err, ok, ResultAsync } from "neverthrow";
import { generateIpRange, getIp } from "./lib/ip";
import { PORT, type Response } from "./index";
import { AppError } from "@hinata/error";
import { logger } from "@hinata/logger";

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

export const scanNetwork = () =>
  getIp()
    .map(generateIpRange)
    .map(async (ips) => await Promise.all(ips.map(connect)))
    .map((result) => result.filter((r) => r.isOk()).map((r) => r.value));

// async function main() {
//   console.time("getIp");
//   const ip = await getIp();
//   if (ip.isErr()) return err(ip.error);
//   console.timeEnd("getIp");
//
//   console.time("generateIpRange");
//   const ipRange = generateIpRange(ip.value);
//   console.timeEnd("generateIpRange");
//
//   console.time("connnect");
//   const res = await Promise.all(ipRange.map(connect));
//   console.timeEnd("connnect");
//
//   res.forEach((v) => {
//     if (v.isErr()) return;
//     console.log(v);
//   });
// }
//
// main().then();
