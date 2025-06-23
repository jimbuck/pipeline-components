"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const azure_devops_1 = require("../src/azure-devops");
function CustomTask() {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(azure_devops_1.Task, { displayName: "PreHook", inputs: { script: 'echo Pre-task' } }), (0, jsx_runtime_1.jsx)(azure_devops_1.Task, { displayName: "Main", inputs: { script: 'echo Main task' } }), (0, jsx_runtime_1.jsx)(azure_devops_1.Task, { displayName: "PostHook", inputs: { script: 'echo Post-task' } })] }));
}
exports.default = ((0, jsx_runtime_1.jsx)(azure_devops_1.Pipeline, { children: (0, jsx_runtime_1.jsxs)(azure_devops_1.Job, { displayName: "Build", pool: { vmImage: "ubuntu-latest" }, children: [(0, jsx_runtime_1.jsx)(azure_devops_1.Task, { displayName: "Install", inputs: { script: "npm install" } }), (0, jsx_runtime_1.jsx)(CustomTask, {}), (0, jsx_runtime_1.jsx)(azure_devops_1.Task, { displayName: "Test", inputs: { script: "npm test" } })] }) }));
