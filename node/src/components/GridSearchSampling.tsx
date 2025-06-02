import { useState } from "react";
import { Button, Input } from "@mui/material";
import { useMMUXContext } from "../context/MMUXContext";

function runGridSearchSampling(config: unknown[]) {
  console.log("Grid Search Sampling not implemented yet!", config);
}

function GridSearchSampling() {
  const { inputVars } = useMMUXContext();
  const [gridSearchInputs, setGridSearchInputs] = useState<gridSearchInputsState[]>(
    inputVars.map((inputVar) => ({
      variable: inputVar,
      start: 0.0,
      end: 1.0,
      points: 10,
    }))
  );

  function handleInputChange(index: number, field: string, value: string) {
    setGridSearchInputs((prevInputs: gridSearchInputsState[]) => {
      const newInputs = [...prevInputs];
      newInputs[index] = {
        ...newInputs[index],
        [field]: field === "points" ? parseInt(value) : parseFloat(value),
      };
      return newInputs;
    });
  }

  return (
    <>
      <h4>Grid Search Sampling</h4>
      <p>
        Specify the ranges and number of points per dimension for the grid
        search sampling.
      </p>
      {gridSearchInputs?.map((inputVar, index) => (
        <form
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
            gap: "20px",
          }}
        >
          <h5
            style={{
              marginLeft: 10,
              marginRight: 20,
              marginBottom: 0,
              marginTop: 0,
              fontSize: 18,
            }}
          >
            {inputVar.variable}
          </h5>
          <span>Start: </span>
          <Input
            type="number"
            placeholder="Start"
            value={inputVar.start.toString()}
            sx={{ width: 100 }}
            onChange={(e) => handleInputChange(index, "start", e.target.value)}
          />
          <span>End: </span>
          <Input
            type="number"
            placeholder="End"
            value={inputVar.end.toString()}
            sx={{ width: 100 }}
            onChange={(e) => handleInputChange(index, "end", e.target.value)}
          />
          <span>Number of points: </span>
          <Input
            type="number"
            placeholder="Points"
            value={inputVar.points.toString()}
            sx={{ width: 100 }}
            onChange={(e) => handleInputChange(index, "points", e.target.value)}
          />
        </form>
      ))}

      <Button onClick={() => runGridSearchSampling(gridSearchInputs)}>
        Run Grid Search Sampling
      </Button>
    </>
  );
}

export default GridSearchSampling;
