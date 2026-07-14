import { initServer } from "./server.js";
import { Store } from "./lib/store.js";
import { logger } from "./lib/logger.js";

Store.read()
  .map((data) => {
    if (!data) {
      logger.error("required data not found");
      return;
    }
    if (!Store.validateRequiredData(data)) {
      logger.error("required data not found");
      return;
    }

    initServer(data.thisdevice);
  })
  .match(
    () => null,
    (e) => {
      e.log();
      process.exit();
    },
  )
  .then(() => null);
