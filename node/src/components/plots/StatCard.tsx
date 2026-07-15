import React from "react";
import { Paper, Typography, useTheme } from "@mui/material";

type StatCardProps = {
  label: string;
  value: number | string;
  precision?: number;
  color?: string;
  /** Optional mini-chart slot, reusable across content variants; unused today. */
  sparkline?: React.ReactNode;
};

/**
 * Shared "stats modal" visual primitive (V25, ../../SPEC.md T32/../flaskapi/SPEC.md T24/T34):
 * a single label/value card, reused by both the SuMo Stats step and the UQ Stats modal.
 */
function StatCard(props: StatCardProps) {
  const { label, value, precision = 4, color, sparkline } = props;
  const theme = useTheme();
  const formattedValue = typeof value === "number" ? value.toPrecision(precision) : value;

  return (
    <Paper
      variant="outlined"
      mmux-testid={`stat-card-${label}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        padding: "12px 16px",
        minWidth: "96px",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography variant="caption" color={theme.palette.text.secondary}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={300} color={color}>
        {formattedValue}
      </Typography>
      {sparkline}
    </Paper>
  );
}

export default StatCard;
