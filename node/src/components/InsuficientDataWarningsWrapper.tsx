import { DisplayMessage } from "./DisplayMessage";

type InsuficientDataWarningsWrapperPropsType = {
  children: React.ReactNode; // what will be shown if everything goes well
  calculating: boolean;
  data: dataUQHistogramType | cvMetricsType | undefined;
  fetchedJobCollections: any;
  filterSelectedJobList: any;
  height?: number;
}

const InsuficientDataWarningsWrapper = (props: InsuficientDataWarningsWrapperPropsType) => {
  const { calculating, children, data, fetchedJobCollections, filterSelectedJobList, height } = props
  if (calculating) {
    return (
      <DisplayMessage mssg={"Calculating..."} height={height} />
    )
  } else if (data === undefined) {
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