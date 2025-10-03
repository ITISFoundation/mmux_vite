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
  bins_start: number;
  bins_end: number;
  bin_means: number[];
  bin_stds: number[];
  q1: number;
  median: number;
  q3: number;
  whisker_min: number;
  whisker_max: number;
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
  progress: number;
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
  ExtendedInfoText?: ReactElement;
  helpContents?: ReactElement;
  headerType: HeaderTypes;
  children: React.ReactNode;
}
interface HeaderProps {
  headerType: HeaderTypes;
  tabTitle?: string;
  infoText?: string;
  ExtendedInfoText?: ReactElement;
  helpContents?: ReactElement;
  fontWeight?: React.CSSProperties["fontWeight"];
  errorMessage?: string;
  QOISelector?: React.ReactNode;
}

interface SubJob {
  selected: boolean;
  job: FunctionJob | undefined;
}

interface SelectedJobCollection {
  jobCollection: FunctionJobCollection;
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

interface FunctionJobCollection {
  title: string;
  description: string;
  jobIds: Array<string>;
  uid: string;
}

interface InputBlockProps {
  name: string;
  value: number;
  type?: "number" | "text";
  onChange: (value: unknown) => void;
  error?: boolean;
  minmax?: { min: number; max: number };
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
}

interface OutputVarSelection {
  [x: string]: OutputOptimization;
}
interface InputVarSelection {
  [x: string]: VarSelection;
}

type CvMetricsType = {
  mean_y: number;
  std_y: number;
  mean_y_hat: number;
  std_y_hat: number;
  mae: number;
  rmse: number;
};

type MogaDataRowType = { [key: string]: number; Performance: number; NDI: number };

interface MogaDataType {
  inputs: string[];
  outputs: string[];
  raw: { [key: string]: number[] };
  rows: Array<MogaDataRowType>;
}
