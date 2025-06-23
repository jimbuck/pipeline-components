import React from "react";
import { Pipeline, Job, Task } from "../src/azure-devops";

function CustomTask() {
	return (
		<>
			<Task displayName="PreHook" inputs={{ script: 'echo Pre-task' }} />
			<Task displayName="Main" inputs={{ script: 'echo Main task' }} />
			<Task displayName="PostHook" inputs={{ script: 'echo Post-task' }} />
		</>
	);
}

export default (
	<Pipeline>
		<Job displayName="Build" pool={{ vmImage: "ubuntu-latest" }}>
			<Task displayName="Install" inputs={{ script: "npm install" }} />
			<CustomTask />
			<Task displayName="Test" inputs={{ script: "npm test" }} />
		</Job>
	</Pipeline>
);
