import { describe, it, expect } from "vitest";
import { renderPipeline } from "./renderer";
import { Pipeline, Job, Stage, Step } from "./azure-devops";

// Basic test for pipeline rendering

describe("renderPipeline", () => {
  it("renders a simple pipeline to YAML", () => {
    const yaml = renderPipeline(
      <Pipeline trigger={{ branches: { include: ["main"] } }}>
        <Step task="CmdLine" displayName="Install" inputs={{ script: "npm install" }} />
        <Step task="CmdLine" displayName="Install" inputs={{ script: "npm install" }} />
      </Pipeline>
    );
    expect(yaml).toContain("steps:");
    expect(yaml).toContain("task: CmdLine");
    expect(yaml).toContain("script: npm install");
  });

  it("renders a pipeline with a single job", () => {
    const yaml = renderPipeline(
      <Pipeline trigger="none">
        <Job job="Build" displayName="Build">
          <Step task="CmdLine" displayName="Build step" inputs={{ script: "echo build" }} />
        </Job>
      </Pipeline>
    );
    expect(yaml).toContain("jobs:");
    expect(yaml).toContain("job: Build");
    expect(yaml).toContain("task: CmdLine");
    expect(yaml).toContain("echo build");
  });

  it("renders a pipeline with a single stage and job", () => {
    const yaml = renderPipeline(
      <Pipeline trigger="none">
        <Stage stage="BuildStage" displayName="Build Stage">
          <Job job="Build" displayName="Build">
            <Step task="CmdLine" displayName="Build step" inputs={{ script: "echo build" }} />
          </Job>
        </Stage>
      </Pipeline>
    );
    expect(yaml).toContain("stages:");
    expect(yaml).toContain("stage: BuildStage");
    expect(yaml).toContain("jobs:");
    expect(yaml).toContain("job: Build");
    expect(yaml).toContain("task: CmdLine");
    expect(yaml).toContain("echo build");
  });

  it("renders a pipeline with variables and pool", () => {
    const yaml = renderPipeline(
      <Pipeline trigger="none" variables={[{ name: "foo", value: "bar" }]} pool={{ name: "Default" }}>
        <Job job="Build" displayName="Build" pool={{ vmImage: "ubuntu-latest" }}>
          <Step task="CmdLine" displayName="Build step" inputs={{ script: "echo build" }} />
        </Job>
      </Pipeline>
    );
    expect(yaml).toContain("variables:");
    expect(yaml).toContain("name: foo");
    expect(yaml).toContain("value: bar");
    expect(yaml).toContain("pool:");
    expect(yaml).toContain("vmImage: ubuntu-latest");
  });

  it("renders a pipeline with multiple jobs and steps", () => {
    const yaml = renderPipeline(
      <Pipeline trigger="none">
        <Job job="Build" displayName="Build">
          <Step task="CmdLine" displayName="Install" inputs={{ script: "npm install" }} />
          <Step task="CmdLine" displayName="Build" inputs={{ script: "npm run build" }} />
        </Job>
        <Job job="Test" displayName="Test">
          <Step task="CmdLine" displayName="Test" inputs={{ script: "npm test" }} />
        </Job>
      </Pipeline>
    );
    expect(yaml).toContain("jobs:");
    expect(yaml).toContain("job: Build");
    expect(yaml).toContain("job: Test");
    expect(yaml).toContain("displayName: Install");
    expect(yaml).toContain("displayName: Build");
    expect(yaml).toContain("displayName: Test");
  });

  it("renders a pipeline with conditions, dependsOn, and continueOnError", () => {
    const yaml = renderPipeline(
      <Pipeline trigger="none">
        <Stage stage="BuildStage" displayName="Build Stage" dependsOn="PreviousStage" condition="succeeded()">
          <Job job="Build" displayName="Build" continueOnError={true} condition="always()">
            <Step task="CmdLine" displayName="Build step" continueOnError={true} condition="failed()" inputs={{ script: "echo build" }} />
          </Job>
        </Stage>
      </Pipeline>
    );
    expect(yaml).toContain("dependsOn: PreviousStage");
    expect(yaml).toContain("condition: succeeded()");
    expect(yaml).toContain("continueOnError: true");
    expect(yaml).toContain("condition: always()");
    expect(yaml).toContain("condition: failed()");
  });

  it("renders a pipeline with environment variables in a step", () => {
    const yaml = renderPipeline(
      <Pipeline trigger="none">
        <Job job="EnvJob" displayName="EnvJob">
          <Step task="CmdLine" displayName="Env step" env={{ FOO: "bar", BAZ: "qux" }} inputs={{ script: "echo $FOO $BAZ" }} />
        </Job>
      </Pipeline>
    );
    expect(yaml).toContain("env:");
    expect(yaml).toContain("FOO: bar");
    expect(yaml).toContain("BAZ: qux");
    expect(yaml).toContain("echo $FOO $BAZ");
  });

  it("renders a real-world pipeline example with custom tasks", () => {
    function CustomTask({ index }: { index: number }) {
      return (
        <>
          <Step task="CmdLine" displayName={`PreHook ${index}`} inputs={{ script: 'echo Pre-task' }} />
          <Step task="CmdLine" displayName={`Main ${index}`} inputs={{ script: 'echo Main task' }} />
          <Step task="CmdLine" displayName={`PostHook ${index}`} inputs={{ script: 'echo Post-task' }} />
        </>
      );
    }
    const yaml = renderPipeline(
      <Pipeline trigger={{ branches: { include: ["main"] } }}>
        <Job job="Build" displayName="Build" pool={{ vmImage: "ubuntu-latest" }}>
          <Step task="CmdLine" displayName="Install" inputs={{ script: "npm install" }} />
          <CustomTask index={21} />
          <Step task="CmdLine" displayName="Test" inputs={{ script: "npm test" }} />
        </Job>
      </Pipeline>
    );
    expect(yaml).toContain("job: Build");
    expect(yaml).toContain("displayName: PreHook 21");
    expect(yaml).toContain("displayName: Main 21");
    expect(yaml).toContain("displayName: PostHook 21");
    expect(yaml).toContain("displayName: Test");
    expect(yaml).toContain("vmImage: ubuntu-latest");
    expect(yaml).toContain("branches:");
    expect(yaml).toContain("include:");
    expect(yaml).toContain("main");
  });

  it("renders an empty pipeline with no children", () => {
    const yaml = renderPipeline(
      <Pipeline trigger="none" />
    );
    expect(yaml).toBeNull();
  });
});
