import { onError, ORPCError } from '@orpc/client'
import { RPCHandler } from '@orpc/server/fetch'

import { router } from '@/lib/router'

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error, { request }) => {
      console.error(
        '[rpc-error]',
        JSON.stringify({
          aborted: request.signal?.aborted ?? false,
          code: error instanceof ORPCError ? error.code : 'UNKNOWN',
          message: error instanceof Error ? error.message : String(error),
        }),
      )
    }),
  ],
})

export async function POST(request: Request) {
  if (request.signal.aborted) {
    console.error(
      '[rpc-entry]',
      JSON.stringify({
        aborted: request.signal.aborted,
        hasBody: request.body !== null,
        contentLength: request.headers.get('content-length'),
      }),
    )
    if (process.env.REPRO_ABORT_GUARD === '1') {
      return new Response(null, { status: 499 })
    }
  }

  const { response } = await handler.handle(request, { prefix: '/rpc', context: {} })
  return response ?? new Response('Not found', { status: 404 })
}
