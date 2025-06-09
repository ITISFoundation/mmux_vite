type Step = {
  id: number,
  label: string
}

type SamplingInputsState = {
  variable: string;
  start: number;
  end: number;
  value?: number; // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
  points: number; // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
  seed?: number; // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
}

type dataUQHistogramType = {
  bins_start: number;
  bins_end: number;
  bin_means: number[];
  bin_stds: number[];
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

interface MetaModelingUXProps {
  tabTitle?: string;
  infoText?: string;
  headerType: 'setup' | 'sumo' | 'uq';
  children: React.ReactNode;
}

interface HeaderProps {
    headerType: 'setup' | 'sumo' | 'uq' | 'subTitle';
    tabTitle?: string;
    infoText?: string;
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
  onChange: (value: number) => void
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