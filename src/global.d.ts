type Step = {
  id: number,
  label: string
}

type PersistentState = {
  variable: string;
  start: number;
  end: number;
  points: number; // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
  seed?: number; // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
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