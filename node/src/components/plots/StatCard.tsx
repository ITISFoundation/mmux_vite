import { Card, CardContent, Typography } from "@mui/material";

type StatCardProps = {
  label: string;
  value: number;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card variant="outlined" sx={{ minWidth: 110 }}>
      <CardContent sx={{ textAlign: "center", "&:last-child": { pb: 2 } }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6">{value.toPrecision(5)}</Typography>
      </CardContent>
    </Card>
  );
}

export default StatCard;
