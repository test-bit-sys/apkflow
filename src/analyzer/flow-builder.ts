import { AppMetadata, DiscoveredEndpoint, FlowEdge, FlowNode, SecurityDossier } from '../types/index.js';

export class FlowBuilder {
  public static buildFlow(
    app: AppMetadata,
    security: SecurityDossier,
    endpoints: DiscoveredEndpoint[]
  ): { nodes: FlowNode[]; edges: FlowEdge[] } {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    // 1. App Entry Node
    const launchNodeId = 'node_launch';
    nodes.push({
      id: launchNodeId,
      type: 'appLaunch',
      title: 'App Initialization',
      subtitle: app.mainActivity.split('.').pop() || 'MainActivity',
      description: `Target entrypoint: ${app.mainActivity}. Initializes application context, DI containers, and telemetry.`,
      badge: 'ENTRYPOINT',
      badgeColor: '#3b82f6', // blue
      icon: 'Rocket',
      data: {
        activity: app.mainActivity,
        packageName: app.packageName,
        version: app.versionName,
        framework: app.framework.displayName,
      },
    });

    let previousNodeId = launchNodeId;

    // 2. Security & Integrity Node (if any security mechanism detected)
    const securityNodeId = 'node_security';
    if (security.rootDetection.found || security.sslPinning.found) {
      const items: string[] = [];
      if (security.rootDetection.found) items.push('Root & Magisk Detection');
      if (security.sslPinning.found) items.push('SSL Certificate Pinning');

      nodes.push({
        id: securityNodeId,
        type: 'securityGate',
        title: 'Security & Integrity Gate',
        subtitle: items.join(' + '),
        description: `Verifies runtime environment integrity before establishing secure network connections.`,
        badge: 'SECURITY',
        badgeColor: '#ef4444', // red
        icon: 'ShieldAlert',
        data: {
          rootDetection: security.rootDetection,
          sslPinning: security.sslPinning,
        },
      });

      edges.push({
        id: `e_${previousNodeId}_${securityNodeId}`,
        source: previousNodeId,
        target: securityNodeId,
        label: 'Verifies Environment',
        animated: true,
      });

      previousNodeId = securityNodeId;
    }

    // 3. Network Transport & SSL Handshake Node
    const transportNodeId = 'node_transport';
    nodes.push({
      id: transportNodeId,
      type: 'dataLayer',
      title: 'Network Transport Layer',
      subtitle: security.sslPinning.found ? 'Pinned TLS v1.3 Connection' : 'Standard TLS Connection',
      description: `Establishes encrypted HTTP/REST communication channels with backend services.`,
      badge: 'TRANSPORT',
      badgeColor: '#10b981', // green
      icon: 'Globe',
      data: {
        pinned: security.sslPinning.found,
        totalEndpoints: endpoints.length,
      },
    });

    edges.push({
      id: `e_${previousNodeId}_${transportNodeId}`,
      source: previousNodeId,
      target: transportNodeId,
      label: 'Init HTTP Client',
      animated: true,
    });
    previousNodeId = transportNodeId;

    // 4. Group endpoints by category
    const authEndpoints = endpoints.filter(e => e.category === 'auth');
    const paymentEndpoints = endpoints.filter(e => e.category === 'payment');
    const userEndpoints = endpoints.filter(e => e.category === 'user');
    const coreEndpoints = endpoints.filter(e => e.category === 'core' || e.category === 'sync');

    // 5. Auth / Session Handshake Node
    const authNodeId = 'node_auth';
    if (authEndpoints.length > 0) {
      const ep = authEndpoints[0];
      nodes.push({
        id: authNodeId,
        type: 'authStep',
        title: 'Authentication & Session Handshake',
        subtitle: `${ep.method} ${ep.path}`,
        description: `Authenticates client credentials, exchanges OTP/Password for Bearer Access & Refresh Tokens.`,
        badge: 'AUTH',
        badgeColor: '#f59e0b', // amber
        icon: 'Key',
        data: {
          endpoint: ep,
          allAuthEndpoints: authEndpoints,
        },
      });

      edges.push({
        id: `e_${previousNodeId}_${authNodeId}`,
        source: previousNodeId,
        target: authNodeId,
        label: 'Obtain Access Token',
        animated: true,
      });
      previousNodeId = authNodeId;
    }

    // 6. Crypto / Signature Pipeline Node (if app uses signing or custom encryption)
    const cryptoNodeId = 'node_crypto';
    const hasCrypto = security.cryptoPrimitives.length > 0 || app.nativeLibraries.some(l => l.isCustomCryptoOrSecurity);
    if (hasCrypto) {
      nodes.push({
        id: cryptoNodeId,
        type: 'cryptoStep',
        title: 'Request Signing & Cryptographic Pipeline',
        subtitle: security.cryptoPrimitives[0]?.algorithm || 'HMAC-SHA256 / AES',
        description: `Constructs dynamic payload signatures (Timestamp + Nonce + Body Hash) to ensure request integrity.`,
        badge: 'CRYPTO',
        badgeColor: '#8b5cf6', // purple
        icon: 'Lock',
        data: {
          primitives: security.cryptoPrimitives,
          nativeLibs: app.nativeLibraries.filter(l => l.isCustomCryptoOrSecurity),
        },
      });

      edges.push({
        id: `e_${previousNodeId}_${cryptoNodeId}`,
        source: previousNodeId,
        target: cryptoNodeId,
        label: 'Sign & Encrypt Payload',
        animated: true,
      });
      previousNodeId = cryptoNodeId;
    }

    // 7. Core Feature / Business Operations Node
    const coreNodeId = 'node_core_ops';
    const primaryEndpoints = paymentEndpoints.concat(userEndpoints, coreEndpoints);
    const topEndpoint = primaryEndpoints[0] || (endpoints.length > 0 ? endpoints[0] : null);

    if (topEndpoint) {
      nodes.push({
        id: coreNodeId,
        type: 'apiEndpoint',
        title: 'Core Business Operations',
        subtitle: `${topEndpoint.method} ${topEndpoint.path}`,
        description: `Processes transactions, account balances, and synchronized dashboard feeds.`,
        badge: 'BUSINESS API',
        badgeColor: '#06b6d4', // cyan
        icon: 'CreditCard',
        data: {
          endpoint: topEndpoint,
          totalBusinessEndpoints: primaryEndpoints.length,
        },
      });

      edges.push({
        id: `e_${previousNodeId}_${coreNodeId}`,
        source: previousNodeId,
        target: coreNodeId,
        label: 'Authorized REST Calls',
        animated: true,
      });
      previousNodeId = coreNodeId;
    }

    // 8. Local State & Cache Node
    const cacheNodeId = 'node_cache';
    nodes.push({
      id: cacheNodeId,
      type: 'dataLayer',
      title: 'Local Cache & Persistence',
      subtitle: 'EncryptedSharedPreferences & SQLite',
      description: `Persists authentication session tokens and cached UI data for offline capability.`,
      badge: 'PERSISTENCE',
      badgeColor: '#64748b', // slate
      icon: 'Database',
      data: {
        storageType: 'EncryptedSharedPreferences / Room DB',
      },
    });

    edges.push({
      id: `e_${previousNodeId}_${cacheNodeId}`,
      source: previousNodeId,
      target: cacheNodeId,
      label: 'Cache Tokens & State',
      animated: false,
    });

    return { nodes, edges };
  }
}
