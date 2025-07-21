import { JSX, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
} from "@mui/material";
import { AddBox, IndeterminateCheckBox } from "@mui/icons-material";

// This element is a generic + button with a few extra elements
// - Shows a text specifying what will be added
// - Allows to compute data on click, to be showed immediately (e.g. for SuMo plots)
// - TODO allows to remove the element (or at least to hide it) -- this is not implemented yet
type PlusButtonProps = {
  onClickFun: CallableFunction; // This defines whether something has to be done in the backend prior to adding the element
  PlotFunComponent: (props: unknown) => JSX.Element;
  text: string;
  enabled: boolean;
};
function PlusButton(props: PlusButtonProps) {
  const { enabled, text, onClickFun, PlotFunComponent } = props;
  const [showElement, setShowElement] = useState(false);
  return (
    <Accordion
      expanded={showElement}
      disableGutters
      variant="outlined"
      sx={{
        margin: "0px",
        marginTop: "16px",
        padding: "0px",
        border: "none",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        onClick={() => {
          setShowElement(!showElement);
          if (showElement) {
            onClickFun();
          }
        }}
        sx={{
          margin: "0px",
          padding: "0px",
        }}
      >
        <Box
          sx={{
            justifySelf: "left",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <IconButton
            disabled={!enabled}
            color="primary"
            sx={(theme) => ({
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: theme.palette.background.default,
            })}
          >
            {!showElement ? <AddBox /> : <IndeterminateCheckBox />}
          </IconButton>
          <span>{text}</span>
        </Box>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          display: "flex",
          width: "100%",
          overflowX: "auto",
          padding: "0px",
          margin: "0px",
        }}
      >
        <PlotFunComponent />
      </AccordionDetails>
    </Accordion>
  );
}

export default PlusButton;
