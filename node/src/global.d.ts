type Step = {
  id: number;
  label: string;
};

type SamplingInputsState = {
  variable: string;
  start: number;
  end: number;
};

type SingleJobConfig = {
  variable: string;
  value: number;
};

type FieldType = "start" | "end" | "points" | "seed";

type LHSamplingConfig = {
  inputs: SamplingInputsState[];
  points: number;
  seed: number;
};

type GridSamplingConfig = SamplingInputsState[];

type DataUQHistogramType = {
  binsStart: number;
  binsEnd: number;
  binMeans: number[];
  binStds: number[];
  q1: number;
  median: number;
  q3: number;
  whiskerMin: number;
  whiskerMax: number;
  outliers: number[];
  // new metrics to be displayed with Histogram (instead of whisker plot)
  mean: number;
  std: number;
  min: number;
  max: number;
  // extended percentiles for UQ Stats modal (T24/T32/T34)
  p1: number;
  p5: number;
  p95: number;
  p99: number;
};

// #470: per-input <-> output correlation strength ({pearson,spearman} coefficients),
// one entry per requested input variable, from `/flask/dakota/compute_correlation_indices`.
type CorrelationCoefficients = {
  pearson: number;
  spearman: number;
};

type CorrelationIndicesResponse = {
  correlations: { [inputVar: string]: CorrelationCoefficients };
};

// #470/#T22/T25: per-input first-order (main effect) and total-order Sobol'
// sensitivity indices, one entry per requested input variable, from
// `/flask/dakota/compute_sobol_indices` (scipy-based, post-migration).
// `*CiLow`/`*CiHigh`: bootstrap confidence interval bounds (95%, T25) --
// always present (backend computes them for free alongside the point
// estimates), displayed as error bars on the first/total-order bar charts.
// sobolSecondOrder: symmetric pairwise second-order indices (no self-pairs),
// diagonal filled on frontend from the corresponding first-order index; no
// CI display on the second-order heatmap (out of scope).
type SobolIndexPair = {
  main: number;
  total: number;
  mainCiLow: number;
  mainCiHigh: number;
  totalCiLow: number;
  totalCiHigh: number;
};

type SobolIndicesResponse = {
  sobol: { [inputVar: string]: SobolIndexPair };
  sobolSecondOrder: { [varA: string]: { [varB: string]: number } };
};

type PlotConfig = {
  dimensionType: "1D" | "2D" | "3D";
  scaleType: "linear" | "log";
};

type LoadingPropsType = {
  loading: boolean;
  setLoading?: (loading: boolean) => void;
  jobProgress: number;
  colsFetched: React.MutableRefObject<number>;
  jobsFetched: React.MutableRefObject<number>;
};

interface NavigationProps {
  steps: Step[];
  activeStep: number;
}
type HeaderTypes = "title" | "titleNoMargin" | "bigTitle" | "subTitle";

interface MetaModelingUXProps {
  tabTitle?: string;
  infoText?: string;
  extendedInfoText?: ReactElement;
  helpContents?: ReactElement;
  headerType: HeaderTypes;
  children: React.ReactNode;
}
interface HeaderProps {
  headerType: HeaderTypes;
  tabTitle?: string;
  infoText?: string;
  extendedInfoText?: ReactElement;
  helpContents?: ReactElement;
  fontWeight?: React.CSSProperties["fontWeight"];
  errorMessage?: string;
  qoiSelector?: React.ReactNode;
}

interface SubJob {
  selected: boolean;
  // Post-normalization job shape (status flattened to a string by JobContext). Inline
  // import() keeps this file an ambient global script. See src/context/types.d.ts.
  job: import("./context/types").OsparcFunctionJob;
}

interface SelectedJobCollection {
  // The API returns *registered* collections (carry uid/created_at); use the generated
  // type directly rather than a hand-rolled local interface (title/jobIds are optional).
  jobCollection: import("osparc-api-ts-client").RegisteredFunctionJobCollection;
  selected: boolean;
  subJobs: SubJob[];
}

interface FooterProps {
  mode: "light" | "dark" | "system" | undefined;
  setMode: (mode: "light" | "dark") => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface PersistentJSONStateOptions<T> {
  defaultState: T;
  filePath: string;
  onStateLoaded?: (state: T) => void;
}

interface InputBlockProps {
  name: string;
  value: number;
  type?: "number" | "text";
  onChange: (value: unknown) => void;
  error?: boolean;
  minmax: { min: number; max: number };
}

interface InputTextBlockProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

type Distribution = "constant" | "normal" | "uniform" | "log-normal" | "exponential";
type Variables = "value" | "mean" | "std" | "min" | "max" | "location" | "scale";
type OutputOptimization = "minimize" | "maximize";

interface VarSelection {
  distribution: Distribution;
  value?: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  location?: number;
  scale?: number;
  // Per-variable log-scale tag inferred/set alongside the distribution (V13);
  // end-to-end plot/request wiring lands separately (§T8/T9, V12).
  logScale?: boolean;
}

interface OutputVarSelection {
  [x: string]: OutputOptimization;
}
interface InputVarSelection {
  [x: string]: VarSelection;
}

type CvMetricsType = {
  meanY: number;
  stdY: number;
  meanYHat: number;
  stdYHat: number;
  mae: number;
  rmse: number;
  r2: number;
};

type MogaDataRowType = { [key: string]: number; performance: number; ndi: number };

interface MogaDataType {
  inputs: string[];
  outputs: string[];
  raw: { [key: string]: number[] };
  rows: Array<MogaDataRowType>;
}
