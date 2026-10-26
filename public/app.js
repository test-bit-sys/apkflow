// ApkFlow n8n-Style Workflow Canvas & Reverse-Engineering Engine
let currentAnalysis = null;
let currentSdkLang = 'typescript';

// Canvas Transform State (Pan & Zoom)
let panX = 40;
let panY = 40;
let scale = 1.0;
let isPanning = false;
let startX = 0;
let startY = 0;

// DOM Elements
const canvasContainer = document.getElementById('canvasContainer');
const canvasWorld = document.getElementById('canvasWorld');
const connectionsSvg = document.getElementById('connectionsSvg');
const nodesLayer = document.getElementById('nodesLayer');

const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnResetView = document.getElementById('btnResetView');

const headerAppName = document.getElementById('headerAppName');
const headerAppPkg = document.getElementById('headerAppPkg');
const headerAppFramework = document.getElementById('headerAppFramework');

const inspectorDrawer = document.getElementById('inspectorDrawer');
const drawerIcon = document.getElementById('drawerIcon');
const drawerTitle = document.getElementById('drawerTitle');
const drawerSubtitle = document.getElementById('drawerSubtitle');
const drawerDescription = document.getElementById('drawerDescription');
const drawerMetrics = document.getElementById('drawerMetrics');
const drawerEndpointContent = document.getElementById('drawerEndpointContent');
const drawerStepCode = document.getElementById('drawerStepCode');
const drawerSecurityContent = document.getElementById('drawerSecurityContent');
const btnCloseDrawer = document.getElementById('btnCloseDrawer');
const btnCopyStepCode = document.getElementById('btnCopyStepCode');

const dockBtns = document.querySelectorAll('.dock-btn');
const dockEndpointCount = document.getElementById('dockEndpointCount');

const modalCode = document.getElementById('modal-code');
const modalEndpoints = document.getElementById('modal-endpoints');
const modalSecurity = document.getElementById('modal-security');
const modalBlueprint = document.getElementById('modal-blueprint');

const fullSdkCode = document.getElementById('fullSdkCode');
const fullSdkLabel = document.getElementById('fullSdkLabel');
const btnCopyFullSdk = document.getElementById('btnCopyFullSdk');

const modalEndpointBody = document.getElementById('modalEndpointBody');
const modalEndpointSearch = document.getElementById('modalEndpointSearch');

const auditRootBadge = document.getElementById('auditRootBadge');
const auditRootList = document.getElementById('auditRootList');
const auditRootBypass = document.getElementById('auditRootBypass');
const auditSslBadge = document.getElementById('auditSslBadge');
const auditSslList = document.getElementById('auditSslList');
const auditSslBypass = document.getElementById('auditSslBypass');
const auditCryptoList = document.getElementById('auditCryptoList');

const blueprintPlainEnglish = document.getElementById('blueprintPlainEnglish');
const blueprintStepsList = document.getElementById('blueprintStepsList');

const btnQuickPayDemo = document.getElementById('btnQuickPayDemo');
const btnBaridiDemo = document.getElementById('btnBaridiDemo');
const apkFileInput = document.getElementById('apkFileInput');
const toastNotice = document.getElementById('toastNotice');
const toastMessage = document.getElementById('toastMessage');

// Icons (SVG)
const SVG_ICONS = {
  Rocket: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path></svg>`,
  ShieldAlert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  Globe: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  Key: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 2-2 2m-1.5 1.5L14 9l-3 3-2-2-5 5 2 2 3-3 2 2 4.5-4.5"></path><circle cx="7.5" cy="15.5" r="5.5"></circle></svg>`,
  Lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  CreditCard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  Database: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
};

// 1. Initialize
async function init() {
  setupCanvasPanZoom();
  setupDrawer();
  setupModals();
  setupUploadAndDemos();

  // Load default QuickPay Sample Demo
  loadQuickPaySample();
}

// 2. Load QuickPay Sample or BaridiMob Demo
async function loadQuickPaySample() {
  showToast('Loading QuickPay Sample APK analysis...');
  try {
    // Check if we can fetch sample apk analysis or fallback to baridi demo
    const res = await fetch('/api/download-sample-apk');
    if (res.ok) {
      const blob = await res.blob();
      const file = new File([blob], 'QuickPay-Sample.apk', { type: 'application/vnd.android.package-archive' });
      await uploadApk(file);
    } else {
      loadBaridiDemo();
    }
  } catch {
    loadBaridiDemo();
  }
}

