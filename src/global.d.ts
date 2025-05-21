type Step = {
  id: number,
  label: string
}

type PersistentState = {
    variable: string;
    start: number;
    end: number;
    points: number;
}

interface NavigationProps {
  steps: Step[];
  activeStep: number;
  setActiveStep: (step: number) => void;
}

interface MetaModelingUXProps {
  tabTitle?: string;
  headerType: 'setup' | 'sumo' | 'uq';
  children: React.ReactNode;
}

interface HeaderProps {
    headerType: 'setup' | 'sumo' | 'uq';
    tabTitle?: string;
}

interface SelectedJobCollection {
  jobCollection: FunctionJobCollection;
  selected: boolean;
}

type CollectionRowProps = {
  jobs: SelectedJobCollection;
  allSelected: boolean;
  selectJob: (selected: boolean) => void;
};

interface JobRowProps  {
  jobUid: string
  setSelected: (selected: boolean) => void;
  jobList: {[key: string]: boolean}
}