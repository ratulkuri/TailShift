export { convertV3toV4 } from "./v3-to-v4";
export { convertV4toV3 } from "./v4-to-v3";
export type { ConvertResult, Change } from "./v3-to-v4";

export type Direction = "v3-to-v4" | "v4-to-v3";

import { convertV3toV4 } from "./v3-to-v4";
import { convertV4toV3 } from "./v4-to-v3";

export function convert(input: string, direction: Direction) {
  return direction === "v3-to-v4" ? convertV3toV4(input) : convertV4toV3(input);
}
