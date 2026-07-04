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
  if (distribution[inputVar].distribution === "log-normal") {
    if (distribution && distribution[inputVar].logMean !== undefined && distribution[inputVar].logStd !== undefined) {
      // logMean/logStd are the mu/sigma of the underlying Normal in log-space
      // (numpy.random.lognormal(mean, sigma) convention). Lower limit is exp(logMean - 2.5 * logStd).
      return Math.exp(distribution[inputVar].logMean - 2.5 * distribution[inputVar].logStd);
    }
    console.warn("logMean or logStd is undefined for", inputVar, ":", distribution[inputVar]);
    return "Error. Please contact support";
  }
  if (distribution[inputVar].distribution === "exponential") {
    // FIXME this was AI-generated, double-check
    // For exponential, the lower limit is typically 0
    return 0;
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
  if (distribution[inputVar].distribution === "log-normal") {
    if (distribution && distribution[inputVar].logMean !== undefined && distribution[inputVar].logStd !== undefined) {
      // logMean/logStd are the mu/sigma of the underlying Normal in log-space
      // (numpy.random.lognormal(mean, sigma) convention). Upper limit is exp(logMean + 2.5 * logStd).
      return Math.exp(distribution[inputVar].logMean + 2.5 * distribution[inputVar].logStd);
    }
    console.warn("logMean or logStd is undefined for", inputVar, ":", distribution[inputVar]);
    return "Error. Please contact support";
  }
  if (distribution[inputVar].distribution === "exponential") {
    // For exponential, upper limit is not defined, but can use a practical upper bound
    // Here, use 5/λ if λ is available (mean + 5*std for exponential)
    if (distribution[inputVar].scale !== undefined) {
      return 5 / distribution[inputVar].scale;
    }
    return "Error. Please contact support";
  }
  console.warn("Distribution type not found!!");
  return "Error. Please contact support";
}
