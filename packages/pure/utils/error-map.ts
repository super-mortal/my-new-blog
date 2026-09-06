/**
 * Simple wrapper around Zod safeParse that throws an AstroError on failure.
 * Uses `any` types to avoid coupling to Zod's internal type system (the project
 * pins no zod version, so we want this to keep working across versions).
 */

import { AstroError } from 'astro/errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWithFriendlyErrors(schema: any, input: any, message: string): any {
  return processParsedData(schema.safeParse(input, { error: simpleErrorMap }), message)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseAsyncWithFriendlyErrors(schema: any, input: any, message: string): Promise<any> {
  return processParsedData(await schema.safeParseAsync(input, { error: simpleErrorMap }), message)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processParsedData(parsedData: any, message: string): any {
  if (!parsedData.success) {
    throw new AstroError(
      message,
      parsedData.error.issues.map((i: { message: string }) => i.message).join('\n')
    )
  }
  return parsedData.data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function simpleErrorMap(issue: any, ctx: any): { message: string } {
  const path = (issue.path ?? []).join('.')
  const prefix = path ? `**${path}**: ` : ''
  const msg = issue.message || ctx.defaultError
  return { message: prefix + msg }
}