async function loadBaridiDemo() {
  try {
    const res = await fetch('/api/demos/demo_fintech_baridi');
    if (res.ok) {
      const data = await res.json();
      renderAnalysis(data);
      showToast('Loaded BaridiMob Fintech Demo!');
    }
  } catch (err) {
    console.error('Failed to load demo:', err);
  }
}

// 3. Render Analysis into n8n Canvas
function renderAnalysis(data) {
  currentAnalysis = data;

  // Header meta
  headerAppName.textContent = data.app.name;
  headerAppPkg.textContent = data.app.packageName;
  headerAppFramework.textContent = data.app.framework.displayName;
  dockEndpointCount.textContent = data.endpoints.length;

  // Render Canvas Nodes & Cables
  renderNodesAndConnections(data.flow.nodes);

  // Render Modals Data
  renderFullSdk(data.recipe.codeSnippets);
  renderModalEndpoints(data.endpoints);
  renderSecurityAudit(data.security);
  renderBlueprint(data.recipe);

  // Reset view to fit
  resetCanvasView();
}

// 4. Render n8n Node Cards & Bezier Connections
function renderNodesAndConnections(nodes) {
  nodesLayer.innerHTML = '';
  connectionsSvg.innerHTML = '';

  const nodePositions = [];
  const startXPos = 80;
  const spacingX = 360;
  const startYPos = 160;

  nodes.forEach((node, i) => {
    // Slightly stagger Y coordinates for high-tech flow look
    const yOffset = (i % 2 === 1) ? 60 : 0;
    const posX = startXPos + (i * spacingX);
    const posY = startYPos + yOffset;
    nodePositions.push({ x: posX, y: posY, width: 280, height: 180 });

    const card = document.createElement('div');
    card.className = 'n8n-node';
    card.id = `node-${node.id}`;
    card.style.left = `${posX}px`;
    card.style.top = `${posY}px`;

    const iconSvg = SVG_ICONS[node.icon] || SVG_ICONS.Rocket;

    card.innerHTML = `
      ${i > 0 ? `<div class="port-pin port-input" style="border-color: ${node.badgeColor};"></div>` : ''}
      <div class="node-top-row">
        <div class="node-icon" style="background: ${node.badgeColor}22; color: ${node.badgeColor}; border: 1px solid ${node.badgeColor}55;">
          ${iconSvg}
        </div>
        <span class="node-badge" style="background: ${node.badgeColor}22; color: ${node.badgeColor}; border: 1px solid ${node.badgeColor}55;">
          ${node.badge}
        </span>
      </div>
      <h4 class="node-title">${node.title}</h4>
      <p class="node-subtitle">${node.subtitle}</p>
      <p class="node-summary">${node.description}</p>
      <div class="node-footer">
        <span>Step ${i + 1} of ${nodes.length}</span>
        <span style="color: ${node.badgeColor}; font-weight: 600;">Inspect ➔</span>
      </div>
      ${i < nodes.length - 1 ? `<div class="port-pin port-output" style="border-color: ${node.badgeColor};"></div>` : ''}
    `;

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.n8n-node').forEach(n => n.classList.remove('selected'));
      card.classList.add('selected');
      openInspectorDrawer(node, i + 1);
    });

    nodesLayer.appendChild(card);
  });

  // Render Curved SVG Bezier Cables
  let svgPaths = '';
  for (let i = 0; i < nodePositions.length - 1; i++) {
    const from = nodePositions[i];
    const to = nodePositions[i + 1];

    const x1 = from.x + from.width;
    const y1 = from.y + 90; // center height
    const x2 = to.x;
    const y2 = to.y + 90;

    const controlX = (x1 + x2) / 2;
    // Cubic bezier path: M x1 y1 C controlX y1, controlX y2, x2 y2
    const d = `M ${x1} ${y1} C ${controlX} ${y1}, ${controlX} ${y2}, ${x2} ${y2}`;
    svgPaths += `
      <path d="${d}" class="conn-path" />
      <circle r="4" fill="#06b6d4" opacity="0.8">
        <animateMotion path="${d}" dur="4s" repeatCount="indefinite" />
      </circle>
    `;
  }
  connectionsSvg.innerHTML = svgPaths;
}

