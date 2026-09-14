import "server-only";

import appsJson from "../../../config/apps.json";
import { parseAppDefinitions } from "./validate";

export function getAppDefinitions() {
  return parseAppDefinitions(appsJson);
}
