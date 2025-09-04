import { Step, StepLabel, Stepper, styled } from "@mui/material";

const NavBar = styled("div")`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  padding-top: 10px;
  padding-bottom: 10px;
`;

const Navi = styled(NavBar)(
  ({ theme }) => `
  width: 100%;
  height: 64px;
  padding: 2em 2em;
  & .MuiStepLabel-label {
    font-family: inherit;
    font-size: 1.2em;
    font-weight: 100;
  }
  & .stepper{
    flex: 1;
    & .MuiSvgIcon-root:not(.Mui-active):not(.Mui-completed) {
      color: ${theme.palette.background.paper};
    }
    & > .MuiStepConnector-root.Mui-active {
      & .MuiStepConnector-line {
        border-color: ${theme.palette.primary.main};
      }
    }
    & > .MuiStepConnector-root.Mui-completed {
      & .MuiStepConnector-line {
        border-color: ${theme.palette.primary.main};
      }
    }
  }
`,
);

function Navigation(props: NavigationProps) {
  const { steps, activeStep, ...rest } = props;
  return (
    <Navi {...rest}>
      <Stepper activeStep={activeStep} className="stepper">
        {steps.map(step => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: {
            optional?: React.ReactNode;
          } = {};
          return (
            <Step key={step.id} {...stepProps}>
              <StepLabel {...labelProps}>{step.label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Navi>
  );
}
export default Navigation;
