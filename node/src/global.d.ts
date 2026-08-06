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
  // T25: optional action rendered right after the title (e.g. a "refresh all" button),
  // in the slot the info icon otherwise occupies inline.
  titleAction?: React.ReactNode;
  // T25: when true, the infoText tooltip icon renders flush right (beside
  // qoiSelector/helpContents) instead of inline next to the title.
  trailingInfoIcon?: boolean;
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
  // T25: optional inline "refresh" action (re-infer just this field from data),
  // rendered opposite the name label. Omitted -> no refresh button shown.
  onRefresh?: () => void;
  refreshTestId?: string;
}

interface InputTextBlockProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

type Distribution = "constant" | "normal" | "uniform";
type Variables = "value" | "mean" | "std" | "min" | "max";
type OutputOptimization = "minimize" | "maximize";

interface VarSelection {
  distribution: Distribution;
  value?: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  // Orthogonal linear/log sampling scale, independent of the distribution `shape`.
  // "log" means the variable is sampled/trained in log space (log-uniform for a
  // uniform shape, log-normal for a normal shape). Replaces the old per-type
  // `logScale` (uniform only) / separate `log-normal` type. See B33/V40.
  scale?: "linear" | "log";
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
};

type MogaDataRowType = { [key: string]: number; performance: number; ndi: number };

interface MogaDataType {
  inputs: string[];
  outputs: string[];
  raw: { [key: string]: number[] };
  rows: Array<MogaDataRowType>;
}
