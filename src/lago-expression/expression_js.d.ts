/* tslint:disable */
/* eslint-disable */
export function start(): void;
/**
 * @param {string} expression
 * @returns {Expression}
 */
export function parseExpression(expression: string): Expression;
/**
 * @param {Expression} expression
 * @param {string} code
 * @param {number} timestamp
 * @param {any} js_properties
 * @returns {any}
 */
export function evaluateExpression(expression: Expression, code: string, timestamp: number, js_properties: any): any;
export class Expression {
  free(): void;
}
