import path from "node:path";
import { mainCheckout, openLog, pass, runSteps } from "./lib";
import { sweep } from "./sweep";

const notes: string[] = [];
openLog(path.join(mainCheckout(), ".verification", "cleanup.log"));

runSteps(
  "CLEANUP",
  [
    {
      name: "sweep merged tickets",
      run: () => {
        notes.push(...sweep());
        return pass;
      },
    },
  ],
  notes,
);
