'use client'

import type { RouterClient } from '@orpc/server'

import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { useState } from 'react'

import type { router } from '@/lib/router'

const client: RouterClient<typeof router> = createORPCClient(new RPCLink({ url: '/rpc' }))

export default function Home() {
  const [result, setResult] = useState('Choose an action, then inspect the server terminal.')

  async function sendRequests(cancel: boolean) {
    setResult('Sending requests...')
    const results = await Promise.allSettled(
      Array.from({ length: cancel ? 30 : 1 }, (_, index) => {
        const controller = new AbortController()
        const promise = client.echo({ slug: 'demo' }, { signal: controller.signal })
        // Stagger cancellation so requests can reach the server while the route first loads.
        if (cancel) setTimeout(() => controller.abort(), [10, 30, 100, 300][index % 4])
        return promise
      }),
    )
    setResult(
      JSON.stringify(
        results.map((result) =>
          result.status === 'fulfilled'
            ? { status: result.status, value: result.value }
            : {
                status: result.status,
                reason:
                  result.reason instanceof Error
                    ? `${result.reason.name}: ${result.reason.message}`
                    : String(result.reason),
              },
        ),
        null,
        2,
      ),
    )
  }

  return (
    <main>
      <h1>oRPC aborted request reproduction</h1>
      <p>This page calls a real oRPC route on this Next.js App Router server.</p>
      <button onClick={() => void sendRequests(true)}>Send and cancel 30 requests</button>
      <button onClick={() => void sendRequests(false)}>Send valid request</button>
      <p>
        Cancelled requests may log <code>[rpc-error]</code> with <code>Input validation failed</code> in the server
        terminal. Click the cancellation button first after starting the server. Restart the server and try again if
        needed.
      </p>
      <pre aria-live='polite'>{result}</pre>
    </main>
  )
}