// 5. Node Inspector Drawer (Slide-out Settings)
function openInspectorDrawer(node, stepIndex) {
  inspectorDrawer.classList.add('open');

  drawerIcon.innerHTML = SVG_ICONS[node.icon] || SVG_ICONS.Rocket;
  drawerIcon.style.color = node.badgeColor;
  drawerTitle.textContent = `${stepIndex}. ${node.title}`;
  drawerSubtitle.textContent = node.subtitle;
  drawerDescription.textContent = node.description;

  // Overview Tab Metrics
  let metricsHtml = `
    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.85rem; font-size: 0.85rem;">
      <div style="color: var(--text-muted); margin-bottom: 0.25rem;">Node Category:</div>
      <strong style="color: ${node.badgeColor}; font-family: var(--font-mono);">${node.badge} (${node.type})</strong>
    </div>
  `;

  if (node.data) {
    Object.entries(node.data).forEach(([k, v]) => {
      if (typeof v === 'string' || typeof v === 'number') {
        metricsHtml += `
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.85rem; font-size: 0.85rem;">
            <div style="color: var(--text-muted); margin-bottom: 0.25rem;">${k}:</div>
            <code style="color: var(--accent-cyan); font-family: var(--font-mono);">${v}</code>
          </div>
        `;
      }
    });
  }
  drawerMetrics.innerHTML = metricsHtml;

  // Endpoints Tab
  const relevantEndpoint = currentAnalysis.endpoints.find(e => 
    (node.type === 'authStep' && e.category === 'auth') ||
    (node.type === 'apiEndpoint' && (e.category === 'payment' || e.category === 'user' || e.category === 'core'))
  ) || currentAnalysis.endpoints[0];

  if (relevantEndpoint) {
    drawerEndpointContent.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <span class="node-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">${relevantEndpoint.method}</span>
        <code style="color: #fff; font-family: var(--font-mono); margin-left: 0.5rem; font-size: 0.88rem;">${relevantEndpoint.path}</code>
        <div style="color: var(--text-muted); font-size: 0.82rem; margin-top: 0.5rem;">Domain: ${relevantEndpoint.domain}</div>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">Headers Contract:</div>
      <pre style="background: #06080e; padding: 0.85rem; border-radius: 8px; font-family: var(--font-mono); font-size: 0.8rem; overflow-x: auto; color: #a5b4fc;"><code>${JSON.stringify(relevantEndpoint.headers, null, 2)}</code></pre>
      ${relevantEndpoint.samplePayload ? `
        <div style="font-size: 0.82rem; color: var(--text-muted); margin: 0.75rem 0 0.4rem 0;">Sample Payload:</div>
        <pre style="background: #06080e; padding: 0.85rem; border-radius: 8px; font-family: var(--font-mono); font-size: 0.8rem; overflow-x: auto; color: #6ee7b7;"><code>${JSON.stringify(relevantEndpoint.samplePayload, null, 2)}</code></pre>
      ` : ''}
    `;
  } else {
    drawerEndpointContent.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No direct external HTTP endpoint attached to this internal client component.</p>`;
  }

  // Step Code Tab
  drawerStepCode.textContent = generateStepSnippet(node, relevantEndpoint);

  // Security & Bypass Tab
  drawerSecurityContent.innerHTML = generateStepBypass(node);
}

