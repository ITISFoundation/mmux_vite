export function getSamplingStartValue(inputVar: string, distribution: InputVarSelection) {
  if (!distribution || !distribution[inputVar]) {
    console.warn("Distribution object for", inputVar, " does not exist: ", distribution);
    return "Error. Please contact support";
  }
  if (distribution[inputVar].distribution === "constant") {
    return distribution[inputVar].value;
  }
  if (distribution[inputVar].distribution === "normal") {
    if (distribution && distribution[inputVar].mean !== undefined && distribution[inputVar].std !== undefined) {
      return distribution[inputVar].mean - 2.5 * distribution[inputVar].std;
    }
    console.warn("Mean or std is undefined for", inputVar, ":", distribution[inputVar]);
    return "Error. Please contact support";
  }
  if (distribution[inputVar].distribution === "uniform") {
    return distribution[inputVar].min;
  }
  console.warn("Distribution type not found!!");
  return "Error. Please contact support";
}

export function getSamplingEndValue(inputVar: string, distribution: InputVarSelection) {
  if (!distribution || !distribution[inputVar]) {
    console.warn("Distribution object for", inputVar, " does not exist: ", distribution);
    return "Error. Please contact support";
  }
  if (distribution[inputVar].distribution === "constant") {
    return distribution[inputVar].value;
  }
  if (distribution[inputVar].distribution === "normal") {
    if (distribution && distribution[inputVar].mean !== undefined && distribution[inputVar].std !== undefined) {
      return distribution[inputVar].mean + 2.5 * distribution[inputVar].std;
    }
    console.warn("Mean or std is undefined for", inputVar, ":", distribution[inputVar]);
    return "Error. Please contact support";
  }
  if (distribution[inputVar].distribution === "uniform") {
    return distribution[inputVar].max;
  }
  console.warn("Distribution type not found!!");
  return "Error. Please contact support";
}
