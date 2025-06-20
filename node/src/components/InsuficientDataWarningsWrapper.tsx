import { DisplayMessage } from "./DisplayMessage";

type InsuficientDataWarningsWrapperPropsType = {
  children: React.ReactNode; // what will be shown if everything goes well
  calculating: boolean;
  plotData: Plotly.Data[];
  fetchedJobCollections: any;
  filterSelectedJobList: any;
  height?: number;
}

const InsuficientDataWarningsWrapper = (props: InsuficientDataWarningsWrapperPropsType) => {
  const { calculating, children, plotData, fetchedJobCollections, filterSelectedJobList, height } = props
  if (calculating) {
    return (
      <DisplayMessage mssg={"Calculating..."} height={height} />
    )
  } else if (plotData.length === 0) {
    return (
      <DisplayMessage mssg={fetchedJobCollections.length === 0
        ? 'No data available. Please create more Samples.'
        : filterSelectedJobList().length === 0 ? 'Not enough Samples selected'
          : "Error during calculation, please contact support."
      }
      />
    );
  } else {
    return children
  }
}

export default InsuficientDataWarningsWrapper;