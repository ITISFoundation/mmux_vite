import { Modal, styled, Tooltip, tooltipClasses, TooltipProps, Typography, useTheme } from "@mui/material";
import { ReactElement, useState } from "react";

interface CustomTooltipProps extends TooltipProps {
  extendedTooltip?: ReactElement;
  border?: boolean;
}

const CustomTooltip = styled((props: CustomTooltipProps) => {
  const { extendedTooltip, className, title, border, ...rest } = props;
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const infotextWButton = (
    <Typography
      variant="body2"
      fontFamily="inherit"
      sx={{
        border: border ? `1px solid ${theme.palette.divider}` : undefined,
        borderRadius: border ? 1 : undefined,
        padding: border ? "4px" : undefined,
        margin: border ? "0px" : undefined,
      }}
    >
      {title}
      {extendedTooltip ? (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            setOpen(true);
          }}
          style={{
            marginLeft: "8px",
            color: `${theme.palette.primary.main}`,
            textDecoration: "underline",
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Read more...
        </button>
      ) : undefined}
    </Typography>
  );

  return (
    <>
      <Tooltip {...rest} title={infotextWButton} arrow classes={{ popper: className }} />
      {extendedTooltip && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          aria-labelledby="extended-tooltip-title"
          aria-describedby="extended-tooltip-description"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {extendedTooltip}
        </Modal>
      )}
    </>
  );
})(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.default,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontFamily: "inherit",
    fontWeight: 200,
    fontSize: "0.9rem",
    padding: "8px 12px",
    maxWidth: "600px",
  },
}));

export default CustomTooltip;
