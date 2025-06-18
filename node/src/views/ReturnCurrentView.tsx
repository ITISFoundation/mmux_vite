import Setup from "./Setup";
import UQ from "./UQ";
import SuMo from "./SuMo";
import { useServiceContext } from "../context/ServiceContext";

type ReturnCurrentViewPropsType = {
    currentView: number
}
export const ReturnCurrentView = (props: ReturnCurrentViewPropsType) => {
    const { currentView } = props
    const { serviceMode } = useServiceContext();
    console.log("service mode: ", serviceMode)
    return (<>
        {currentView === 0 ? <Setup /> : undefined}
        {currentView === 1 ?
            serviceMode === "UQ" ? <UQ /> :
                serviceMode === "SUMO" ? <SuMo /> :
                    "Unknown service mode, please contact support!!"
            : undefined}
    </>)
}