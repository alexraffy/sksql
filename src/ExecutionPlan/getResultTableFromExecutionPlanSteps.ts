import {TExecutionPlan} from "./TEP";
import {TEPSelect} from "./TEPSelect";


export function getResultTableFromExecutionPlanSteps(e: TExecutionPlan) {
    for (let i = e.steps.length - 1; i >= 0; i--) {
        if (e.steps[i].kind === "TEPSelect") {
            return (e.steps[i] as TEPSelect).dest;
        }
    }
    return "";
}