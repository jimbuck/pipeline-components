import { describe, it, expect } from "vitest";
import { load as yamlLoad } from 'js-yaml';

import { renderPipeline } from "./renderer.js";
import { Workflow, Job, Step, Run } from "./github-actions/index.js";

describe("GitHub Actions Workflow Renderer", () => {
	describe("Basic Workflow Structure", () => {
		it("renders an empty workflow with no children", () => {
			const yamlString = renderPipeline(
				<Workflow name="CI" on={{ push: { branches: ['main'] } }} />
			);
			expect(yamlString).toBeNull();
		});

		it("renders a simple workflow with a single job", () => {
			const yamlString = renderPipeline(
				<Workflow name="CI" on={{ push: { branches: ['main'] } }}>
					<Job id="build" name="Build" runsOn="ubuntu-latest">
						<Step name="Checkout" uses="actions/checkout@v4" />
						<Step name="Install" run="npm install" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;

			expect(parsed.name).toBe("CI");
			expect(parsed.on.push.branches).toEqual(["main"]);
			expect(parsed.jobs).toHaveProperty("build");
			expect(parsed.jobs.build.name).toBe("Build");
			expect(parsed.jobs.build["runs-on"]).toBe("ubuntu-latest");
			expect(parsed.jobs.build.steps).toHaveLength(2);
			expect(parsed.jobs.build.steps[0]).toEqual({
				name: "Checkout",
				uses: "actions/checkout@v4"
			});
			expect(parsed.jobs.build.steps[1]).toEqual({
				name: "Install",
				run: "npm install"
			});
		});

		it("renders multiple jobs with dependencies", () => {
			const yamlString = renderPipeline(
				<Workflow name="CI/CD" on={{ push: { branches: ['main'] } }}>
					<Job id="test" name="Test" runsOn="ubuntu-latest">
						<Step name="Run tests" run="npm test" />
					</Job>
					<Job id="build" name="Build" runsOn="ubuntu-latest" needs="test">
						<Step name="Build app" run="npm run build" />
					</Job>
					<Job id="deploy" name="Deploy" runsOn="ubuntu-latest" needs={["test", "build"]}>
						<Step name="Deploy app" run="npm run deploy" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;

			expect(parsed.jobs).toHaveProperty("test");
			expect(parsed.jobs).toHaveProperty("build");
			expect(parsed.jobs).toHaveProperty("deploy");
			expect(parsed.jobs.build.needs).toBe("test");
			expect(parsed.jobs.deploy.needs).toEqual(["test", "build"]);
		});
	});

	describe("Workflow Configuration", () => {
		it("renders workflow with complex triggers", () => {
			const yamlString = renderPipeline(
				<Workflow
					name="Complex CI"
					on={{
						push: {
							branches: ['main', 'develop'],
							branchesIgnore: ['feature/*'],
							paths: ['src/**'],
							pathsIgnore: ['docs/**']
						},
						pullRequest: {
							types: ['opened', 'synchronize'],
							branches: ['main']
						},
						schedule: [{ cron: '0 2 * * 1' }],
						workflowDispatch: {
							inputs: {
								environment: {
									description: 'Environment to deploy to',
									required: true,
									default: 'staging',
									type: 'choice',
									options: ['staging', 'production']
								}
							}
						}
					}}
				>
					<Job id="test" name="Test" runsOn="ubuntu-latest">
						<Step name="Test step" run="echo test" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;

			expect(parsed.on.push.branches).toEqual(['main', 'develop']);
			expect(parsed.on.push['branches-ignore']).toEqual(['feature/*']);
			expect(parsed.on.push.paths).toEqual(['src/**']);
			expect(parsed.on.push['paths-ignore']).toEqual(['docs/**']);
			expect(parsed.on.pull_request.types).toEqual(['opened', 'synchronize']);
			expect(parsed.on.schedule).toEqual([{ cron: '0 2 * * 1' }]);
			expect(parsed.on.workflow_dispatch.inputs.environment.type).toBe('choice');
		});

		it("renders workflow with permissions and environment variables", () => {
			const yamlString = renderPipeline(
				<Workflow
					name="Secure CI"
					on={{ push: { branches: ['main'] } }}
					permissions={{ contents: 'read', packages: 'write' }}
					env={{ NODE_ENV: 'production', DEBUG: 'false' }}
					concurrency={{ group: 'ci-${{ github.ref }}', cancelInProgress: true }}
				>
					<Job id="secure-job" name="Secure Job" runsOn="ubuntu-latest">
						<Step name="Secure step" run="echo secure" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;

			expect(parsed.permissions).toEqual({ contents: 'read', packages: 'write' });
			expect(parsed.env).toEqual({ NODE_ENV: 'production', DEBUG: 'false' });
			expect(parsed.concurrency).toEqual({
				group: 'ci-${{ github.ref }}',
				'cancel-in-progress': true
			});
		});

		it("renders workflow with defaults", () => {
			const yamlString = renderPipeline(
				<Workflow
					name="Default Shell"
					on={{ push: { branches: ['main'] } }}
					defaults={{
						run: {
							shell: 'bash',
							workingDirectory: './app'
						}
					}}
				>
					<Job id="test" name="Test" runsOn="ubuntu-latest">
						<Step name="Test with defaults" run="echo test" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;

			expect(parsed.defaults.run.shell).toBe('bash');
			expect(parsed.defaults.run['working-directory']).toBe('./app');
		});
	});

	describe("Job Configuration", () => {
		it("renders job with strategy matrix", () => {
			const yamlString = renderPipeline(
				<Workflow name="Matrix Build" on={{ push: { branches: ['main'] } }}>
					<Job
						id="matrix-job"
						name="Matrix Job"
						runsOn="ubuntu-latest"
						strategy={{
							matrix: {
								'node-version': ['16', '18', '20'],
								os: ['ubuntu-latest', 'windows-latest']
							},
							failFast: false,
							maxParallel: 3
						}}
					>
						<Step name="Test with Node ${{ matrix.node-version }}" run="npm test" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;

			expect(parsed.jobs['matrix-job'].strategy.matrix['node-version']).toEqual(['16', '18', '20']);
			expect(parsed.jobs['matrix-job'].strategy.matrix.os).toEqual(['ubuntu-latest', 'windows-latest']);
			expect(parsed.jobs['matrix-job'].strategy['fail-fast']).toBe(false);
			expect(parsed.jobs['matrix-job'].strategy['max-parallel']).toBe(3);
		});

		it("renders job with container configuration", () => {
			const yamlString = renderPipeline(
				<Workflow name="Container Job" on={{ push: { branches: ['main'] } }}>
					<Job
						id="container-job"
						name="Container Job"
						runsOn="ubuntu-latest"
						container={{
							image: 'node:18',
							credentials: {
								username: '${{ secrets.DOCKER_USERNAME }}',
								password: '${{ secrets.DOCKER_PASSWORD }}'
							},
							env: { NODE_ENV: 'test' },
							ports: [3000, 8080],
							volumes: ['/var/run/docker.sock:/var/run/docker.sock'],
							options: '--cpus 1'
						}}
					>
						<Step name="Run in container" run="node --version" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const container = parsed.jobs['container-job'].container;

			expect(container.image).toBe('node:18');
			expect(container.credentials.username).toBe('${{ secrets.DOCKER_USERNAME }}');
			expect(container.env.NODE_ENV).toBe('test');
			expect(container.ports).toEqual([3000, 8080]);
			expect(container.volumes).toEqual(['/var/run/docker.sock:/var/run/docker.sock']);
			expect(container.options).toBe('--cpus 1');
		});

		it("renders job with services", () => {
			const yamlString = renderPipeline(
				<Workflow name="Service Job" on={{ push: { branches: ['main'] } }}>
					<Job
						id="service-job"
						name="Service Job"
						runsOn="ubuntu-latest"
						services={{
							postgres: {
								image: 'postgres:13',
								env: {
									POSTGRES_PASSWORD: 'postgres'
								},
								ports: [5432],
								options: '--health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5'
							}
						}}
					>
						<Step name="Test with PostgreSQL" run="npm test" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const postgres = parsed.jobs['service-job'].services.postgres;

			expect(postgres.image).toBe('postgres:13');
			expect(postgres.env.POSTGRES_PASSWORD).toBe('postgres');
			expect(postgres.ports).toEqual([5432]);
			expect(postgres.options).toBe('--health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5');
		});

		it("renders job with all properties", () => {
			const yamlString = renderPipeline(
				<Workflow name="Complete Job" on={{ push: { branches: ['main'] } }}>
					<Job
						id="complete-job"
						name="Complete Job Test"
						runsOn="ubuntu-latest"
						needs="previous-job"
						if="success()"
						permissions={{ contents: 'read' }}
						env={{ JOB_ENV: 'test' }}
						continueOnError={true}
						timeoutMinutes={60}
					>
						<Step name="Complete step" run="echo complete" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const job = parsed.jobs['complete-job'];

			expect(job.name).toBe('Complete Job Test');
			expect(job['runs-on']).toBe('ubuntu-latest');
			expect(job.needs).toBe('previous-job');
			expect(job.if).toBe('success()');
			expect(job.permissions).toEqual({ contents: 'read' });
			expect(job.env).toEqual({ JOB_ENV: 'test' });
			expect(job['continue-on-error']).toBe(true);
			expect(job['timeout-minutes']).toBe(60);
		});
	});

	describe("Step Configuration", () => {
		it("renders steps with marketplace actions", () => {
			const yamlString = renderPipeline(
				<Workflow name="Action Steps" on={{ push: { branches: ['main'] } }}>
					<Job id="action-job" name="Action Job" runsOn="ubuntu-latest">
						<Step
							name="Checkout repository"
							uses="actions/checkout@v4"
							with={{
								'fetch-depth': 0,
								token: '${{ secrets.GITHUB_TOKEN }}'
							}}
						/>
						<Step
							name="Setup Node.js"
							uses="actions/setup-node@v4"
							with={{
								'node-version': '18',
								'cache': 'npm'
							}}
						/>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const steps = parsed.jobs['action-job'].steps;

			expect(steps[0]).toEqual({
				name: "Checkout repository",
				uses: "actions/checkout@v4",
				with: {
					'fetch-depth': 0,
					token: '${{ secrets.GITHUB_TOKEN }}'
				}
			});
			expect(steps[1]).toEqual({
				name: "Setup Node.js",
				uses: "actions/setup-node@v4",
				with: {
					'node-version': '18',
					'cache': 'npm'
				}
			});
		});

		it("renders steps with run commands", () => {
			const yamlString = renderPipeline(
				<Workflow name="Run Steps" on={{ push: { branches: ['main'] } }}>
					<Job id="run-job" name="Run Job" runsOn="ubuntu-latest">
						<Step
							name="Install dependencies"
							run="npm ci"
							workingDirectory="./frontend"
							env={{ NODE_ENV: 'production' }}
						/>
						<Step
							name="Run tests with bash"
							run="npm test"
							shell="bash"
						/>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const steps = parsed.jobs['run-job'].steps;

			expect(steps[0]).toEqual({
				name: "Install dependencies",
				run: "npm ci",
				'working-directory': "./frontend",
				env: { NODE_ENV: 'production' }
			});
			expect(steps[1]).toEqual({
				name: "Run tests with bash",
				run: "npm test",
				shell: "bash"
			});
		});

		it("renders steps with all properties", () => {
			const yamlString = renderPipeline(
				<Workflow name="Complete Steps" on={{ push: { branches: ['main'] } }}>
					<Job id="complete-step-job" name="Complete Step Job" runsOn="ubuntu-latest">
						<Step
							name="Complete step with action"
							id="complete-action"
							if="success()"
							uses="actions/upload-artifact@v4"
							with={{
								name: 'build-artifacts',
								path: './dist'
							}}
							env={{ UPLOAD_DEBUG: 'true' }}
							continueOnError={true}
							timeoutMinutes={5}
						/>
						<Step
							name="Complete step with run"
							id="complete-run"
							if="always()"
							run="echo 'cleanup'"
							workingDirectory="./scripts"
							shell="pwsh"
							env={{ CLEANUP_MODE: 'full' }}
							continueOnError={false}
							timeoutMinutes={2}
						/>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const steps = parsed.jobs['complete-step-job'].steps;

			expect(steps[0]).toEqual({
				name: "Complete step with action",
				id: "complete-action",
				if: "success()",
				uses: "actions/upload-artifact@v4",
				with: {
					name: 'build-artifacts',
					path: './dist'
				},
				env: { UPLOAD_DEBUG: 'true' },
				'continue-on-error': true,
				'timeout-minutes': 5
			});

			expect(steps[1]).toEqual({
				name: "Complete step with run",
				id: "complete-run",
				if: "always()",
				run: "echo 'cleanup'",
				'working-directory': "./scripts",
				shell: "pwsh",
				env: { CLEANUP_MODE: 'full' },
				'continue-on-error': false,
				'timeout-minutes': 2
			});
		});
	});

	describe("Script Components", () => {
		it("renders Run components with correct content", () => {
			const yamlString = renderPipeline(
				<Workflow name="Run Scripts" on={{ push: { branches: ['main'] } }}>
					<Job id="run-scripts" name="Run Scripts" runsOn="ubuntu-latest">
						<Run name="Simple run">echo "Hello World"</Run>
						<Run name="Multi-line run">{`
              echo "Starting process"
              npm install
              npm test
              echo "Process complete"
            `}</Run>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const steps = parsed.jobs['run-scripts'].steps;

			expect(steps[0]).toEqual({
				name: "Simple run",
				run: "echo \"Hello World\""
			});

			expect(steps[1]).toEqual({
				name: "Multi-line run",
				run: "echo \"Starting process\"\nnpm install\nnpm test\necho \"Process complete\""
			});
		});

		it("renders PowerShell components with correct shell", () => {
			const yamlString = renderPipeline(
				<Workflow name="PowerShell Scripts" on={{ push: { branches: ['main'] } }}>
					<Job id="powershell-scripts" name="PowerShell Scripts" runsOn="windows-latest">
						<Run name="PowerShell Core Script" shell="pwsh" env={{ DEBUG: "true" }}>{`
							Write-Output "Hello from PowerShell Core"
							Get-Date
						`}
						</Run>
						<Run name="Multi-line PowerShell">{`
              Write-Host "Starting PowerShell script"
              $env:PATH
              Write-Host "PowerShell script complete"
            `}</Run>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const steps = parsed.jobs['powershell-scripts'].steps;

			expect(steps[0]).toEqual({
				name: "PowerShell Core Script",
				run: "Write-Output \"Hello from PowerShell Core\"\nGet-Date",
				shell: "pwsh",
				env: { DEBUG: "true" }
			});

			expect(steps[1]).toEqual({
				name: "Multi-line PowerShell",
				run: "Write-Host \"Starting PowerShell script\"\n$env:PATH\nWrite-Host \"PowerShell script complete\"",
				shell: "pwsh"
			});
		});

		it("renders Bash components with correct shell", () => {
			const yamlString = renderPipeline(
				<Workflow name="Bash Scripts" on={{ push: { branches: ['main'] } }}>
					<Job id="bash-scripts" name="Bash Scripts" runsOn="ubuntu-latest">
						<Run name="Bash Script" shell="bash" continueOnError={true}>{`
              echo "Hello from Bash"
              ls -la
              whoami
            `}</Run>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const step = parsed.jobs['bash-scripts'].steps[0];

			expect(step).toEqual({
				name: "Bash Script",
				run: "echo \"Hello from Bash\"\nls -la\nwhoami",
				shell: "bash",
				'continue-on-error': true
			});
		});

		it("renders Cmd components with correct shell", () => {
			const yamlString = renderPipeline(
				<Workflow name="CMD Scripts" on={{ push: { branches: ['main'] } }}>
					<Job id="cmd-scripts" name="CMD Scripts" runsOn="windows-latest">
						<Run name="Command Prompt Script" shell="cmd">{`
              echo Starting process
              dir /b
              echo Process complete
            `}</Run>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const step = parsed.jobs['cmd-scripts'].steps[0];

			expect(step.name).toBe("Command Prompt Script");
			expect(step.run).toBe("echo Starting process\ndir /b\necho Process complete");
			expect(step.shell).toBe("cmd");
		});
	});

	describe("Custom Components and Composition", () => {
		it("handles custom components with step injection", () => {
			function TestSuite({ name, children }: React.PropsWithChildren<{ name: string }>) {
				return (
					<>
						<Step name={`Start ${name}`} run={`echo "Starting ${name}"`} />
						{children}
						<Step name={`Finish ${name}`} run={`echo "Finished ${name}"`} />
					</>
				);
			}

			const yamlString = renderPipeline(
				<Workflow name="Custom Components" on={{ push: { branches: ['main'] } }}>
					<Job id="test-job" name="Test Job" runsOn="ubuntu-latest">
						<TestSuite name="Unit Tests">
							<Step name="Install dependencies" run="npm ci" />
							<Step name="Run tests" run="npm test" />
						</TestSuite>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const steps = parsed.jobs['test-job'].steps;

			expect(steps).toHaveLength(4);
			expect(steps[0].name).toBe("Start Unit Tests");
			expect(steps[1].name).toBe("Install dependencies");
			expect(steps[2].name).toBe("Run tests");
			expect(steps[3].name).toBe("Finish Unit Tests");
		});

		it("handles React fragments correctly", () => {
			const yamlString = renderPipeline(
				<Workflow name="Fragment Test" on={{ push: { branches: ['main'] } }}>
					<Job id="fragment-job" name="Fragment Job" runsOn="ubuntu-latest">
						<>
							<Step name="First step" run="echo first" />
							<Step name="Second step" run="echo second" />
						</>
						<Step name="Third step" run="echo third" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const steps = parsed.jobs['fragment-job'].steps;

			expect(steps).toHaveLength(3);
			expect(steps.map((s: any) => s.name)).toEqual([
				"First step",
				"Second step",
				"Third step"
			]);
		});

		it("handles conditional rendering", () => {
			const includeExtraStep = true;

			const yamlString = renderPipeline(
				<Workflow name="Conditional Test" on={{ push: { branches: ['main'] } }}>
					<Job id="conditional-job" name="Conditional Job" runsOn="ubuntu-latest">
						<Step name="Always included" run="echo always" />
						{includeExtraStep && <Step name="Conditionally included" run="echo conditional" />}
						<Step name="Also always included" run="echo also always" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const steps = parsed.jobs['conditional-job'].steps;

			expect(steps).toHaveLength(3);
			expect(steps[1].name).toBe("Conditionally included");
		});
	});

	describe("Workflow Validation", () => {
		it("validates step mutual exclusivity (uses vs run)", () => {
			expect(() => {
				renderPipeline(
					<Workflow name="Invalid Step" on={{ push: { branches: ['main'] } }}>
						<Job id="invalid-job" name="Invalid Job" runsOn="ubuntu-latest">
							<Step name="Invalid step" uses="actions/checkout@v4" run="npm install" />
						</Job>
					</Workflow>
				);
			}).toThrow('Step cannot have both "uses" and "run" properties');
		});

		it("validates step has either uses or run", () => {
			expect(() => {
				renderPipeline(
					<Workflow name="Missing Step Props" on={{ push: { branches: ['main'] } }}>
						<Job id="missing-props-job" name="Missing Props Job" runsOn="ubuntu-latest">
							<Step name="Invalid step" uses={null as unknown as string} />
						</Job>
					</Workflow>
				);
			}).toThrow('Step must have either "uses" or "run" property');
		});

		it("validates required job properties", () => {
			const yamlString = renderPipeline(
				<Workflow name="Required Props" on={{ push: { branches: ['main'] } }}>
					<Job id="required-job" name="Required Job" runsOn="ubuntu-latest">
						<Step name="Valid step" run="echo test" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const job = parsed.jobs['required-job'];

			// Verify all required properties are present
			expect(job.name).toBeDefined();
			expect(job['runs-on']).toBeDefined();
			expect(job.steps).toBeDefined();
			expect(job.steps.length).toBeGreaterThan(0);
		});

		it("preserves parameter types in YAML output", () => {
			const yamlString = renderPipeline(
				<Workflow name="Type Preservation" on={{ push: { branches: ['main'] } }}>
					<Job id="type-job" name="Type Job" runsOn="ubuntu-latest">
						<Step
							name="Type test step"
							uses="actions/setup-node@v4"
							with={{
								'node-version': 18,
								'cache': 'npm',
								'check-latest': true
							}}
							continueOnError={false}
							timeoutMinutes={10}
						/>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;
			const step = parsed.jobs['type-job'].steps[0];

			// Verify types are preserved
			expect(typeof step.with['node-version']).toBe("number");
			expect(typeof step.with['check-latest']).toBe("boolean");
			expect(typeof step['continue-on-error']).toBe("boolean");
			expect(typeof step['timeout-minutes']).toBe("number");
		});
	});

	describe("YAML Format Conversion", () => {
		it("converts camelCase to kebab-case correctly", () => {
			const yamlString = renderPipeline(
				<Workflow
					name="Case Conversion"
					runName="Custom run name"
					on={{
						push: { branchesIgnore: ['feature/*'] },
						pullRequest: { pathsIgnore: ['docs/**'] },
						workflowDispatch: {}
					}}
				>
					<Job
						id="case-job"
						name="Case Job"
						runsOn="ubuntu-latest"
						continueOnError={true}
						timeoutMinutes={30}
					>
						<Step
							name="Case step"
							run="echo test"
							workingDirectory="./test"
							continueOnError={false}
							timeoutMinutes={5}
						/>
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;

			// Workflow level
			expect(parsed['run-name']).toBe("Custom run name");
			expect(parsed.on.push['branches-ignore']).toEqual(['feature/*']);
			expect(parsed.on.pull_request['paths-ignore']).toEqual(['docs/**']);
			expect(parsed.on.workflow_dispatch).toEqual({});

			// Job level
			expect(parsed.jobs['case-job']['runs-on']).toBe("ubuntu-latest");
			expect(parsed.jobs['case-job']['continue-on-error']).toBe(true);
			expect(parsed.jobs['case-job']['timeout-minutes']).toBe(30);

			// Step level
			const step = parsed.jobs['case-job'].steps[0];
			expect(step['working-directory']).toBe("./test");
			expect(step['continue-on-error']).toBe(false);
			expect(step['timeout-minutes']).toBe(5);
		});
	});

	describe("Edge Cases", () => {
		it("handles empty arrays and objects correctly", () => {
			const yamlString = renderPipeline(
				<Workflow
					name="Empty Values"
					on={{ push: { branches: ['main'] } }}
					env={{}}
				>
					<Job id="empty-job" name="Empty Job" runsOn="ubuntu-latest" env={{}}>
						<Step name="Empty step" run="echo test" env={{}} />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;

			expect(parsed.env).toEqual({});
			expect(parsed.jobs['empty-job'].env).toEqual({});
			expect(parsed.jobs['empty-job'].steps[0].env).toEqual({});
		});

		it("handles undefined optional properties", () => {
			const yamlString = renderPipeline(
				<Workflow name="Undefined Props" on={{ push: { branches: ['main'] } }}>
					<Job id="undefined-job" runsOn="ubuntu-latest">
						<Step run="echo test" />
					</Job>
				</Workflow>
			);

			const parsed = yamlLoad(yamlString!) as any;

			// Undefined properties should not appear in YAML
			expect(parsed.jobs['undefined-job']).not.toHaveProperty('name');
			expect(parsed.jobs['undefined-job'].steps[0]).not.toHaveProperty('name');
			expect(parsed).not.toHaveProperty('env');
		});
	});
});
