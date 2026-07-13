import { err, ok, Result, ResultAsync } from "neverthrow";
import { generateIpRange, getIp, IpError } from "./ip.js";
import { PORT, type Response } from "./server.js";
import { AppError } from "./error.js";

class FetchError extends AppError {}
class AuthenticationError extends AppError {}

const connect = (ip: string) =>
  ResultAsync.fromPromise(
    fetch(`http://${ip}:${PORT}`),
    (e) => new FetchError(`cant connect to ip ${ip}`, e, { ip }),
  )
    .map((res) => res.json())
    .andThen((data) =>
      data.name === "hinata"
        ? ok({ ...data, ip } as Response)
        : err(new AuthenticationError("server not found", null, { ip })),
    );

export const scanNetwork = () =>
  getIp()
    .map(generateIpRange)
    .map((ips) => Promise.all(ips.map(connect)))
    .map((result) => result.filter((r) => r.isOk()).map((r) => r.value));
