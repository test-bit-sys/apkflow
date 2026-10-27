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
  setupSourceExplorer();
  setupRebuildStudio();
  setupAiAgent();
  setupFridaStudio();
  setupSandbox();
  setupAudit();
  setupExportHub();
  setupSecretVault();
  setupElfInspector();
  setupIntentMatrix();
  setupAdbBridge();
  setupCodeDiffViewer();

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
  loadProjectSources(data.id);
  loadFridaSuite(data.id);
  populateSandboxEndpoints(data.endpoints);
  loadAuditReport(data.id);
  setupExportLinks(data.id);
  loadSecrets(data.id);
  loadElfAnalysis(data.id);
  loadIntentMatrix(data.id);
  loadAdbDevices();

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
      const canvasBtn = document.querySelector('[data-view="canvas"]');
      if (canvasBtn) canvasBtn.classList.add('active');
    });
  });

  // Close modals on Escape key or backdrop click
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.full-modal').forEach(m => m.classList.remove('show'));
      dockBtns.forEach(b => b.classList.remove('active'));
      const canvasBtn = document.querySelector('[data-view="canvas"]');
      if (canvasBtn) canvasBtn.classList.add('active');
    }
  });

  document.querySelectorAll('.full-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        dockBtns.forEach(b => b.classList.remove('active'));
        const canvasBtn = document.querySelector('[data-view="canvas"]');
        if (canvasBtn) canvasBtn.classList.add('active');
      }
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
    const validExts = ['.apk', '.apks', '.xapk', '.apkm', '.zip'];
    if (files.length > 0 && validExts.some(ext => files[0].name.toLowerCase().endsWith(ext))) {
      uploadApk(files[0]);
    }
  });
}

// Upload APK to Server
async function uploadApk(file) {
  showToast(`Uploading & analyzing ${file.name}...`);
  const formData = new FormData();
  formData.append('apk', file);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let errorMsg = 'Failed to analyze application.';
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || errorMsg;
      } catch {
        errorMsg = await res.text();
      }
      throw new Error(errorMsg);
    }

    const result = await res.json();
    renderAnalysis(result);
    showToast(`Analysis complete: ${result.app.name} (${result.app.packageName})!`);
  } catch (err) {
    console.error('Analysis failed:', err);
    showToast(`❌ Error: ${err.message}`);
    alert(`ApkFlow Analysis Error:\n\n${err.message}`);
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

// ========================================================
// 9. Source Code Explorer Logic
// ========================================================
let currentSourcesData = null;
let activeSourceFilePath = 'AndroidManifest.xml';

const modalSources = document.getElementById('modal-sources');
const sourcesTreeContainer = document.getElementById('sourcesTreeContainer');
const sourceFileSearch = document.getElementById('sourceFileSearch');
const currentFilePath = document.getElementById('currentFilePath');
const currentFileLang = document.getElementById('currentFileLang');
const sourceCodeDisplay = document.getElementById('sourceCodeDisplay');
const editorStatusInfo = document.getElementById('editorStatusInfo');
const btnCopyCurrentFile = document.getElementById('btnCopyCurrentFile');
const btnSaveCurrentFile = document.getElementById('btnSaveCurrentFile');
const sourcesTotalFilesBadge = document.getElementById('sourcesTotalFilesBadge');

async function loadProjectSources(analysisId) {
  try {
    const res = await fetch(`/api/sources/${analysisId}`);
    if (!res.ok) return;
    const data = await res.json();
    currentSourcesData = data;
    if (sourcesTotalFilesBadge) {
      sourcesTotalFilesBadge.textContent = `${data.fileCount} Files`;
    }
    renderSourcesTree(data.tree);

    const defaultFile = data.availableFiles.includes('AndroidManifest.xml') 
      ? 'AndroidManifest.xml' 
      : data.availableFiles[0];
    if (defaultFile) {
      activeSourceFilePath = defaultFile;
      loadSourceFileContent(analysisId, defaultFile);
    }
  } catch (err) {
    console.error('Failed to load project sources:', err);
  }
}

function renderSourcesTree(nodes, filterText = '', container = sourcesTreeContainer, depth = 0) {
  if (depth === 0) container.innerHTML = '';

  nodes.forEach(node => {
    if (filterText && !matchesFilter(node, filterText.toLowerCase())) {
      return;
    }

    const item = document.createElement('div');
    item.className = 'tree-node-item' + (node.path === activeSourceFilePath ? ' active' : '');
    item.style.paddingLeft = `${depth * 14 + 10}px`;

    let icon = '📄';
    if (node.type === 'directory') icon = '📁';
    else if (node.name.endsWith('.java')) icon = '☕';
    else if (node.name.endsWith('.smali')) icon = '⚙️';
    else if (node.name.endsWith('.xml')) icon = '📑';
    else if (node.name.endsWith('.json')) icon = '📦';
    else if (node.name.endsWith('.cpp')) icon = '🔧';

    item.innerHTML = `
      <span>${icon}</span>
      <span style="overflow: hidden; text-overflow: ellipsis;">${node.name}</span>
    `;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (node.type === 'directory') {
        const childContainer = item.nextElementSibling;
        if (childContainer && childContainer.classList.contains('tree-children')) {
          childContainer.style.display = childContainer.style.display === 'none' ? 'block' : 'none';
        }
      } else {
        document.querySelectorAll('.tree-node-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        activeSourceFilePath = node.path;
        if (currentAnalysis) {
          loadSourceFileContent(currentAnalysis.id, node.path);
        }
      }
    });

    container.appendChild(item);

    if (node.type === 'directory' && node.children) {
      const childContainer = document.createElement('div');
      childContainer.className = 'tree-children';
      renderSourcesTree(node.children, filterText, childContainer, depth + 1);
      container.appendChild(childContainer);
    }
  });
}

function matchesFilter(node, query) {
  if (node.name.toLowerCase().includes(query) || node.path.toLowerCase().includes(query)) return true;
  if (node.children) {
    return node.children.some(c => matchesFilter(c, query));
  }
  return false;
}

