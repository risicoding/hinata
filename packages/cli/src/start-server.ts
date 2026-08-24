import { initServer } from "@hinata/server";
import { Store } from "@hinata/store";
import { logger } from "@hinata/logger";

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
      logger.error(e.log);
      logger.debug(e);
    },
  )
  .then(() => null);
