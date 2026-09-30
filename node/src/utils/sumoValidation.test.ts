import { describe, expect, it } from "vitest";
import { getValidationSeries } from "./sumoValidation";

describe("getValidationSeries", () => {
  it("V30ab reads fixed response fields without changing the QoI", () => {
    const series = getValidationSeries({ observed: [1, 2], predicted: [1.1, 1.9] });

    expect(series).toEqual({
      observations: [1, 2],
      predictions: [1.1, 1.9],
    });
  });

  it("V30ab rejects a response missing either validation series", () => {
    expect(getValidationSeries({ observed: [1, 2] })).toBeUndefined();
  });
});