// Generate focused code snippet for single step
function generateStepSnippet(node, ep) {
  if (node.type === 'authStep') {
    return `// 🔑 Step: Authenticate & Acquire JWT
const res = await fetch('${ep ? ep.url : 'https://api.example.com/auth/login'}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': '${currentAnalysis.app.versionName}',
    'X-Timestamp': Date.now().toString(),
    'X-Signature': computeHmacSignature(payload, secretKey)
  },
  body: JSON.stringify({ username: 'user_01', pin: '1234' })
});
const data = await res.json();
console.log('Access Token:', data.accessToken);`;
  }
  if (node.type === 'cryptoStep') {
    return `// ⚡ Step: Calculate JNI Signature
import crypto from 'node:crypto';

function computeHmacSignature(payload: string, secretKey: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return crypto.createHmac('sha256', secretKey)
    .update(\`\${timestamp}:\${payload}\`)
    .digest('hex');
}`;
  }
  if (node.type === 'apiEndpoint') {
    return `// 🚀 Step: Execute Business Operation
const res = await fetch('${ep ? ep.url : 'https://api.example.com/v2/wallet/balance'}', {
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'User-Agent': 'ApkFlow-Agent/1.0'
  }
});
const result = await res.json();
console.log('Result:', result);`;
  }
  return `// Step: ${node.title} (${node.subtitle})
// Initializes runtime component context.
console.log('Executing step: ${node.title}');`;
}

// Generate Frida bypass script for single step
function generateStepBypass(node) {
  if (node.type === 'securityGate') {
    return `
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 0.85rem; margin-bottom: 1rem;">
        <strong style="color: #f87171; font-size: 0.88rem;">Frida Hook: Bypass RootBeer & File Checks</strong>
      </div>
      <pre style="background: #06080e; padding: 0.85rem; border-radius: 8px; font-family: var(--font-mono); font-size: 0.78rem; overflow-x: auto; color: #fca5a5;"><code>Java.perform(function () {
  var RootBeer = Java.use("com.scottyab.rootbeer.RootBeer");
  RootBeer.isRooted.implementation = function () {
    console.log("[ApkFlow] Bypassing RootBeer.isRooted()");
    return false;
  };
  RootBeer.isRootedWithoutBusyBoxCheck.implementation = function () {
    return false;
  };
});</code></pre>
    `;
  }
  if (node.type === 'dataLayer' && node.subtitle.includes('TLS')) {
    return `
      <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px; padding: 0.85rem; margin-bottom: 1rem;">
        <strong style="color: #818cf8; font-size: 0.88rem;">Frida Hook: Disable OkHttp3 Certificate Pinning</strong>
      </div>
      <pre style="background: #06080e; padding: 0.85rem; border-radius: 8px; font-family: var(--font-mono); font-size: 0.78rem; overflow-x: auto; color: #a5b4fc;"><code>Java.perform(function () {
  var CertificatePinner = Java.use("okhttp3.CertificatePinner");
  CertificatePinner.check.overload("java.lang.String", "java.util.List").implementation = function (host, certs) {
    console.log("[ApkFlow] Bypassed SSL Pinning for: " + host);
    return;
  };
});</code></pre>
    `;
  }
  return `<p style="color: var(--text-muted); font-size: 0.85rem;">Standard execution flow. No aggressive anti-tampering bypass required on this step.</p>`;
}

// 6. Canvas Pan & Zoom Logic (n8n Style)
function setupCanvasPanZoom() {
  canvasContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('.n8n-node')) return;
    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateCanvasTransform();
  });

  window.addEventListener('mouseup', () => {
    isPanning = false;
  });

  // Mouse wheel zoom
  canvasContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    scale = Math.min(Math.max(scale * zoomFactor, 0.4), 2.0);
    btnResetView.textContent = `${Math.round(scale * 100)}%`;
    updateCanvasTransform();
  }, { passive: false });

  btnZoomIn.addEventListener('click', () => {
    scale = Math.min(scale * 1.15, 2.0);
    btnResetView.textContent = `${Math.round(scale * 100)}%`;
    updateCanvasTransform();
  });

  btnZoomOut.addEventListener('click', () => {
    scale = Math.max(scale * 0.85, 0.4);
    btnResetView.textContent = `${Math.round(scale * 100)}%`;
    updateCanvasTransform();
  });

  btnResetView.addEventListener('click', () => {
    resetCanvasView();
  });

  // Clicking canvas closes drawer
  canvasContainer.addEventListener('click', (e) => {
    if (!e.target.closest('.n8n-node') && !e.target.closest('.inspector-drawer')) {
      inspectorDrawer.classList.remove('open');
      document.querySelectorAll('.n8n-node').forEach(n => n.classList.remove('selected'));
    }
  });
}

