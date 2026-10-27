import { DiscoveredEndpoint } from '../types/index.js';

export interface MockSimulationResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  latencyMs: number;
  mode: 'virtual-mock' | 'live-server';
  timestamp: string;
}

export class MockServer {
  /**
   * Simulates realistic backend responses for all discovered endpoints in the APK
   */
  public static async execute(
    url: string,
    method: string,
    headers: Record<string, string> = {},
    body: any = null,
    targetMode: 'virtual-mock' | 'live-server' = 'virtual-mock'
  ): Promise<MockSimulationResult> {
    const startTime = Date.now();

    if (targetMode === 'live-server') {
      try {
        const fetchHeaders: Record<string, string> = { ...headers };
        let reqBody: string | undefined = undefined;
        if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
          reqBody = typeof body === 'string' ? body : JSON.stringify(body);
          if (!fetchHeaders['Content-Type']) {
            fetchHeaders['Content-Type'] = 'application/json';
          }
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
          method: method.toUpperCase(),
          headers: fetchHeaders,
          body: reqBody,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const latencyMs = Date.now() - startTime;
        let responseData: any;
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text;
        }

        const respHeaders: Record<string, string> = {};
        response.headers.forEach((v, k) => { respHeaders[k] = v; });

        return {
          status: response.status,
          statusText: response.statusText,
          headers: respHeaders,
          data: responseData,
          latencyMs,
          mode: 'live-server',
          timestamp: new Date().toISOString(),
        };
      } catch (err: any) {
        // Fallback to mock if live request failed
        const mock = this.generateMockResponse(url, method, body);
        return {
          ...mock,
          mode: 'virtual-mock',
          latencyMs: Date.now() - startTime,
          headers: {
            ...mock.headers,
            'x-apkflow-fallback': `Live server unreachable (${err.message}). Simulated response generated.`,
          },
        };
      }
    }

    // Virtual Mock Mode
    await new Promise(r => setTimeout(r, 45)); // realistic 45ms network latency
    const mock = this.generateMockResponse(url, method, body);
    return {
      ...mock,
      latencyMs: Date.now() - startTime,
    };
  }

  private static generateMockResponse(url: string, method: string, body: any): MockSimulationResult {
    const lower = url.toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000);

    const baseHeaders = {
      'content-type': 'application/json; charset=utf-8',
      'server': 'ApkFlow Virtual Mock Gateway/2.0',
      'x-signature-status': 'VERIFIED_OK',
      'x-request-id': `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    // 1. Auth & Login
    if (lower.includes('login') || lower.includes('auth')) {
      return {
        status: 200,
        statusText: 'OK',
        headers: baseHeaders,
        data: {
          status: 'success',
          code: 200,
          data: {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTE4MjMiLCJyb2xlIjoidXNlciIsImlhdCI6MTczMDAwMDAwMCwiZXhwIjoxNzMwMDg2NDAwfQ.signature_verified',
            refreshToken: 'rf_90a8b7c6d5e4f3a2b1c0',
            tokenType: 'Bearer',
            expiresIn: 86400,
            user: {
              id: 'usr_91823',
              name: 'John Doe',
              email: 'researcher@apkflow.local',
              kycVerified: true,
              currency: 'USD',
            },
          },
        },
        latencyMs: 45,
        mode: 'virtual-mock',
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Balance & Wallet
    if (lower.includes('balance') || lower.includes('wallet')) {
      return {
        status: 200,
        statusText: 'OK',
        headers: baseHeaders,
        data: {
          status: 'success',
          code: 200,
          data: {
            accountNumber: 'ACC-4891-2094-1182',
            balance: 3420.50,
            available: 3350.00,
            pending: 70.50,
            currency: 'USD',
            lastUpdated: timestamp,
          },
        },
        latencyMs: 45,
        mode: 'virtual-mock',
        timestamp: new Date().toISOString(),
      };
    }

    // 3. Instant Transfer / Payment
    if (lower.includes('transfer') || lower.includes('pay')) {
      const amount = body?.amount || 120.00;
      return {
        status: 201,
        statusText: 'Created',
        headers: baseHeaders,
        data: {
          status: 'success',
          code: 201,
          transactionId: `TXN_${Date.now()}_PAY`,
          state: 'EXECUTED_SETTLED',
          amount: Number(amount),
          fee: 0.25,
          recipient: body?.recipient || 'ACC-8891-2309',
          timestamp,
          receiptHash: 'sha256:7f9a8b1c2d3e4f5a6b7c8d9e0f',
        },
        latencyMs: 50,
        mode: 'virtual-mock',
        timestamp: new Date().toISOString(),
      };
    }

    // 4. Virtual Cards
    if (lower.includes('card')) {
      return {
        status: 200,
        statusText: 'OK',
        headers: baseHeaders,
        data: {
          status: 'success',
          card: {
            id: 'crd_virtual_9941',
            pan: '4532 •••• •••• 9812',
            brand: 'Visa Virtual',
            expiry: '11/29',
            cvv: '•••',
            spendingLimit: 5000,
            status: 'ACTIVE',
          },
        },
        latencyMs: 45,
        mode: 'virtual-mock',
        timestamp: new Date().toISOString(),
      };
    }

    // 5. Generic Fallback Mock
    return {
      status: 200,
      statusText: 'OK',
      headers: baseHeaders,
      data: {
        status: 'success',
        code: 200,
        endpoint: url,
        method,
        timestamp,
        message: 'ApkFlow Virtual Mock Gateway: Endpoint verified and executed.',
        receivedPayload: body || null,
      },
      latencyMs: 40,
      mode: 'virtual-mock',
      timestamp: new Date().toISOString(),
    };
  }
}
