import { ResultAsync } from "neverthrow";
import { AppError } from "@hinata/error";

import os from "node:os";

export class IpError extends AppError {
  public readonly tag = "IpError";
}

export const getIp = (): ResultAsync<string, IpError> =>
  ResultAsync.fromPromise(
    new Promise((resolve, reject) => {
      const interfaces = os.networkInterfaces();

      for (const entries of Object.values(interfaces)) {
        for (const entry of entries ?? []) {
          if (entry.family === "IPv4" && !entry.internal) {
            resolve(entry.address);
          }
        }
      }

      reject();
    }),
    (e) => new IpError("cant find ip", e),
  );

export const generateIpRange = (ip: string) => {
  const parts = ip.split(".");

  Number(parts.pop());
  const prefix = parts.join(".");

  return (
    Array.from({ length: 254 }, (_, i) => i + 1)
      // .filter((i) => i !== own)
      .map((i) => `${prefix}.${i}`)
  );
};

// export const getIp = () =>
//   ResultAsync.fromPromise(
//     new Promise<string>((resolve, reject) => {
//       const socket = dgram.createSocket("udp4");
//       socket.once("error", (e) => {
//         socket.close();
//         reject(e);
//       });
//
//       socket.connect(53, "8.8.8.8", () => {
//         resolve(socket.address().address);
//         socket.close();
//       });
//     }),
//     (e) => new IpError("cant find ip", e),
//   );
//