function resetCanvasView() {
  panX = 60;
  panY = 60;
  scale = 1.0;
  btnResetView.textContent = '100%';
  updateCanvasTransform();
}

function updateCanvasTransform() {
  canvasWorld.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

// 7. Drawer Tabs
function setupDrawer() {
  const drawerTabBtns = document.querySelectorAll('.drawer-tab-btn');
  drawerTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      drawerTabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.drawer-pane').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(btn.dataset.drawerTab).style.display = 'block';
    });
  });

  btnCloseDrawer.addEventListener('click', () => {
    inspectorDrawer.classList.remove('open');
    document.querySelectorAll('.n8n-node').forEach(n => n.classList.remove('selected'));
  });

  btnCopyStepCode.addEventListener('click', () => {
    navigator.clipboard.writeText(drawerStepCode.textContent);
    showToast('Step code copied to clipboard!');
  });
}

// 8. Modals & Floating Dock Switchers
function setupModals() {
  dockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dockBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.full-modal').forEach(m => m.classList.remove('show'));

      btn.classList.add('active');
      const targetView = btn.dataset.view;

      if (targetView !== 'canvas') {
        const modal = document.getElementById(targetView);
        if (modal) modal.classList.add('show');
      }
    });
  });

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.full-modal').forEach(m => m.classList.remove('show'));
      dockBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-view="canvas"]').classList.add('active');
    });
  });

  // SDK Language Switcher
  const sdkLangBtns = document.querySelectorAll('[data-sdk-lang]');
  sdkLangBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sdkLangBtns.forEach(b => {
        b.className = 'btn btn-secondary';
      });
      btn.className = 'btn btn-primary';
      currentSdkLang = btn.dataset.sdkLang;
      if (currentAnalysis) renderFullSdk(currentAnalysis.recipe.codeSnippets);
    });
  });

  btnCopyFullSdk.addEventListener('click', () => {
    navigator.clipboard.writeText(fullSdkCode.textContent);
    showToast('Full SDK copied to clipboard!');
  });

  modalEndpointSearch.addEventListener('input', () => {
    if (currentAnalysis) renderModalEndpoints(currentAnalysis.endpoints);
  });
}

// Render Full SDK in Modal
function renderFullSdk(snippets) {
  const code = snippets[currentSdkLang] || snippets.typescript;
  fullSdkCode.textContent = code;

  if (currentSdkLang === 'typescript') {
    fullSdkLabel.textContent = 'TypeScript Client SDK (fetch / node:crypto)';
  } else if (currentSdkLang === 'python') {
    fullSdkLabel.textContent = 'Python Client Script (requests / hmac)';
  } else {
    fullSdkLabel.textContent = 'cURL Terminal Command';
  }
}

// Render Endpoints in Modal Table
function renderModalEndpoints(endpoints) {
  const q = modalEndpointSearch.value.toLowerCase().trim();
  const filtered = endpoints.filter(ep => 
    ep.path.toLowerCase().includes(q) ||
    ep.method.toLowerCase().includes(q) ||
    ep.domain.toLowerCase().includes(q)
  );

  modalEndpointBody.innerHTML = filtered.map(ep => `
    <tr style="border-bottom: 1px solid var(--border-subtle);">
      <td style="padding: 0.85rem 1rem;"><span class="node-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">${ep.method}</span></td>
      <td style="padding: 0.85rem 1rem; font-family: var(--font-mono); color: #fff;">${ep.path}</td>
      <td style="padding: 0.85rem 1rem; color: var(--text-muted);">${ep.domain}</td>
      <td style="padding: 0.85rem 1rem;"><span class="node-badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">${ep.authType}</span></td>
      <td style="padding: 0.85rem 1rem;">${ep.requiresSignature ? `<span class="node-badge" style="background: rgba(139, 92, 246, 0.2); color: #c084fc;">HMAC-SHA256</span>` : `<span style="color: var(--text-muted);">None</span>`}</td>
      <td style="padding: 0.85rem 1rem;">
        <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="copyText('${ep.url}')">Copy URL</button>
      </td>
    </tr>
  `).join('');
}

window.copyText = function(text) {
  navigator.clipboard.writeText(text);
  showToast(`Copied ${text}`);
};

