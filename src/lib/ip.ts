import { ResultAsync } from "neverthrow";
import dgram from "node:dgram";
import { AppError } from "./error.js";

export class IpError extends AppError {
  public readonly tag = "IpError";
}

export const getIp = () =>
  ResultAsync.fromPromise(
    new Promise<string>((resolve, reject) => {
      const socket = dgram.createSocket("udp4");
      socket.once("error", (e) => {
        socket.close();
        reject(e);
      });

      socket.connect(53, "8.8.8.8", () => {
        resolve(socket.address().address);
        socket.close();
      });
    }),
    (e) => new IpError("cant find ip", e),
  );

export const generateIpRange = (ip: string) => {
  const parts = ip.split(".");

  // const own = Number(parts.pop());
  const prefix = parts.join(".");

  return (
    Array.from({ length: 254 }, (_, i) => i + 1)
      // .filter((i) => i !== own)
      .map((i) => `${prefix}.${i}`)
  );
};
