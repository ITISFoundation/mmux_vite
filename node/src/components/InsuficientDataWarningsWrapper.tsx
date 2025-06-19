import { DisplayMessage } from "./DisplayMessage";

type InsuficientDataWarningsWrapperPropsType = {
  children: React.ReactNode; // what will be shown if everything goes well
  calculating: boolean;
  data: dataUQHistogramType | undefined;
  fetchedJobCollections: any;
  filterSelectedJobList: any;
}

const InsuficientDataWarningsWrapper = (props: InsuficientDataWarningsWrapperPropsType) => {
  const { calculating, children, data, fetchedJobCollections, filterSelectedJobList } = props
  if (calculating) {
    return (
      <DisplayMessage mssg={"Calculating..."} />
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