// Render Security in Modal
function renderSecurityAudit(sec) {
  if (sec.rootDetection.found) {
    auditRootBadge.textContent = 'ACTIVE DEFENSE';
    auditRootBadge.style.background = 'rgba(239, 68, 68, 0.2)';
    auditRootBadge.style.color = '#f87171';
    auditRootList.innerHTML = sec.rootDetection.indicators.map(i => `<li>${i}</li>`).join('');
    auditRootBypass.textContent = sec.rootDetection.bypassTip;
  } else {
    auditRootBadge.textContent = 'NOT DETECTED';
    auditRootBadge.style.background = 'rgba(16, 185, 129, 0.2)';
    auditRootBadge.style.color = '#34d399';
    auditRootList.innerHTML = `<li>No explicit root verification detected.</li>`;
  }

  if (sec.sslPinning.found) {
    auditSslBadge.textContent = 'ENFORCED';
    auditSslBadge.style.background = 'rgba(239, 68, 68, 0.2)';
    auditSslBadge.style.color = '#f87171';
    auditSslList.innerHTML = sec.sslPinning.indicators.map(i => `<li>${i}</li>`).join('');
    auditSslBypass.textContent = sec.sslPinning.bypassTip;
  } else {
    auditSslBadge.textContent = 'STANDARD TLS';
    auditSslBadge.style.background = 'rgba(16, 185, 129, 0.2)';
    auditSslBadge.style.color = '#34d399';
    auditSslList.innerHTML = `<li>Standard CA certificate validation.</li>`;
  }

  auditCryptoList.innerHTML = sec.cryptoPrimitives.map(c => `
    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.85rem; margin-bottom: 0.75rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
        <strong style="color: var(--accent-blue); font-family: var(--font-mono); font-size: 0.88rem;">${c.algorithm}</strong>
        <span class="node-badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Cryptographic Primitive</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem;">${c.description}</p>
      <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
        References: ${c.locations.join(' • ')}
      </div>
    </div>
  `).join('');
}

// Render Blueprint in Modal
function renderBlueprint(recipe) {
  blueprintPlainEnglish.textContent = recipe.howItWorksInPlainEnglish;
  blueprintStepsList.innerHTML = recipe.stepByStepGuide.map(s => `
    <div style="background: var(--bg-node); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--accent-blue); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.82rem;">${s.step}</span>
        <span class="node-badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">${s.phase}</span>
        <h4 style="font-size: 1.05rem; font-weight: 700;">${s.title}</h4>
      </div>
      <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6; margin-bottom: 0.75rem;">${s.explanation}</p>
      <div style="background: rgba(16, 185, 129, 0.06); border-left: 3px solid var(--accent-emerald); padding: 0.65rem 0.85rem; border-radius: 4px; font-size: 0.84rem; color: #a7f3d0;">
        <strong>How to Recreate / Intercept:</strong> ${s.howToBuild}
      </div>
    </div>
  `).join('');
}

// 9. Upload & Quick Demos
function setupUploadAndDemos() {
  btnQuickPayDemo.addEventListener('click', () => {
    loadQuickPaySample();
  });

  btnBaridiDemo.addEventListener('click', () => {
    loadBaridiDemo();
  });

  apkFileInput.addEventListener('change', () => {
    if (apkFileInput.files.length > 0) {
      uploadApk(apkFileInput.files[0]);
    }
  });

  // Canvas Drag & Drop for APK files
  canvasContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  canvasContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.apk')) {
      uploadApk(files[0]);
    }
  });
}

// Upload APK to Server
async function uploadApk(file) {
  showToast(`Analyzing ${file.name}...`);
  const formData = new FormData();
  formData.append('apk', file);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const result = await res.json();
    renderAnalysis(result);
    showToast(`Analysis complete: ${result.app.name}!`);
  } catch (err) {
    console.error('Analysis failed:', err);
    alert(`Analysis error: ${err.message}`);
  }
}

// Toast helper
function showToast(msg) {
  toastMessage.textContent = msg;
  toastNotice.classList.add('show');
  setTimeout(() => {
    toastNotice.classList.remove('show');
  }, 2800);
}

// Run
init();
