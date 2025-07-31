import React from 'react';
import { describe, it, expect } from "vitest";
import { load as yamlLoad } from 'js-yaml';

import { renderPipeline } from "./renderer.js";
import { Pipeline, Job, Stage, Step, Powershell, Bash, CmdLine, Pwsh } from "./azure-devops/index.js";

describe("Azure DevOps Pipeline Renderer", () => {
  describe("Basic Pipeline Structure", () => {
    it("renders an empty pipeline with no children", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none" />
      );
      expect(yamlString).toBeNull();
    });

    it("renders a simple step-only pipeline", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger={{ branches: { include: ["main"] } }}>
          <Step task="CmdLine@2" displayName="Install" inputs={{ script: "npm install" }} />
          <Step task="CmdLine@2" displayName="Build" inputs={{ script: "npm run build" }} />
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;

      expect(parsed.trigger.branches.include).toEqual(["main"]);
      expect(parsed.steps).toHaveLength(2);
      expect(parsed.steps[0]).toEqual({
        task: "CmdLine@2",
        displayName: "Install",
        inputs: { script: "npm install" }
      });
      expect(parsed.steps[1]).toEqual({
        task: "CmdLine@2",
        displayName: "Build",
        inputs: { script: "npm run build" }
      });
    });

    it("renders a pipeline with a single job", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Job job="Build" displayName="Build">
            <Step task="CmdLine@2" displayName="Build step" inputs={{ script: "echo build" }} />
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;

      expect(parsed.trigger).toBe("none");
      expect(parsed.jobs).toHaveLength(1);
      expect(parsed.jobs[0].job).toBe("Build");
      expect(parsed.jobs[0].displayName).toBe("Build");
      expect(parsed.jobs[0].steps).toHaveLength(1);
      expect(parsed.jobs[0].steps[0]).toEqual({
        task: "CmdLine@2",
        displayName: "Build step",
        inputs: { script: "echo build" }
      });
    });

    it("renders a pipeline with stages, jobs, and steps", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Stage stage="BuildStage" displayName="Build Stage">
            <Job job="Build" displayName="Build">
              <Step task="CmdLine@2" displayName="Build step" inputs={{ script: "echo build" }} />
            </Job>
          </Stage>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;

      expect(parsed.stages).toHaveLength(1);
      expect(parsed.stages[0]).toMatchObject({
        stage: "BuildStage",
        displayName: "Build Stage",
        jobs: [{
          job: "Build",
          displayName: "Build",
          steps: [{
            task: "CmdLine@2",
            displayName: "Build step",
            inputs: { script: "echo build" }
          }]
        }]
      });
    });

    it("renders nested stages with multiple jobs", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Stage stage="CI" displayName="Continuous Integration">
            <Job job="Build" displayName="Build Application">
              <Step task="CmdLine@2" displayName="Install" inputs={{ script: "npm install" }} />
              <Step task="CmdLine@2" displayName="Build" inputs={{ script: "npm run build" }} />
            </Job>
            <Job job="Test" displayName="Run Tests" dependsOn="Build">
              <Step task="CmdLine@2" displayName="Unit Tests" inputs={{ script: "npm test" }} />
              <Step task="CmdLine@2" displayName="E2E Tests" inputs={{ script: "npm run e2e" }} />
            </Job>
          </Stage>
          <Stage stage="CD" displayName="Continuous Deployment" dependsOn="CI">
            <Job job="Deploy" displayName="Deploy to Production">
              <Step task="CmdLine@2" displayName="Deploy" inputs={{ script: "npm run deploy" }} />
            </Job>
          </Stage>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;

      expect(parsed.stages).toHaveLength(2);

      // Verify CI stage structure
      const ciStage = parsed.stages[0];
      expect(ciStage.stage).toBe("CI");
      expect(ciStage.jobs).toHaveLength(2);
      expect(ciStage.jobs[1].dependsOn).toBe("Build");

      // Verify CD stage structure
      const cdStage = parsed.stages[1];
      expect(cdStage.stage).toBe("CD");
      expect(cdStage.dependsOn).toBe("CI");
      expect(cdStage.jobs).toHaveLength(1);
    });
  });

  describe("Pipeline Configuration", () => {
    it("renders pipeline with variables and pool configuration", () => {
      const yamlString = renderPipeline(
        <Pipeline
          trigger="none"
          variables={[{ name: "foo", value: "bar" }, { group: "shared-vars" }]}
          pool={{ name: "Default" }}
        >
          <Job job="Build" displayName="Build" pool={{ vmImage: "ubuntu-latest" }}>
            <Step task="CmdLine@2" displayName="Build step" inputs={{ script: "echo build" }} />
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;

      expect(parsed.variables).toEqual([
        { name: "foo", value: "bar" },
        { group: "shared-vars" }
      ]);
      expect(parsed.pool).toEqual({ name: "Default" });
      expect(parsed.jobs[0].pool).toEqual({ vmImage: "ubuntu-latest" });
    });

    it("renders complex trigger configurations", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger={{
          batch: true,
          branches: { include: ["main", "develop"], exclude: ["feature/*"] },
          paths: { include: ["src/*"], exclude: ["docs/*"] },
          tags: { include: ["v*"] }
        }}>
          <Step task="CmdLine@2" displayName="Test" inputs={{ script: "npm test" }} />
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;

      expect(parsed.trigger).toEqual({
        batch: true,
        branches: { include: ["main", "develop"], exclude: ["feature/*"] },
        paths: { include: ["src/*"], exclude: ["docs/*"] },
        tags: { include: ["v*"] }
      });
    });
  });

  describe("Job Dependencies and Conditions", () => {
    it("renders jobs with complex dependency arrays", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Job job="UnitTest" displayName="Unit Tests">
            <Step task="CmdLine@2" displayName="Test" inputs={{ script: "npm test" }} />
          </Job>
          <Job job="IntegrationTest" displayName="Integration Tests">
            <Step task="CmdLine@2" displayName="Test" inputs={{ script: "npm run integration" }} />
          </Job>
          <Job job="Deploy" displayName="Deploy" dependsOn={["UnitTest", "IntegrationTest"]}>
            <Step task="CmdLine@2" displayName="Deploy" inputs={{ script: "npm run deploy" }} />
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;

      expect(parsed.jobs).toHaveLength(3);
      expect(parsed.jobs[2].dependsOn).toEqual(["UnitTest", "IntegrationTest"]);
    });
  });

  describe("Step Properties and Environment", () => {
    it("renders steps with all properties", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Job job="CompleteStep" displayName="Complete Step Test">
            <Step
              task="CmdLine@2"
              displayName="Complete step"
              condition="succeeded()"
              continueOnError={true}
              env={{ NODE_ENV: "production", DEBUG: "false" }}
              inputs={{
                script: "echo 'Complete step'",
                workingDirectory: "$(System.DefaultWorkingDirectory)"
              }}
            />
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;
      const step = parsed.jobs[0].steps[0];

      expect(step).toEqual({
        task: "CmdLine@2",
        displayName: "Complete step",
        condition: "succeeded()",
        continueOnError: true,
        env: { NODE_ENV: "production", DEBUG: "false" },
        inputs: {
          script: "echo 'Complete step'",
          workingDirectory: "$(System.DefaultWorkingDirectory)"
        }
      });
    });

    it("correctly excludes disabled steps", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Job job="FilteredSteps" displayName="Filtered Steps">
            <Step task="CmdLine@2" displayName="Enabled" inputs={{ script: "echo enabled" }} />
            <Step task="CmdLine@2" displayName="Disabled" enabled={false} inputs={{ script: "echo disabled" }} />
            <Step task="CmdLine@2" displayName="Also Enabled" inputs={{ script: "echo also enabled" }} />
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;
      const steps = parsed.jobs[0].steps;

      expect(steps).toHaveLength(2);
      expect(steps.map((s: any) => s.displayName)).toEqual(["Enabled", "Also Enabled"]);
    });
  });

  describe("Script Components", () => {
    it("renders PowerShell components with correct task", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Job job="PowerShell" displayName="PowerShell Test">
            <Powershell displayName="PS Script" condition="succeeded()">{`
              Write-Host "Hello from PowerShell"
              Get-Date
            `}
            </Powershell>
            <Pwsh displayName="PS Core Script" env={{ DEBUG: "true" }}>
              Write-Output "Hello from PowerShell Core"
            </Pwsh>
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;
      const steps = parsed.jobs[0].steps;

      expect(steps[0]).toEqual({
        task: "Powershell@2",
        displayName: "PS Script",
        condition: "succeeded()",
        inputs: {
          script: "Write-Host \"Hello from PowerShell\"\nGet-Date"
        }
      });

      expect(steps[1]).toEqual({
        task: "Powershell@2",
        displayName: "PS Core Script",
        env: { DEBUG: "true" },
        inputs: {
          script: "Write-Output \"Hello from PowerShell Core\""
        }
      });
    });

    it("renders Bash components with correct task", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Job job="Bash" displayName="Bash Test">
            <Bash displayName="Bash Script" continueOnError={true}>{`
              echo "Hello from Bash"
              ls -la
            `}
            </Bash>
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;
      const step = parsed.jobs[0].steps[0];

      expect(step).toEqual({
        task: "ShellScript@2",
        displayName: "Bash Script",
        continueOnError: true,
        inputs: {
          script: "echo \"Hello from Bash\"\nls -la"
        }
      });
    });

    it("renders CmdLine components with multiline scripts", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Job job="CmdLine" displayName="Command Line Test">
            <CmdLine displayName="Multi-line Command">{`
              echo Starting process
              dir /b
              echo Process complete
            `}
            </CmdLine>
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;
      const step = parsed.jobs[0].steps[0];

      expect(step.task).toBe("CmdLine@2");
      expect(step.inputs.script).toBe("echo Starting process\ndir /b\necho Process complete");
    });
  });

  describe("Pipeline Validation", () => {
    it("validates required job properties", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Job job="TestJob" displayName="Test Job" pool={{ vmImage: "ubuntu-latest" }}>
            <Step task="CmdLine@2" displayName="Required Step" inputs={{ script: "echo test" }} />
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;
      const job = parsed.jobs[0];

      // Verify all required properties are present
      expect(job.job).toBeDefined();
      expect(job.displayName).toBeDefined();
      expect(job.steps).toBeDefined();
      expect(job.steps.length).toBeGreaterThan(0);
    });

    it("handles empty variable arrays correctly", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none" variables={[]}>
          <Step task="CmdLine@2" displayName="Test" inputs={{ script: "echo test" }} />
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;

      expect(parsed.variables).toEqual([]);
    });

    it("preserves parameter types in YAML output", () => {
      const yamlString = renderPipeline(
        <Pipeline trigger="none">
          <Job job="TypeTest" displayName="Type Preservation">
            <Step
              task="CmdLine@2"
              displayName="Number and Boolean Test"
              continueOnError={false}
              inputs={{
                script: "echo test",
                failOnStderr: true
              }}
            />
          </Job>
        </Pipeline>
      );

      const parsed = yamlLoad(yamlString!) as any;
      const step = parsed.jobs[0].steps[0];

      // Verify types are preserved
      expect(typeof step.continueOnError).toBe("boolean");
      expect(typeof step.inputs.failOnStderr).toBe("boolean");
    });
  });
});
