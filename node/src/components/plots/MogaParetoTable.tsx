import {
  TableRow,
  TableCell,
  Typography,
  TableBody,
  TableContainer,
  TableHead,
  styled,
  Button,
} from "@mui/material";

const MogaParetoTable = (props: any) => {
  const dummyData = [
    { w: 1, x: 2, y: 3, z: 4, a: 5, b: 6, c: 7, Performance: 0.7 },
    { w: 8, x: 9, y: 10, z: 11, a: 12, b: 13, c: 14, Performance: 0.8 },
    { w: 15, x: 16, y: 17, z: 18, a: 19, b: 20, c: 21, Performance: 0.9 },
  ];

  return (
    <TableContainer aria-label="Pareto Table" {...props}>
      <TableHead className="moga-pareto-table-head">
        <TableRow className="moga-pareto-table-row">
          {Object.keys(dummyData[0]).map((key) => (
            <TableCell key={key}>
              <Typography variant="subtitle2">{key}</Typography>
            </TableCell>
          ))}
          <TableCell key={dummyData.length}>
            <Typography></Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody className="moga-pareto-table-body">
        {dummyData.map((row, index) => (
          <TableRow className="moga-pareto-table-row" key={index}>
            {Object.keys(row).map((key) => (
              <TableCell key={key}>
                <Typography variant="body2">{`${
                  row[key as keyof typeof row]
                }`}</Typography>
              </TableCell>
            ))}
            <TableCell key={Object.keys(row).length}>
              <Typography variant="body2">
                <Button
                  variant="contained"
                  className="moga-pareto-table-action-button"
                >
                  Action
                </Button>
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableContainer>
  );
};

export default styled(MogaParetoTable)(
  ({ theme }) => `
  font-family: inherit;
  background-color: ${theme.palette.background.default};
  border-radius: ${theme.spacing(2)};
  padding: ${theme.spacing(2)};
  margin-top: ${theme.spacing(2)};
  max-height: 800px;
  & .moga-pareto-table-head {
    display: flex;
    > .moga-pareto-table-row {
      > .MuiTableCell-root {
        border: none;
        background-color: ${theme.palette.background.paper};
        margin: 0px 4px;
        padding: ${theme.spacing(2)};
        border-radius: ${theme.spacing(2)};
        color: ${theme.palette.text.primary};
        > .MuiTypography-root {
          font-weight: 600;
          font-size: 1.2em;
        }
      :last-child {
        background-color: ${theme.palette.background.default};
      }
    }
    }
  }
  & .moga-pareto-table-body {
    display: flex;
    flex-direction: column;
    > .moga-pareto-table-row {
      > .MuiTableCell-root {
        border: none;
        padding: 8px;
      }
    }
  }
  & .moga-pareto-table-row {
    display: flex;
    border: none;
    width: 100%;
    .MuiTableCell-root {
      flex: 1;
      text-align: center;
      :last-child {
        text-align: right;
      }
    }
  & .moga-pareto-table-action-button {
      width: 100%;
      background-color: ${theme.palette.primary.main};
      color: ${theme.palette.primary.contrastText};
      margin: ${theme.spacing(0)};
      padding: 4px;
      &:hover {
        background-color: ${theme.palette.primary.dark};
        color: ${theme.palette.primary.contrastText};
      }
    }
  }
`
);
