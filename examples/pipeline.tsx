import React, { PropsWithChildren } from "react";
import { Pipeline, Job, Powershell, Pwsh, Bash } from "../src/azure-devops";

function Measure({ suffix, children }: PropsWithChildren<{ suffix: string }>) {
	return (
		<>
			<Pwsh displayName={`Start Timer ${suffix}`}>start {suffix}</Pwsh>
			{children}
			<Pwsh displayName={`Stop Timer ${suffix}`}>stop {suffix}</Pwsh>
		</>
	);
}
export default function () {
	return (
		<Pipeline trigger={{ branches: { include: ["main"] } }}>
			<Job job="Build" displayName="Build" pool={{ vmImage: "ubuntu-latest" }}>
				<Measure suffix="install-and-build">
					<Powershell displayName="Install" >npm install</Powershell>
					<Bash displayName="Test">npm test</Bash>
				</Measure>
		</Job>
	</Pipeline>
	);
}