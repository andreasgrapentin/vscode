/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Color } from '../common/color.js';
import { FileAccess } from '../common/network.js';
import { URI } from '../common/uri.js';

export type CssFragment = string & { readonly __cssFragment: unique symbol };

function asFragment(raw: string): CssFragment {
	return raw as CssFragment;
}

export function asCssValueWithDefault(cssPropertyValue: string | undefined, dflt: string): string {
	if (cssPropertyValue !== undefined) {
		const variableMatch = cssPropertyValue.match(/^\s*var\((.+)\)$/);
		if (variableMatch) {
			const varArguments = variableMatch[1].split(',', 2);
			if (varArguments.length === 2) {
				dflt = asCssValueWithDefault(varArguments[1].trim(), dflt);
			}
			return `var(${varArguments[0]}, ${dflt})`;
		}
		return cssPropertyValue;
	}
	return dflt;
}

export function value(value: string): CssFragment {
	const out = value.replaceAll(/[^_\-a-z0-9]/gi, '');
	if (out !== value) {
		console.warn(`CSS value ${value} modified to ${out} to be safe for CSS`);
	}
	return asFragment(out);
}

export function stringValue(value: string): CssFragment {
	return asFragment(`'${value.replaceAll(/'/g, '\\000027')}'`);
}

/**
 * returns url('...')
 */
export function asCSSUrl(uri: URI | null | undefined): CssFragment {
	if (!uri) {
		return asFragment(`url('')`);
	}
	return inline`url(${stringValue(FileAccess.uriToBrowserUri(uri).toString(true))})`;
}

export function className(value: string): CssFragment {
	const out = CSS.escape(value);
	if (out !== value) {
		console.warn(`CSS class name ${value} modified to ${out} to be safe for CSS`);
	}
	return asFragment(out);
}

type InlineCssTemplateValue = CssFragment | Color;

/**
 * Template string tag that that constructs a CSS fragment.
 *
 * All expressions in the template must be css safe values.
 */
export function inline(strings: TemplateStringsArray, ...values: InlineCssTemplateValue[]): CssFragment {
	return asFragment(strings.reduce((result, str, i) => {
		const value = values[i] || '';
		return result + str + value;
	}, ''));
}


export class Builder {
	private readonly _parts: CssFragment[] = [];

	push(...parts: CssFragment[]): void {
		this._parts.push(...parts);
	}

	join(joiner = '\n'): CssFragment {
		return asFragment(this._parts.join(joiner));
	}
}
