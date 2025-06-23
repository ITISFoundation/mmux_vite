import { DisplayMessage } from "../utils/DisplayMessage";

type InsufficientDataWarningPropsType = {
  fetchedJobCollections: any;
  filterSelectedJobList: any;
  height?: number;
}

// insert if plotData has length 0
const InsufficientDataWarning = (props: InsufficientDataWarningPropsType) => {
  const { fetchedJobCollections, filterSelectedJobList, height } = props
  return (
    <DisplayMessage mssg={fetchedJobCollections.length === 0
      ? 'No data available. Please create more Samples.'
      : filterSelectedJobList().length === 0 ? 'Select at least 5 Samples to be used by the model.'
        : "Error during calculation, please contact support."
    } height={height}
    />
  );
}


export default InsufficientDataWarning;