async function loadSourceFileContent(analysisId, filePath) {
  try {
    const res = await fetch(`/api/sources/${analysisId}/file?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) return;
    const data = await res.json();
    currentFilePath.textContent = data.path;
    const ext = data.path.split('.').pop().toUpperCase();
    currentFileLang.textContent = ext;
    sourceCodeDisplay.value = data.content;
    const lines = data.content.split('\n').length;
    const kb = (new Blob([data.content]).size / 1024).toFixed(1);
    editorStatusInfo.textContent = `Lines: ${lines} • Size: ${kb} KB`;
  } catch (err) {
    console.error('Failed to load file content:', err);
  }
}

function setupSourceExplorer() {
  if (sourceFileSearch) {
    sourceFileSearch.addEventListener('input', () => {
      const q = sourceFileSearch.value.trim();
      if (currentSourcesData) {
        renderSourcesTree(currentSourcesData.tree, q);
      }
    });
  }

  if (btnCopyCurrentFile) {
    btnCopyCurrentFile.addEventListener('click', () => {
      navigator.clipboard.writeText(sourceCodeDisplay.value);
      showToast(`Copied ${activeSourceFilePath} to clipboard!`);
    });
  }

  if (btnSaveCurrentFile) {
    btnSaveCurrentFile.addEventListener('click', async () => {
      if (!currentAnalysis) return;
      showToast('Saving changes into memory...');
      try {
        const res = await fetch(`/api/sources/${currentAnalysis.id}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: activeSourceFilePath,
            content: sourceCodeDisplay.value,
          }),
        });
        if (res.ok) {
          showToast(`Saved ${activeSourceFilePath}! Ready for Rebuilder.`);
        }
      } catch (err) {
        console.error('Failed to save file:', err);
      }
    });
  }
}

// ========================================================
// 10. Mod & Rebuild Studio Logic
// ========================================================
const patchRoot = document.getElementById('patchRoot');
const patchSsl = document.getElementById('patchSsl');
const patchDebug = document.getElementById('patchDebug');
const patchRedirect = document.getElementById('patchRedirect');
const inputRedirectUrl = document.getElementById('inputRedirectUrl');
const patchTelemetry = document.getElementById('patchTelemetry');
const btnTriggerRebuild = document.getElementById('btnTriggerRebuild');
const rebuildLogs = document.getElementById('rebuildLogs');
const rebuildOutputCard = document.getElementById('rebuildOutputCard');
const rebuildSuccessTitle = document.getElementById('rebuildSuccessTitle');
const rebuildMetaInfo = document.getElementById('rebuildMetaInfo');
const btnDownloadRebuiltApk = document.getElementById('btnDownloadRebuiltApk');
const rebuildAdbCmd = document.getElementById('rebuildAdbCmd');
const btnCopyAdbCmd = document.getElementById('btnCopyAdbCmd');

