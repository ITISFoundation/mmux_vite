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
};
type UncertainUQPropsType = {
  numSamples: number;
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
type HeaderTypeEnum = 'setup' | 'sumo' | 'uq'
interface MetaModelingUXProps {
  tabTitle?: string;
  infoText?: string;
  ExtendedInfoText?: ReactElement;
  helpContents?: ReactElement;
  headerType: HeaderTypeEnum;
  children: React.ReactNode;
}

type HeaderTypes = 'setup' | 'sumo' | 'uq' | 'subTitle';
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

interface JobRowProps  {
  jobUid: string
  setSelected: (selected: boolean, subJob: string) => void;
  jobList: SubJob[];
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