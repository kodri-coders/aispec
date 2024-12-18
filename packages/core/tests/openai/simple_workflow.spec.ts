import { Assistant } from "../../src";
import * as path from "path";

const artifactPath = path.join(
  __dirname,
  "artifacts",
  "plant_finder.xml",
);
const assistant = new Assistant({ "@ref": artifactPath });
describe("assistant", () => {
  it("loads name and description", () => {
    expect(assistant.name).toMatchSnapshot();
    expect(assistant.description).toMatchSnapshot();
  });
  it("loads workflows", () => {
    expect(assistant.workflows?.length).toMatchSnapshot();
  });
  it("starts workflow", async () => {
    const workflowRunner = assistant.loadWorkflow("plant-find");
    workflowRunner.on("step-finished", (prompt: string, data: any) => {
      console.log("step finished");
      workflowRunner.next();
    });
    workflowRunner.start({
      plant_query: "Tropical plants that grow in Athens, Greece on a pot in my balcony",
    });

    await workflowRunner.onFinish();
    expect(workflowRunner.context).toMatchSnapshot();
    expect(workflowRunner.logs).toMatchSnapshot();
  },100000);
});
