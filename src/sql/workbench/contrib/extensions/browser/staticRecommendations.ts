/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionRecommendations, ExtensionRecommendation } from 'vs/workbench/contrib/extensions/browser/extensionRecommendations';
import { ExtensionRecommendationReason } from 'vs/workbench/services/extensionRecommendations/common/extensionRecommendations';
import { IProductService } from 'vs/platform/product/common/productService';
import { localize } from 'vs/nls';


export class StaticRecommendations extends ExtensionRecommendations {

	readonly _recommendations: ExtensionRecommendation[] = [];
	get recommendations(): ReadonlyArray<ExtensionRecommendation> { return this._recommendations; }

	constructor(
		@IProductService productService: IProductService,
	) {
		super();

		this._recommendations = productService.recommendedExtensions.map(r => ({ extensionId: r, reason: { reasonId: ExtensionRecommendationReason.Application, reasonText: localize('defaultRecommendations', "This extension is recommended by Azure Data Studio.") }, source: 'application' }));
	}

	protected async doActivate(): Promise<void> {
		return;
	}
}
