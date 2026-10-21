# Next.js + oRPC: cancelled requests become validation errors

A minimal Next.js App Router app initialized with `create-next-app@16.4.2`. It uses the standard oRPC Fetch handler and a typed browser client.

## Reproduce

Requires Node.js 24 or newer and pnpm 12.7.0.

```sh
pnpm install
pnpm dev
```

1. Open the local URL printed by Next.js (normally http://localhost:3000).
2. Click **Send and cancel 30 requests** before sending any other RPC requests.
3. Inspect the server terminal for:

```text
[rpc-entry] {"aborted":true,"hasBody":false,"contentLength":"24"}
[rpc-error] {"aborted":true,"code":"BAD_REQUEST","message":"Input validation failed"}
```

The browser sends valid `{ slug: 'demo' }` input through the oRPC client, then cancels requests with `AbortController` after 10, 30, 100, or 300 milliseconds. Multiple requests with staggered cancellation make the timing-dependent race easier to observe while the RPC route first loads. There are no artificial delays in the server route.

If the error does not appear, stop and restart `pnpm dev`, reload the page, and click the cancellation button first again. An aborted browser request alone does not demonstrate the issue; look for the matching server logs above.

**Send valid request** is a control: it should display a fulfilled result containing `{ slug: 'demo' }`.

## Expected and actual behavior

Already cancelled requests should be recognized as cancelled before their absent bodies are classified as invalid procedure input. Instead, Next.js can pass an already aborted request without a body to the route, and oRPC reports `BAD_REQUEST: Input validation failed`.

## Workaround comparison

Stop the server, then run:

```sh
REPRO_ABORT_GUARD=1 pnpm dev
```

Reload the page and repeat the cancellation step first. The route logs the aborted request and returns before invoking oRPC:

```ts
if (request.signal.aborted) {
  return new Response(null, { status: 499 })
}
```

The cancellation-related validation errors should disappear; **Send valid request** should still succeed. Status 499 is a local workaround choice, not a documented oRPC requirement.

## Files and versions

- `app/page.tsx`: typed oRPC client and cancellation button.
- `app/rpc/[[...rest]]/route.ts`: standard Fetch handler, diagnostic logging, and optional guard.
- `lib/router.ts`: one Zod-validated echo procedure.

Next.js `16.4.2`, oRPC `2.0.0-beta.44`, React `19.3.1`, and Zod `4.6.7` are pinned in the lockfile. No database, authentication, or external services are required.

```sh
pnpm check
pnpm build
```

References: [oRPC Next.js adapter](https://orpc.dev/docs/adapters/next), [Next.js request adapter](https://github.com/vercel/next.js/blob/canary/packages/next/src/server/web/spec-extension/adapters/next-request.ts).
