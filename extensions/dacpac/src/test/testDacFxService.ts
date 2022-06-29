/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as mssql from 'mssql';

export const deployOperationId = 'deploy dacpac';
export const extractOperationId = 'extract dacpac';
export const exportOperationId = 'export bacpac';
export const importOperationId = 'import bacpac';
export const generateScript = 'generate script';
export const generateDeployPlan = 'generate deploy plan';
export const validateStreamingJob = 'validate streaming job';

export class DacFxTestService implements mssql.IDacFxService {
	dacfxResult: mssql.DacFxResult = {
		success: true,
		operationId: 'test',
		errorMessage: ''
	};
	constructor() {
	}

	exportBacpac(databaseName: string, packageFilePath: string, ownerUri: string, taskExecutionMode: azdata.TaskExecutionMode): Promise<mssql.DacFxResult> {
		this.dacfxResult.operationId = exportOperationId;
		return Promise.resolve(this.dacfxResult);
	}
	importBacpac(packageFilePath: string, databaseName: string, ownerUri: string, taskExecutionMode: azdata.TaskExecutionMode): Promise<mssql.DacFxResult> {
		this.dacfxResult.operationId = importOperationId;
		return Promise.resolve(this.dacfxResult);
	}
	extractDacpac(databaseName: string, packageFilePath: string, applicationName: string, applicationVersion: string, ownerUri: string, taskExecutionMode: azdata.TaskExecutionMode): Promise<mssql.DacFxResult> {
		this.dacfxResult.operationId = extractOperationId;
		return Promise.resolve(this.dacfxResult);
	}
	createProjectFromDatabase(databaseName: string, targetFilePath: string, applicationName: string, applicationVersion: string, ownerUri: string, extractTarget: mssql.ExtractTarget, taskExecutionMode: azdata.TaskExecutionMode): Promise<mssql.DacFxResult> {
		this.dacfxResult.operationId = importOperationId;
		return Promise.resolve(this.dacfxResult);
	}
	deployDacpac(packageFilePath: string, databaseName: string, upgradeExisting: boolean, ownerUri: string, taskExecutionMode: azdata.TaskExecutionMode, sqlCommandVariableValues?: Record<string, string>): Promise<mssql.DacFxResult> {
		this.dacfxResult.operationId = deployOperationId;
		return Promise.resolve(this.dacfxResult);
	}
	generateDeployScript(packageFilePath: string, databaseName: string, ownerUri: string, taskExecutionMode: azdata.TaskExecutionMode, sqlCommandVariableValues?: Record<string, string>): Promise<mssql.DacFxResult> {
		this.dacfxResult.operationId = generateScript;
		return Promise.resolve(this.dacfxResult);
	}
	generateDeployPlan(packageFilePath: string, databaseName: string, ownerUri: string, taskExecutionMode: azdata.TaskExecutionMode): Promise<mssql.GenerateDeployPlanResult> {
		this.dacfxResult.operationId = generateDeployPlan;
		const deployPlan: mssql.GenerateDeployPlanResult = {
			operationId: generateDeployPlan,
			success: true,
			errorMessage: '',
			report: generateDeployPlan
		};
		return Promise.resolve(deployPlan);
	}
	getOptionsFromProfile(profilePath: string): Promise<mssql.DacFxOptionsResult> {
		const sampleDesc = 'Sample Description text';
		const sampleName = 'Sample Property Name';
		const optionsResult: mssql.DacFxOptionsResult = {
			success: true,
			errorMessage: '',
			deploymentOptions: {
				doNotDropObjectTypes: { value: [], description: sampleDesc, propertyName: sampleName },
				excludeObjectTypes: { value: [], description: sampleDesc, propertyName: sampleName },
				optionsMapTable: {
					'Sample Display Name Option1': { value: false, description: sampleDesc, propertyName: sampleName },
					'Sample Display Name Option2': { value: false, description: sampleDesc, propertyName: sampleName }
				},
				includeObjects: {
					'Sample Include Object Type1': 0,
					'Sample Include Object Type2': 2
				}
			}
		};

		return Promise.resolve(optionsResult);
	}
	validateStreamingJob(packageFilePath: string, createStreamingJobTsql: string): Promise<mssql.ValidateStreamingJobResult> {
		this.dacfxResult.operationId = validateStreamingJob;
		const streamingJobValidationResult: mssql.ValidateStreamingJobResult = {
			success: true,
			errorMessage: ''
		};
		return Promise.resolve(streamingJobValidationResult);
	}
}
