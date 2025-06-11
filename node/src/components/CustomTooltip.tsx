import { styled, TooltipProps, Tooltip, tooltipClasses } from "@mui/material";

const CustomTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
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