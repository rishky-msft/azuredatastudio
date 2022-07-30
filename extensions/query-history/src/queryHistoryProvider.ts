/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import { EOL } from 'os';
import { QueryHistoryItem } from './queryHistoryItem';
import { removeNewLines } from './utils';
import { CAPTURE_ENABLED_CONFIG_SECTION, ITEM_SELECTED_COMMAND_ID, PERSIST_HISTORY_CONFIG_SECTION, QUERY_HISTORY_CONFIG_SECTION } from './constants';

const STORAGE_KEY = 'queryHistory.historyItems';
const DEFAULT_CAPTURE_ENABLED = true;
const DEFAULT_PERSIST_HISTORY = true;
const successIcon = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
const failedIcon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));

export class QueryHistoryProvider implements vscode.TreeDataProvider<QueryHistoryItem>, vscode.Disposable {

	private _onDidChangeTreeData: vscode.EventEmitter<QueryHistoryItem | undefined> = new vscode.EventEmitter<QueryHistoryItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<QueryHistoryItem | undefined> = this._onDidChangeTreeData.event;

	private _queryHistoryItems: QueryHistoryItem[] = [];
	private _captureEnabled: boolean = DEFAULT_CAPTURE_ENABLED;
	private _persistHistory: boolean = DEFAULT_PERSIST_HISTORY;

	private _disposables: vscode.Disposable[] = [];

	constructor(private readonly _context: vscode.ExtensionContext) {
		void this._context.secrets.get(STORAGE_KEY).then(value => {
			if (value) {
				this._queryHistoryItems = JSON.parse(value);
				this._onDidChangeTreeData.fire(undefined);
			}
		});
		this._disposables.push(azdata.queryeditor.registerQueryEventListener({
			onQueryEvent: async (type: azdata.queryeditor.QueryEventType, document: azdata.queryeditor.QueryDocument, args: azdata.ResultSetSummary | string | undefined, queryInfo?: azdata.queryeditor.QueryInfo) => {
				if (this._captureEnabled && queryInfo && type === 'queryStop') {
					const textDocuments = vscode.workspace.textDocuments;
					// We need to compare URIs, but the event Uri comes in as string so while it should be in the same format as
					// the textDocument uri.toString() we parse it into a vscode.Uri first to be absolutely sure.
					const textDocument = textDocuments.find(e => e.uri.toString() === vscode.Uri.parse(document.uri).toString());
					if (!textDocument) {
						// If we couldn't find the document then we can't get the text so just log the error and move on
						console.error(`Couldn't find text document with URI ${document.uri} for query event`);
						return;
					}
					// Combine all the text from the batches back together
					const queryText = queryInfo.batchRanges.map(r => textDocument.getText(r) ?? '').join(EOL);
					const connectionProfile = await azdata.connection.getConnection(document.uri);
					const isSuccess = queryInfo.messages.find(m => m.isError) ? false : true;
					// Add to the front of the list so the new item appears at the top
					this._queryHistoryItems.unshift({ queryText, connectionProfile, timestamp: new Date(), isSuccess });
					await this.storeHistory();
					this._onDidChangeTreeData.fire(undefined);
				}
			}
		}));
		void this.updateConfigurationValues();
		this._disposables.push(vscode.workspace.onDidChangeConfiguration(async e => {
			if (e.affectsConfiguration(QUERY_HISTORY_CONFIG_SECTION)) {
				await this.updateConfigurationValues();
			}
		}));
	}

	public async clearAll(): Promise<void> {
		this._queryHistoryItems = [];
		await this.storeHistory();
		this._onDidChangeTreeData.fire(undefined);
	}

	public async deleteItem(item: QueryHistoryItem): Promise<void> {
		this._queryHistoryItems = this._queryHistoryItems.filter(n => n !== item);
		await this.storeHistory();
		this._onDidChangeTreeData.fire(undefined);
	}

	public getTreeItem(item: QueryHistoryItem): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(removeNewLines(item.queryText), vscode.TreeItemCollapsibleState.None);
		treeItem.iconPath = item.isSuccess ? successIcon : failedIcon;
		treeItem.tooltip = item.queryText;
		treeItem.description = item.connectionProfile ? `${item.connectionProfile.serverName}|${item.connectionProfile.databaseName} ${item.timestamp.toLocaleString()}` : item.timestamp.toLocaleString();
		treeItem.command = { title: '', command: ITEM_SELECTED_COMMAND_ID, arguments: [item] };
		return treeItem;
	}

	public getChildren(element?: QueryHistoryItem): QueryHistoryItem[] {
		// We only have top level items
		return this._queryHistoryItems;
	}

	public dispose(): void {
		this._disposables.forEach(d => d.dispose());
	}

	private async updateConfigurationValues(): Promise<void> {
		const configSection = vscode.workspace.getConfiguration(QUERY_HISTORY_CONFIG_SECTION);
		this._captureEnabled = configSection.get(CAPTURE_ENABLED_CONFIG_SECTION, DEFAULT_CAPTURE_ENABLED);
		this._persistHistory = configSection.get(PERSIST_HISTORY_CONFIG_SECTION, DEFAULT_PERSIST_HISTORY);
		if (!this._persistHistory) {
			// If we're no longer persisting the history then clean out our storage secret
			await this._context.secrets.delete(STORAGE_KEY);
		} else {
			await this.storeHistory();
		}
	}

	/**
	 * Set whether query history capture is currently enabled
	 * @param enabled Whether capture is currently enabled
	 * @returns A promise that resolves when the value is updated and persisted to configuration
	 */
	public async setCaptureEnabled(enabled: boolean): Promise<void> {
		this._captureEnabled = enabled;
		return vscode.workspace.getConfiguration(QUERY_HISTORY_CONFIG_SECTION).update(CAPTURE_ENABLED_CONFIG_SECTION, this._captureEnabled, vscode.ConfigurationTarget.Global);
	}

	private async storeHistory(): Promise<void> {
		if (this._persistHistory) {
			// Secret storage is used because the user text could have sensitive values in it in addition to us storing
			// the connection profile which may have a password set
			return this._context.secrets.store(STORAGE_KEY, JSON.stringify(this._queryHistoryItems));
		}
	}
}