function setupRebuildStudio() {
  if (!btnTriggerRebuild) return;

  btnTriggerRebuild.addEventListener('click', async () => {
    if (!currentAnalysis) {
      showToast('No active analysis loaded.');
      return;
    }

    btnTriggerRebuild.disabled = true;
    btnTriggerRebuild.innerHTML = `<span style="animation: spin 1s linear infinite; display: inline-block;">⚙️</span> Rebuilding & Signing...`;
    rebuildLogs.innerHTML = `<div class="term-line" style="color: #a5b4fc;">[INITIALIZING] Starting ApkFlow Rebuilder & Pure-TS Signer...</div>`;
    rebuildOutputCard.style.display = 'none';

    try {
      const payload = {
        id: currentAnalysis.id,
        bypassRoot: patchRoot.checked,
        bypassSsl: patchSsl.checked,
        makeDebuggable: patchDebug.checked,
        redirectApiUrl: patchRedirect.checked ? inputRedirectUrl.value.trim() : undefined,
        removeTelemetry: patchTelemetry.checked,
      };

      const res = await fetch('/api/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      rebuildLogs.innerHTML = '';
      (data.logs || []).forEach(line => {
        const div = document.createElement('div');
        div.className = 'term-line';
        if (line.includes('✅') || line.includes('Success')) div.style.color = '#34d399';
        else if (line.includes('🛡️') || line.includes('🔓') || line.includes('🐞') || line.includes('🌐')) div.style.color = '#f59e0b';
        else div.style.color = '#38bdf8';
        div.textContent = line;
        rebuildLogs.appendChild(div);
      });
      rebuildLogs.scrollTop = rebuildLogs.scrollHeight;

      rebuildOutputCard.style.display = 'block';
      rebuildSuccessTitle.textContent = data.filename;
      rebuildMetaInfo.textContent = `Size: ${(data.size / 1024 / 1024).toFixed(2)} MB • SHA-256: ${data.sha256.substring(0, 16)}...`;
      btnDownloadRebuiltApk.href = data.downloadUrl;
      btnDownloadRebuiltApk.download = data.filename;
      rebuildAdbCmd.textContent = `adb install -r ${data.filename}`;

      showToast(`🎉 Rebuilt: ${data.filename}`);
    } catch (err) {
      console.error('Rebuild failed:', err);
      rebuildLogs.innerHTML += `<div class="term-line" style="color: #ef4444;">[ERROR] ${err.message}</div>`;
      alert(`Rebuild error: ${err.message}`);
    } finally {
      btnTriggerRebuild.disabled = false;
      btnTriggerRebuild.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Rebuild & Sign APK Now`;
    }
  });

  if (btnCopyAdbCmd) {
    btnCopyAdbCmd.addEventListener('click', () => {
      navigator.clipboard.writeText(rebuildAdbCmd.textContent);
      showToast('Copied ADB install command!');
    });
  }
}

// ========================================================
// 11. Autonomous AI Agent Copilot Logic
// ========================================================
const agentChatMessages = document.getElementById('agentChatMessages');
const agentPromptInput = document.getElementById('agentPromptInput');
const btnSendAgentPrompt = document.getElementById('btnSendAgentPrompt');
const btnConfigureApiKey = document.getElementById('btnConfigureApiKey');

function setupAiAgent() {
  if (!btnSendAgentPrompt) return;

  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      agentPromptInput.value = chip.dataset.agentPrompt;
      sendAgentPrompt();
    });
  });

  btnSendAgentPrompt.addEventListener('click', () => {
    sendAgentPrompt();
  });

  agentPromptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAgentPrompt();
    }
  });

  if (btnConfigureApiKey) {
    btnConfigureApiKey.addEventListener('click', () => {
      const curr = localStorage.getItem('apkflow_api_key') || '';
      const key = prompt('Configure LLM API Key (Gemini, OpenAI, Anthropic, or leave empty for built-in heuristic agent):', curr);
      if (key !== null) {
        localStorage.setItem('apkflow_api_key', key.trim());
        showToast(key.trim() ? 'API Key saved!' : 'Switched to native autonomous agent mode.');
      }
    });
  }
}

async function sendAgentPrompt() {
  const promptText = agentPromptInput.value.trim();
  if (!promptText || !currentAnalysis) return;

  agentPromptInput.value = '';

  const userRow = document.createElement('div');
  userRow.className = 'agent-msg-row agent-msg-user';
  userRow.innerHTML = `
    <div class="agent-avatar agent-avatar-user">You</div>
    <div class="agent-msg-bubble">${escapeHtml(promptText)}</div>
  `;
  agentChatMessages.appendChild(userRow);

  const thinkingRow = document.createElement('div');
  thinkingRow.className = 'agent-msg-row agent-msg-bot';
  thinkingRow.id = 'agentThinkingRow';
  thinkingRow.innerHTML = `
    <div class="agent-avatar agent-avatar-bot">AI</div>
    <div class="agent-msg-bubble" style="display: flex; align-items: center; gap: 0.6rem; color: var(--accent-cyan);">
      <span style="display: inline-block; animation: spin 1s linear infinite;">⚡</span>
      Analyzing DEX bytecode, synthesizing patches, and compiling APK...
    </div>
  `;
  agentChatMessages.appendChild(thinkingRow);
  agentChatMessages.scrollTop = agentChatMessages.scrollHeight;

  try {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentAnalysis.id,
        prompt: promptText,
        apiKey: localStorage.getItem('apkflow_api_key') || undefined,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    thinkingRow.remove();

    const botRow = document.createElement('div');
    botRow.className = 'agent-msg-row agent-msg-bot';

    let thoughtHtml = '';
    if (data.thoughtProcess && data.thoughtProcess.length > 0) {
      thoughtHtml = `
        <details class="thought-box" open>
          <summary class="thought-header">🧠 View Agent Reasoning & Plan (${data.thoughtProcess.length} Steps)</summary>
          <ul class="thought-list">
            ${data.thoughtProcess.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
          </ul>
        </details>
      `;
    }

    let diffsHtml = '';
    if (data.fileDiffs && data.fileDiffs.length > 0) {
      diffsHtml = data.fileDiffs.map(df => `
        <div class="diff-container">
          <div class="diff-header">
            <span>📄 ${escapeHtml(df.path)}</span>
            <span style="color: var(--accent-emerald);">Synthesized Code Diff</span>
          </div>
          <pre class="diff-code">${renderDiffLines(df.unifiedDiff)}</pre>
        </div>
      `).join('');
    }

    let rebuildCardHtml = '';
    if (data.rebuiltApk) {
      rebuildCardHtml = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 1.1rem; margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">📦 Rebuilt Output: ${escapeHtml(data.rebuiltApk.filename)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 0.25rem;">
              ${(data.rebuiltApk.size / 1024 / 1024).toFixed(2)} MB • Android Debug Signed • SHA-256: ${data.rebuiltApk.sha256.substring(0, 14)}...
            </div>
          </div>
          <a href="${data.rebuiltApk.downloadUrl}" download="${data.rebuiltApk.filename}" class="btn btn-primary" style="text-decoration: none; padding: 0.55rem 1.1rem;">
            Download APK
          </a>
        </div>
      `;
    }

    const formattedSummary = formatMarkdown(data.summary);

    botRow.innerHTML = `
      <div class="agent-avatar agent-avatar-bot">AI</div>
      <div class="agent-msg-bubble">
        <div>${formattedSummary}</div>
        ${thoughtHtml}
        ${diffsHtml}
        ${rebuildCardHtml}
      </div>
    `;

    agentChatMessages.appendChild(botRow);
    agentChatMessages.scrollTop = agentChatMessages.scrollHeight;

    loadProjectSources(currentAnalysis.id);

  } catch (err) {
    console.error('Agent chat error:', err);
    thinkingRow.remove();
    const errorRow = document.createElement('div');
    errorRow.className = 'agent-msg-row agent-msg-bot';
    errorRow.innerHTML = `
      <div class="agent-avatar agent-avatar-bot">AI</div>
      <div class="agent-msg-bubble" style="color: #fca5a5; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25);">
        <strong>Agent Execution Error:</strong> ${escapeHtml(err.message)}
      </div>
    `;
    agentChatMessages.appendChild(errorRow);
  }
}

function renderDiffLines(unifiedDiff) {
  const lines = unifiedDiff.split('\n');
  return lines.map(line => {
    if (line.startsWith('+')) {
      return `<span class="diff-add">${escapeHtml(line)}</span>`;
    } else if (line.startsWith('-')) {
      return `<span class="diff-del">${escapeHtml(line)}</span>`;
    }
    return `<span>${escapeHtml(line)}</span>`;
  }).join('');
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h4 style="color:#fff; font-size:1rem; font-weight:700; margin:0.75rem 0 0.35rem 0;">$1</h4>')
    .replace(/^#### (.*$)/gim, '<h5 style="color:var(--accent-cyan); font-size:0.9rem; font-weight:600; margin:0.6rem 0 0.25rem 0;">$1</h5>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code style="background:rgba(255,255,255,0.08); padding:0.1rem 0.35rem; border-radius:4px; font-family:var(--font-mono); font-size:0.82rem; color:#a5b4fc;">$1</code>')
    .replace(/\n\n/gim, '<br><br>')
    .replace(/^- (.*$)/gim, '<div style="margin-left:1rem; margin-bottom:0.25rem;">• $1</div>');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========================================================
// 12. Frida Dynamic Instrumentation Studio Logic
// ========================================================
let currentFridaSuite = null;
let currentFridaModule = 'all';

const fridaCodeArea = document.getElementById('fridaCodeArea');
const fridaScriptLabel = document.getElementById('fridaScriptLabel');
const fridaCmdSpawn = document.getElementById('fridaCmdSpawn');
const fridaCmdObjection = document.getElementById('fridaCmdObjection');
const btnCopyFridaScript = document.getElementById('btnCopyFridaScript');
const btnDownloadFridaScript = document.getElementById('btnDownloadFridaScript');

async function loadFridaSuite(analysisId) {
  try {
    const res = await fetch(`/api/frida/${analysisId}`);
    if (!res.ok) return;
    const suite = await res.json();
    currentFridaSuite = suite;

    if (fridaCmdSpawn) fridaCmdSpawn.textContent = suite.cliCommands.usbSpawn;
    if (fridaCmdObjection) fridaCmdObjection.textContent = suite.cliCommands.objectionSpawn;

    updateFridaDisplay();
  } catch (err) {
    console.error('Failed to load Frida suite:', err);
  }
}

function updateFridaDisplay() {
  if (!currentFridaSuite) return;

  let code = currentFridaSuite.fullScript;
  let label = 'Comprehensive All-in-One Instrumentation Agent';

  if (currentFridaModule === 'root') {
    code = currentFridaSuite.modules.rootBypass;
    label = 'RootBeer & System Anti-Root Hook';
  } else if (currentFridaModule === 'ssl') {
    code = currentFridaSuite.modules.sslUnpinning;
    label = 'OkHttp3 & TrustManager Universal SSL Pinning Bypass';
  } else if (currentFridaModule === 'crypto') {
    code = currentFridaSuite.modules.cryptoSpy;
    label = 'Real-Time Cipher & HMAC Key Extraction Hook';
  } else if (currentFridaModule === 'native') {
    code = currentFridaSuite.modules.nativeJni;
    label = 'Native C++ JNI Memory Hook';
  } else if (currentFridaModule === 'tracer') {
    code = currentFridaSuite.modules.methodTracer;
    label = 'Activity Lifecycle & Intent Flow Tracer';
  }

  if (fridaCodeArea) fridaCodeArea.textContent = code;
  if (fridaScriptLabel) fridaScriptLabel.textContent = `Frida Script — ${label}`;
}

function setupFridaStudio() {
  document.querySelectorAll('.frida-module-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.frida-module-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFridaModule = btn.dataset.fridaMod;
      updateFridaDisplay();
    });
  });

  if (btnCopyFridaScript) {
    btnCopyFridaScript.addEventListener('click', () => {
      if (fridaCodeArea) {
        navigator.clipboard.writeText(fridaCodeArea.textContent);
        showToast('Frida script copied to clipboard!');
      }
    });
  }

  if (btnDownloadFridaScript) {
    btnDownloadFridaScript.addEventListener('click', (e) => {
      e.preventDefault();
      if (!fridaCodeArea) return;
      const blob = new Blob([fridaCodeArea.textContent], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apkflow_${currentFridaModule}_agent.js`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded Frida agent script!');
    });
  }

  document.querySelectorAll('.btn-copy-cmd').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.cmdTarget;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        navigator.clipboard.writeText(targetEl.textContent);
        showToast('CLI command copied!');
      }
    });
  });
}

// ========================================================
// 13. API Sandbox & Virtual Mock Gateway Logic
// ========================================================
const sandboxEndpointSelect = document.getElementById('sandboxEndpointSelect');
const sandboxMethodSelect = document.getElementById('sandboxMethodSelect');
const sandboxUrlInput = document.getElementById('sandboxUrlInput');
const sandboxModeSelect = document.getElementById('sandboxModeSelect');
const sandboxHeadersInput = document.getElementById('sandboxHeadersInput');
const sandboxBodyInput = document.getElementById('sandboxBodyInput');
const btnSendSandboxRequest = document.getElementById('btnSendSandboxRequest');
const sandboxResponseStatus = document.getElementById('sandboxResponseStatus');
const sandboxResponseLatency = document.getElementById('sandboxResponseLatency');
const sandboxResponseBody = document.getElementById('sandboxResponseBody');

function populateSandboxEndpoints(endpoints) {
  if (!sandboxEndpointSelect) return;
  sandboxEndpointSelect.innerHTML = '<option value="">Select an endpoint to pre-fill...</option>';

  endpoints.forEach((ep, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `[${ep.method}] ${ep.path} (${ep.category})`;
    sandboxEndpointSelect.appendChild(opt);
  });
}

function setupSandbox() {
  if (sandboxEndpointSelect) {
    sandboxEndpointSelect.addEventListener('change', () => {
      const idx = sandboxEndpointSelect.value;
      if (idx === '' || !currentAnalysis?.endpoints[idx]) return;

      const ep = currentAnalysis.endpoints[idx];
      sandboxMethodSelect.value = ep.method;
      sandboxUrlInput.value = ep.url;
      sandboxHeadersInput.value = JSON.stringify(ep.headers || { 'Content-Type': 'application/json' }, null, 2);

      let payload = ep.samplePayload || {};
      sandboxBodyInput.value = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    });
  }

  if (btnSendSandboxRequest) {
    btnSendSandboxRequest.addEventListener('click', async () => {
      const url = sandboxUrlInput.value.trim();
      const method = sandboxMethodSelect.value;
      const mode = sandboxModeSelect.value;

      if (!url) {
        showToast('Please enter or select a target URL');
        return;
      }

      btnSendSandboxRequest.disabled = true;
      btnSendSandboxRequest.innerHTML = `<span style="animation: spin 1s linear infinite; display: inline-block;">⚡</span> Executing...`;
      sandboxResponseBody.textContent = 'Executing request in sandbox...';

      let parsedHeaders = {};
      try {
        if (sandboxHeadersInput.value.trim()) {
          parsedHeaders = JSON.parse(sandboxHeadersInput.value.trim());
        }
      } catch {
        parsedHeaders = { 'Content-Type': 'application/json' };
      }

      let parsedBody = null;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          if (sandboxBodyInput.value.trim()) {
            parsedBody = JSON.parse(sandboxBodyInput.value.trim());
          }
        } catch {
          parsedBody = sandboxBodyInput.value.trim();
        }
      }

      try {
        const res = await fetch('/api/mock/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            method,
            headers: parsedHeaders,
            body: parsedBody,
            mode,
          }),
        });

        const data = await res.json();
        sandboxResponseStatus.textContent = `${data.status} ${data.statusText || 'OK'}`;
        if (data.status >= 200 && data.status < 300) {
          sandboxResponseStatus.style.background = 'rgba(16, 185, 129, 0.2)';
          sandboxResponseStatus.style.color = '#34d399';
        } else {
          sandboxResponseStatus.style.background = 'rgba(239, 68, 68, 0.2)';
          sandboxResponseStatus.style.color = '#f87171';
        }

        sandboxResponseLatency.textContent = `${data.latencyMs} ms`;
        sandboxResponseBody.textContent = JSON.stringify(data.data, null, 2);
        showToast(`Request complete: ${data.status} (${data.mode})`);
      } catch (err) {
        console.error('Sandbox request failed:', err);
        sandboxResponseBody.textContent = `Error: ${err.message}`;
      } finally {
        btnSendSandboxRequest.disabled = false;
        btnSendSandboxRequest.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Send Request`;
      }
    });
  }
}

// ========================================================
// 14. OWASP Mobile SAST Security Auditor Logic
// ========================================================
const auditGradeCircle = document.getElementById('auditGradeCircle');
const auditRiskBadge = document.getElementById('auditRiskBadge');
const auditSummaryText = document.getElementById('auditSummaryText');
const metricCriticalCount = document.getElementById('metricCriticalCount');
const metricHighCount = document.getElementById('metricHighCount');
const metricMediumCount = document.getElementById('metricMediumCount');
const metricLowCount = document.getElementById('metricLowCount');
const auditVulnsList = document.getElementById('auditVulnsList');

async function loadAuditReport(analysisId) {
  try {
    const res = await fetch(`/api/audit/${analysisId}`);
    if (!res.ok) return;
    const report = await res.json();

    if (auditGradeCircle) auditGradeCircle.textContent = report.grade;
    if (auditRiskBadge) {
      auditRiskBadge.textContent = `${report.riskLevel} RISK`;
      auditRiskBadge.className = `badge badge-${report.riskLevel.toLowerCase()}`;
    }
    if (auditSummaryText) auditSummaryText.textContent = report.summary;
    if (metricCriticalCount) metricCriticalCount.textContent = report.metrics.critical;
    if (metricHighCount) metricHighCount.textContent = report.metrics.high;
    if (metricMediumCount) metricMediumCount.textContent = report.metrics.medium;
    if (metricLowCount) metricLowCount.textContent = report.metrics.low;

    if (auditVulnsList) {
      auditVulnsList.innerHTML = '';
      report.vulnerabilities.forEach(v => {
        const card = document.createElement('div');
        card.className = 'vuln-item-card';
        card.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span class="badge badge-${v.severity.toLowerCase()}">${v.severity}</span>
              <span style="font-size: 0.75rem; color: var(--accent-cyan); font-family: var(--font-mono); font-weight: 700;">OWASP ${v.category}</span>
              <strong style="color: #fff; font-size: 0.95rem;">${escapeHtml(v.title)}</strong>
            </div>
            <span class="badge" style="background: rgba(255,255,255,0.06); color: #fff; font-family: var(--font-mono); font-size: 0.75rem;">CVSS ${v.cvss}</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.84rem; line-height: 1.5; margin-bottom: 0.5rem;">${escapeHtml(v.description)}</p>
          <div style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 0.5rem;">📍 Location: <span style="color: #cbd5e1;">${escapeHtml(v.location)}</span></div>
          <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid var(--accent-emerald); padding: 0.5rem 0.75rem; border-radius: 4px; font-size: 0.8rem; color: #a7f3d0;">
            <strong>Remediation:</strong> ${escapeHtml(v.remediation)}
          </div>
        `;
        auditVulnsList.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Failed to load audit report:', err);
  }
}

function setupAudit() {
  // Setup if needed
}

// ========================================================
// 15. Enterprise Export Hub Logic
// ========================================================
const btnExportPostman = document.getElementById('btnExportPostman');
const btnExportOpenApi = document.getElementById('btnExportOpenApi');
const btnExportReport = document.getElementById('btnExportReport');
const btnExportApk = document.getElementById('btnExportApk');

function setupExportLinks(analysisId) {
  if (btnExportPostman) btnExportPostman.href = `/api/export/${analysisId}/postman`;
  if (btnExportOpenApi) btnExportOpenApi.href = `/api/export/${analysisId}/openapi`;
  if (btnExportReport) btnExportReport.href = `/api/export/${analysisId}/report`;
}

function setupExportHub() {
  if (btnExportApk) {
    btnExportApk.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.full-modal').forEach(m => m.classList.remove('show'));
      const rebuildBtn = document.getElementById('dockBtnRebuild');
      const rebuildModal = document.getElementById('modal-rebuild');
      if (rebuildBtn) rebuildBtn.classList.add('active');
      if (rebuildModal) rebuildModal.classList.add('show');
    });
  }
}

// ========================================================
// 16. Sensitive Data & Secret Vault Logic
// ========================================================
let currentSecretsReport = null;
const secretOverallBadge = document.getElementById('secretOverallBadge');
const secretTotalCount = document.getElementById('secretTotalCount');
const secretCriticalCount = document.getElementById('secretCriticalCount');
const secretHighCount = document.getElementById('secretHighCount');
const secretRiskLevel = document.getElementById('secretRiskLevel');
const secretSearchInput = document.getElementById('secretSearchInput');
const btnAiRedactAllSecrets = document.getElementById('btnAiRedactAllSecrets');
const secretListContainer = document.getElementById('secretListContainer');

async function loadSecrets(analysisId) {
  try {
    const res = await fetch(`/api/secrets/${analysisId}`);
    if (!res.ok) return;
    const data = await res.json();
    currentSecretsReport = data;
    renderSecrets(data);
  } catch (err) {
    console.error('Failed to load secrets report:', err);
  }
}

function renderSecrets(report) {
  if (secretTotalCount) secretTotalCount.textContent = report.totalSecrets;
  if (secretCriticalCount) secretCriticalCount.textContent = report.criticalCount;
  if (secretHighCount) secretHighCount.textContent = report.highCount;
  if (secretRiskLevel) {
    secretRiskLevel.textContent = report.overallRisk;
    secretRiskLevel.style.color = report.overallRisk === 'CRITICAL' ? '#ef4444' : report.overallRisk === 'HIGH' ? '#f59e0b' : '#10b981';
  }
  if (secretOverallBadge) {
    secretOverallBadge.textContent = `${report.totalSecrets} Detected`;
    secretOverallBadge.style.background = report.totalSecrets > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    secretOverallBadge.style.color = report.totalSecrets > 0 ? '#f87171' : '#34d399';
  }

  if (!secretListContainer) return;
  const q = secretSearchInput?.value?.toLowerCase()?.trim() || '';
  const filtered = (report.secrets || []).filter(s => 
    s.title.toLowerCase().includes(q) ||
    s.type.toLowerCase().includes(q) ||
    s.location.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    secretListContainer.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; background: var(--bg-node); border: 1px dashed var(--border-subtle); border-radius: 12px; color: var(--text-muted);">
        <span style="font-size: 2rem;">🛡️</span>
        <h4 style="font-size: 1.1rem; color: #fff; margin-top: 0.5rem;">No Hardcoded Secrets or Cloud Keys Detected</h4>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">The application does not expose sensitive credentials in plain text.</p>
      </div>
    `;
    return;
  }

  secretListContainer.innerHTML = filtered.map(s => {
    const sevColor = s.severity === 'CRITICAL' ? '#ef4444' : s.severity === 'HIGH' ? '#f59e0b' : '#60a5fa';
    return `
      <div style="background: var(--bg-node); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1.1rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="badge" style="background: ${sevColor}22; color: ${sevColor}; font-weight: 700;">${s.severity}</span>
            <h4 style="font-size: 1rem; font-weight: 700; color: #fff;">${escapeHtml(s.title)}</h4>
          </div>
          <span class="badge" style="background: rgba(255, 255, 255, 0.05); color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.72rem;">
            Entropy: ${s.entropy}
          </span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; background: #060911; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.6rem; font-family: var(--font-mono); font-size: 0.82rem;">
          <span id="sec-val-${s.id}" data-masked="${escapeHtml(s.maskedString)}" data-raw="${escapeHtml(s.matchedString)}" style="color: #cbd5e1;">${escapeHtml(s.maskedString)}</span>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-secondary" style="padding: 0.15rem 0.5rem; font-size: 0.7rem;" onclick="toggleSecretReveal('${s.id}')">Reveal</button>
            <button class="btn btn-secondary" style="padding: 0.15rem 0.5rem; font-size: 0.7rem;" onclick="copyText('${escapeHtml(s.matchedString)}')">Copy</button>
          </div>
        </div>
        <div style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 0.4rem;">
          📍 Location: <span style="color: #a5b4fc;">${escapeHtml(s.location)}</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.82rem; margin-bottom: 0.5rem; line-height: 1.5;">${escapeHtml(s.recommendation)}</p>
      </div>
    `;
  }).join('');
}

window.toggleSecretReveal = function(id) {
  const el = document.getElementById(`sec-val-${id}`);
  if (!el) return;
  const isMasked = el.textContent === el.dataset.masked;
  el.textContent = isMasked ? el.dataset.raw : el.dataset.masked;
  el.style.color = isMasked ? '#f87171' : '#cbd5e1';
};

function setupSecretVault() {
  if (secretSearchInput) {
    secretSearchInput.addEventListener('input', () => {
      if (currentSecretsReport) renderSecrets(currentSecretsReport);
    });
  }

  if (btnAiRedactAllSecrets) {
    btnAiRedactAllSecrets.addEventListener('click', () => {
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.full-modal').forEach(m => m.classList.remove('show'));
      const agentBtn = document.getElementById('dockBtnAgent');
      const agentModal = document.getElementById('modal-agent');
      if (agentBtn) agentBtn.classList.add('active');
      if (agentModal) agentModal.classList.add('show');

      const agentInput = document.getElementById('agentPromptInput');
      if (agentInput) {
        agentInput.value = 'احذف وعقم جميع المفاتيح السرية الحساسة المستخرجة من المشروع، واستبدلها بمفاتيح بيئة ديناميكية، ثم أعد بناء التطبيق';
        agentInput.focus();
      }
    });
  }
}

// ========================================================
// 17. Native Binary & ELF / JNI Inspector Logic
// ========================================================
const elfTotalLibsBadge = document.getElementById('elfTotalLibsBadge');
const elfContentContainer = document.getElementById('elfContentContainer');

async function loadElfAnalysis(analysisId) {
  try {
    const res = await fetch(`/api/elf/${analysisId}`);
    if (!res.ok) return;
    const data = await res.json();
    renderElf(data);
  } catch (err) {
    console.error('Failed to load ELF analysis:', err);
  }
}

function renderElf(elfData) {
  if (elfTotalLibsBadge) elfTotalLibsBadge.textContent = `${elfData.totalLibraries} Shared Objects (.so)`;
  if (!elfContentContainer) return;

  if (!elfData.libraries || elfData.libraries.length === 0) {
    elfContentContainer.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; background: var(--bg-node); border: 1px dashed var(--border-subtle); border-radius: 12px; color: var(--text-muted);">
        <span style="font-size: 2rem;">⚙️</span>
        <h4 style="font-size: 1.1rem; color: #fff; margin-top: 0.5rem;">Pure Java / Kotlin Application</h4>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">No native C/C++ shared objects (.so) bundled in this APK.</p>
      </div>
    `;
    return;
  }

  elfContentContainer.innerHTML = elfData.libraries.map(lib => {
    return `
      <div style="background: var(--bg-node); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(168, 85, 247, 0.15); color: #c084fc; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
              ⚙️
            </div>
            <div>
              <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff;">${escapeHtml(lib.filename)}</h4>
              <p style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">${lib.architecture} • ${lib.elfHeader.bitness} • ${lib.elfHeader.machine} • ${(lib.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <span class="badge" style="background: ${lib.securityMitigations.hasStackCanary ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${lib.securityMitigations.hasStackCanary ? '#34d399' : '#f87171'};">
              ${lib.securityMitigations.hasStackCanary ? '🛡️ Stack Canary' : '⚠️ No Stack Canary'}
            </span>
            <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">
              ${lib.securityMitigations.hasJniOnLoad ? 'JNI_OnLoad' : 'Manual Bind'}
            </span>
          </div>
        </div>

        <!-- Exported JNI Methods -->
        <div style="margin-bottom: 1rem;">
          <h5 style="font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">Exported JNI Bridge Functions (${lib.exportedJniMethods.length}):</h5>
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${lib.exportedJniMethods.map(m => `
              <div style="background: #060911; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.45rem 0.75rem; font-family: var(--font-mono); font-size: 0.78rem; display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #67e8f9;">${escapeHtml(m.rawSymbol)}</span>
                <span style="color: var(--text-muted); font-size: 0.72rem;">${escapeHtml(m.javaClass)}.${escapeHtml(m.javaMethod)}()</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Linked Dynamic Libraries -->
        <div style="margin-bottom: 0.75rem;">
          <h5 style="font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem;">Linked Dynamic Libraries:</h5>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
            ${lib.importedLibraries.map(dep => `
              <span class="badge" style="background: rgba(255, 255, 255, 0.05); color: #cbd5e1; font-family: var(--font-mono); font-size: 0.72rem;">
                ${escapeHtml(dep)}
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupElfInspector() {}

// ========================================================
// 18. Deep Link & Intent-Filter Matrix Logic
// ========================================================
const intentTotalBadge = document.getElementById('intentTotalBadge');
const intentTotalCount = document.getElementById('intentTotalCount');
const intentCustomCount = document.getElementById('intentCustomCount');
const intentAppLinksCount = document.getElementById('intentAppLinksCount');
const intentUnverifiedCount = document.getElementById('intentUnverifiedCount');
const intentListContainer = document.getElementById('intentListContainer');

async function loadIntentMatrix(analysisId) {
  try {
    const res = await fetch(`/api/intent/${analysisId}`);
    if (!res.ok) return;
    const data = await res.json();
    renderIntentMatrix(data);
  } catch (err) {
    console.error('Failed to load intent matrix:', err);
  }
}

function renderIntentMatrix(data) {
  if (intentTotalCount) intentTotalCount.textContent = data.totalDeepLinks;
  if (intentCustomCount) intentCustomCount.textContent = data.customSchemeCount;
  if (intentAppLinksCount) intentAppLinksCount.textContent = data.appLinksCount;
  if (intentUnverifiedCount) intentUnverifiedCount.textContent = data.unverifiedCount;
  if (intentTotalBadge) intentTotalBadge.textContent = `${data.totalDeepLinks} Active Handlers`;
  if (!intentListContainer) return;

  intentListContainer.innerHTML = data.deepLinks.map(dl => {
    const riskColor = dl.riskLevel === 'HIGH' ? '#ef4444' : dl.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981';
    return `
      <div style="background: var(--bg-node); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1.1rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="badge" style="background: ${riskColor}22; color: ${riskColor}; font-weight: 700;">${dl.riskLevel} RISK</span>
            <code style="font-size: 0.95rem; color: #fff; font-weight: 700;">${escapeHtml(dl.sampleUri)}</code>
          </div>
          <span class="badge" style="background: ${dl.hasAutoVerify ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${dl.hasAutoVerify ? '#34d399' : '#f87171'}; font-size: 0.72rem;">
            ${dl.hasAutoVerify ? 'Verified App Link' : 'Unverified Scheme'}
          </span>
        </div>

        <div style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 0.5rem;">
          Target Component: <span style="color: #67e8f9;">${escapeHtml(dl.activityName)}</span> • Scheme: <span style="color: #fbbf24;">${escapeHtml(dl.scheme)}://</span>
        </div>

        <div style="background: #060911; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.45rem 0.75rem; font-family: var(--font-mono); font-size: 0.76rem; color: #a7f3d0; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>${escapeHtml(dl.adbTestCommand)}</span>
          <button class="btn btn-secondary" style="padding: 0.15rem 0.5rem; font-size: 0.7rem;" onclick="runIntentInAdb('${escapeHtml(dl.sampleUri)}')">Test in ADB</button>
        </div>

        ${dl.vulnerabilities.map(v => `
          <div style="background: rgba(239, 68, 68, 0.06); border-left: 3px solid ${riskColor}; padding: 0.45rem 0.75rem; border-radius: 4px; font-size: 0.8rem; margin-top: 0.35rem;">
            <strong style="color: ${riskColor};">${escapeHtml(v.title)}:</strong> <span style="color: var(--text-secondary);">${escapeHtml(v.description)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

window.runIntentInAdb = function(uri) {
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.full-modal').forEach(m => m.classList.remove('show'));
  const adbBtn = document.getElementById('dockBtnAdb');
  const adbModal = document.getElementById('modal-adb');
  if (adbBtn) adbBtn.classList.add('active');
  if (adbModal) adbModal.classList.add('show');

  executeAdb('custom', `adb shell am start -W -a android.intent.action.VIEW -d "${uri}" ${currentAnalysis?.app?.packageName || 'com.quickpay.wallet'}`);
};

function setupIntentMatrix() {}

// ========================================================
// 19. ADB Live Bridge & Simulator Logic
// ========================================================
const adbDeviceName = document.getElementById('adbDeviceName');
const adbDeviceDetails = document.getElementById('adbDeviceDetails');
const btnAdbLaunchApp = document.getElementById('btnAdbLaunchApp');
const btnAdbStopApp = document.getElementById('btnAdbStopApp');
const btnAdbClearData = document.getElementById('btnAdbClearData');
const btnAdbInstallApk = document.getElementById('btnAdbInstallApk');
const btnAdbStartFrida = document.getElementById('btnAdbStartFrida');
const btnRefreshLogcat = document.getElementById('btnRefreshLogcat');
const btnClearLogcat = document.getElementById('btnClearLogcat');
const adbLogcatOutput = document.getElementById('adbLogcatOutput');

async function loadAdbDevices() {
  try {
    const res = await fetch('/api/adb/devices');
    if (!res.ok) return;
    const devices = await res.json();
    if (devices.length > 0) {
      const dev = devices[0];
      if (adbDeviceName) adbDeviceName.textContent = `${dev.model} (${dev.type === 'virtual' ? 'Virtual Emulator' : 'USB Device'})`;
      if (adbDeviceDetails) adbDeviceDetails.textContent = `${dev.id} • ${dev.androidVersion} (API ${dev.apiLevel}) • ${dev.abi} • ${dev.state.toUpperCase()}`;
    }
  } catch (err) {
    console.error('Failed to load ADB devices:', err);
  }
}

async function executeAdb(action, extraParam) {
  const pkg = currentAnalysis?.app?.packageName || 'com.quickpay.wallet';
  showToast(`Executing ADB: ${action}...`);
  try {
    const res = await fetch('/api/adb/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, packageName: pkg, extraParam }),
    });
    const result = await res.json();
    appendAdbLog(`$ ${result.command}\n${result.output} (${result.durationMs}ms)`);
    showToast(`ADB Success: ${action}`);
  } catch (err) {
    appendAdbLog(`[ERROR] Execution failed: ${err.message}`);
  }
}

function appendAdbLog(text) {
  if (!adbLogcatOutput) return;
  const line = document.createElement('div');
  line.style.borderLeft = '3px solid var(--accent-emerald)';
  line.style.paddingLeft = '0.5rem';
  line.style.marginBottom = '0.5rem';
  line.style.color = '#a7f3d0';
  line.textContent = text;
  adbLogcatOutput.appendChild(line);
  adbLogcatOutput.scrollTop = adbLogcatOutput.scrollHeight;
}

async function loadLogcatStream() {
  const pkg = currentAnalysis?.app?.packageName || 'com.quickpay.wallet';
  try {
    const res = await fetch(`/api/adb/logcat/${pkg}`);
    if (!res.ok) return;
    const logs = await res.json();
    if (!adbLogcatOutput) return;
    adbLogcatOutput.innerHTML = '';

    logs.forEach(l => {
      const row = document.createElement('div');
      const levelColor = l.level === 'E' ? '#ef4444' : l.level === 'W' ? '#f59e0b' : l.level === 'I' ? '#10b981' : l.level === 'D' ? '#06b6d4' : '#64748b';
      row.style.display = 'flex';
      row.style.gap = '0.6rem';
      row.style.padding = '0.2rem 0';
      row.innerHTML = `
        <span style="color: #64748b;">${l.timestamp}</span>
        <span style="color: ${levelColor}; font-weight: 700;">${l.level}/${l.tag}:</span>
        <span style="color: #cbd5e1; flex: 1;">${escapeHtml(l.message)}</span>
      `;
      adbLogcatOutput.appendChild(row);
    });
    adbLogcatOutput.scrollTop = adbLogcatOutput.scrollHeight;
  } catch (err) {
    console.error('Failed to load logcat:', err);
  }
}

function setupAdbBridge() {
  if (btnAdbLaunchApp) btnAdbLaunchApp.addEventListener('click', () => executeAdb('launch', currentAnalysis?.app?.mainActivity));
  if (btnAdbStopApp) btnAdbStopApp.addEventListener('click', () => executeAdb('stop'));
  if (btnAdbClearData) btnAdbClearData.addEventListener('click', () => executeAdb('clear'));
  if (btnAdbInstallApk) btnAdbInstallApk.addEventListener('click', () => executeAdb('install', 'QuickPay-Sample-modded-signed.apk'));
  if (btnAdbStartFrida) btnAdbStartFrida.addEventListener('click', () => executeAdb('frida-start', 'apkflow_agent.js'));
  if (btnRefreshLogcat) btnRefreshLogcat.addEventListener('click', loadLogcatStream);
  if (btnClearLogcat) btnClearLogcat.addEventListener('click', () => { if (adbLogcatOutput) adbLogcatOutput.innerHTML = ''; });

  // Initial logcat load
  loadLogcatStream();
}

// ========================================================
// 20. Code Diff Viewer Logic
// ========================================================
const modalDiff = document.getElementById('modal-diff');
const diffStatsBadge = document.getElementById('diffStatsBadge');
const diffSubtitle = document.getElementById('diffSubtitle');
const diffViewerContainer = document.getElementById('diffViewerContainer');

window.showCodeDiff = async function(filePath, origContent, modContent) {
  try {
    const res = await fetch(`/api/diff/${currentAnalysis?.id || 'demo'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, originalContent: origContent, modifiedContent: modContent }),
    });
    const diffData = await res.json();

    if (diffStatsBadge) {
      diffStatsBadge.textContent = `+${diffData.totalAdditions} additions / -${diffData.totalDeletions} deletions`;
    }
    if (diffSubtitle) {
      diffSubtitle.textContent = `File: ${diffData.filePath} • Changes ready for rebuild`;
    }

    if (diffViewerContainer) {
      diffViewerContainer.innerHTML = diffData.diffLines.map(line => {
        const bg = line.type === 'add' ? 'rgba(16, 185, 129, 0.15)' : line.type === 'del' ? 'rgba(239, 68, 68, 0.15)' : 'transparent';
        const color = line.type === 'add' ? '#6ee7b7' : line.type === 'del' ? '#fca5a5' : '#94a3b8';
        const prefix = line.type === 'add' ? '+ ' : line.type === 'del' ? '- ' : '  ';
        return `
          <div style="background: ${bg}; color: ${color}; padding: 0.15rem 0.85rem; display: flex; gap: 0.75rem; white-space: pre-wrap;">
            <span style="color: #475569; width: 40px; text-align: right; user-select: none;">${line.lineNum || ''}</span>
            <span style="user-select: none; font-weight: 700;">${prefix}</span>
            <span>${escapeHtml(line.text)}</span>
          </div>
        `;
      }).join('');
    }

    if (modalDiff) modalDiff.classList.add('show');
  } catch (err) {
    console.error('Failed to compute diff:', err);
  }
};

function setupCodeDiffViewer() {}

// Run
init();


