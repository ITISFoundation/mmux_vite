import { DisplayMessage } from "./../DisplayMessage";

type PlotLoadingWrapperPropsType = {
  children: React.ReactNode; // what will be shown if everything goes well
  plotData: any[];
  filterSelectedJobList: any;
  height?: number;
}

const PlotLoadingWrapper = (props: PlotLoadingWrapperPropsType) => {
  const { children, plotData, height, filterSelectedJobList } = props
  if (plotData.length === 0) {
    return (
      <DisplayMessage
        height={height} // Same as the plot it substitutes
        mssg={
          filterSelectedJobList().length === 0
            ? 'No data selected'
            : "Calculating..."
        }
      />
    )
  }
  return (
    children
  )
}

export default PlotLoadingWrapper;