// Mock for next/server — used by vitest.config.ts alias
// Provides NextResponse and NextRequest compatible with native Response/Request

class MockNextResponse extends Response {
  static json(data: unknown, init: ResponseInit = {}) {
    const body = JSON.stringify(data)
    return new Response(body, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ? Object.fromEntries(new Headers(init.headers as any)) : {}),
      },
    })
  }

  static redirect(url: string, status = 307) {
    return new Response(null, { status, headers: { Location: url } })
  }

  static next() {
    return new Response(null, { status: 200 })
  }
}

export { MockNextResponse as NextResponse }
export { Request as NextRequest }
