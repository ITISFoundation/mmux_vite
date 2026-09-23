// CodSpeed benchmarks for the job-collection CSV import (§T6, V13). Uploading a
// job collection parses the whole file in the browser main thread before the
// request is built, so parsing cost is directly perceived by the user.

import { bench, describe } from "vitest";
import { parseJobCollectionCsv } from "./jobCollectionCsv";

const inputVars = [
  "sigma_blood",
  "TissueConduc",
  "electrode_radius",
  "pulse_width",
  "AmplitudeGain",
  "fiber_diameter",
  "myelin_thickness",
  "node_length",
];
const outputVars = ["AFpeak", "activation_threshold", "energy"];

function buildCsv(rowCount: number): string {
  const header = [
    "source_job_uid",
    "status",
    ...inputVars.map(variable => `input__${variable}`),
    ...outputVars.map(variable => `output__${variable}`),
  ].join(",");

  const lines = [
    "# source_function_uid,11111111-2222-3333-4444-555555555555",
    "# source_job_collection_uid,66666666-7777-8888-9999-000000000000",
    '# source_job_collection_title,"Titration sweep, 50 LHS"',
    header,
  ];

  for (let row = 0; row < rowCount; row += 1) {
    const inputs = inputVars.map((_variable, index) => (0.001 * (index + 1) * (row + 1)).toExponential(6));
    const outputs = outputVars.map((_variable, index) => (1.5 * (index + 1) * (row + 1)).toFixed(6));
    lines.push([`job-${row}`, row % 9 === 0 ? "failed" : "completed", ...inputs, ...outputs].join(","));
  }

  return lines.join("\n");
}

const smallCsv = buildCsv(50);
const mediumCsv = buildCsv(1000);
const largeCsv = buildCsv(5000);

describe("parseJobCollectionCsv", () => {
  bench("50 jobs", () => {
    parseJobCollectionCsv(smallCsv);
  });

  bench("1k jobs", () => {
    parseJobCollectionCsv(mediumCsv);
  });

  bench("5k jobs", () => {
    parseJobCollectionCsv(largeCsv);
  });
});
