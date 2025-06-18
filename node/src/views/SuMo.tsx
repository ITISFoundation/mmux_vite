import { useMMUXContext } from "../context/MMUXContext";
import GeneralResultsView from "./GeneralResultsView";
import SuMoPlotsSteps from "../components/SuMoPlotsSteps";

export default function SuMo() {
    const { selectedFunction } = useMMUXContext();

    return (
        <GeneralResultsView headerType="sumo" tabTitle={`AI-Enabled Model Insights: ${selectedFunction?.title}`}>
            <SuMoPlotsSteps />
        </GeneralResultsView >
    );
}
