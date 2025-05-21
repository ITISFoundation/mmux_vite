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