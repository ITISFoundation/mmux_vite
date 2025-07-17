type Step = {
  id: number,
  label: string
}

type SamplingInputsState = {
  variable: string;
  start: number;
  end: number;
}

type SingleJobConfig = {
  variable: string;
  value: number;
}

type fieldType = "start" | "end" | "points" | "seed";

type LHSamplingConfig = {
  inputs: SamplingInputsState[];
  points: number;
  seed: number;
}

type GRIDSamplingConfig = SamplingInputsState[];

type dataUQHistogramType = {
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
type UncertainUQPropsType = {
  loading: boolean;
  progress: number;
  jobProgress: number;
  colsFetched: React.MutableRefObject<number>;
  jobsFetched: React.MutableRefObject<number>;
};

interface NavigationProps {
  steps: Step[];
  activeStep: number;
}
type HeaderTypes = 'title' | 'titleNoMargin' | 'bigTitle' | 'subTitle';

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
  mode: 'light' | 'dark' | 'system' | undefined;
  setMode: ( mode: 'light' | 'dark' ) => void;
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
  name: string,
  value: number,
  type?: 'number' | 'text',
  onChange: (value: unknown) => void
  error?: boolean,
}

interface InputTextBlockProps {
  name: string,
  value: string,
  onChange: (value: string) => void
}

type distribution = 'constant' | 'normal' | 'uniform' | 'log-normal' | 'exponential';
type variables = 'value' | 'mean' | 'std' | 'min' | 'max' | 'location' | 'scale';

interface VarSelection {
  distribution: distribution;
  value?: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  location?: number;
  scale?: number;
}

interface InputVarSelection {[x: string]: VarSelection}

type cvMetricsType = {
  mean_y: number;
  std_y: number;
  mean_y_hat: number;
  std_y_hat: number;
  mae: number;
  rmse: number;
};

interface MMUXDataType {
  selectedFunction: Function | undefined;
  inputVars: string[];
  outputVars: string[] | undefined;
  distribution: { [key: string]: InputVarSelection };
  launchingSampling: boolean;
  runningSampling: boolean;
  lhsSamplingConfig: LHSamplingConfig;
  gridSamplingConfig: GRIDSamplingConfig;
  singleJobConfig: SingleJobConfig[];
  numSamples: { [key: string]: number };
  runningJobCollection: RegisteredFunctionJobCollection | undefined;
  fetchedJobCollections: SelectedJobCollection[];
  selectedJobUids: string[];
  selectedQoI: string | undefined;
  isSuMoGenerated: boolean;
}