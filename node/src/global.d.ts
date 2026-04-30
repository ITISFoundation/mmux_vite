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

type MuiIconComponent = React.ComponentType<import("@mui/material/SvgIcon").SvgIconProps>;

declare module "@mui/icons-material/Add" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/AddBox" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/Cancel" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/Download" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/EditAttributes" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/HelpOutline" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/IndeterminateCheckBox" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/InfoOutline" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/InfoOutlined" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/KeyboardArrowDown" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/KeyboardArrowLeft" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/KeyboardArrowRight" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/KeyboardArrowUp" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/Refresh" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
}

declare module "@mui/icons-material/ShowChart" {
  const IconComponent: MuiIconComponent;
  export default IconComponent;
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
};

type MogaDataRowType = { [key: string]: number; performance: number; ndi: number };

interface MogaDataType {
  inputs: string[];
  outputs: string[];
  raw: { [key: string]: number[] };
  rows: Array<MogaDataRowType>;
}
