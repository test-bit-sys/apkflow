// ========================================================
// ApkFlow v2.0 Enterprise Application Script
// Pure Client-Side Architecture, High Reliability, Zero Popups
// ========================================================

let currentAnalysis = null;
let currentSdkLang = 'typescript';

// Canvas Pan & Zoom State
let panX = 40;
let panY = 40;
let scale = 1.0;
let isPanning = false;
let startX = 0;
let startY = 0;

// State caches
let currentSourcesData = null;
let activeSourceFilePath = 'AndroidManifest.xml';
let currentSecretsReport = null;
let currentFridaSuite = null;
let currentFridaModule = 'all';

// SVG Icons for Flow Nodes
const SVG_ICONS = {
  Rocket: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path></svg>`,
  ShieldAlert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  Globe: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  Key: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 2-2 2m-1.5 1.5L14 9l-3 3-2-2-5 5 2 2 3-3 2 2 4.5-4.5"></path><circle cx="7.5" cy="15.5" r="5.5"></circle></svg>`,
  Lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  CreditCard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  Database: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
};

// ========================================================
// 1. Initialization
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  setupNavigationTabs();
  setupUploadSystem();
  setupCanvasPanZoom();
  setupInspectorDrawer();
  setupSourceExplorer();
  setupRebuilderStudio();
  setupFridaStudio();
  setupSandboxGateway();
  setupAdbBridge();
  setupAiAgent();
  setupSecretVault();
  setupExportHub();
  console.log('ApkFlow v2.0 initialized in clean standalone mode (no demo APKs loaded).');

  // Check URL query parameters for active analysis ID
  const urlParams = new URLSearchParams(window.location.search);
  const analysisId = urlParams.get('analysisId');
  if (analysisId) {
    loadAnalysisById(analysisId);
  }
});

async function loadAnalysisById(analysisId) {
  try {
    const res = await fetch(`/api/analysis/${analysisId}`);
    if (res.ok) {
      const data = await res.json();
      const emptyStateView = document.getElementById('emptyStateView');
      const activeWorkspaceView = document.getElementById('activeWorkspaceView');
      const projectInfoBar = document.getElementById('projectInfoBar');
      const mainNavTabs = document.getElementById('mainNavTabs');

      if (emptyStateView) emptyStateView.style.display = 'none';
      if (activeWorkspaceView) activeWorkspaceView.style.display = 'block';
      if (projectInfoBar) projectInfoBar.style.display = 'flex';
      if (mainNavTabs) mainNavTabs.style.display = 'flex';

      renderAnalysis(data);
      switchView('view-canvas');
      showToast(`Loaded analysis: ${data.app.name}!`);
    }
  } catch (err) {
    console.error('Failed to load analysis by ID:', err);
  }
}
window.loadAnalysisById = loadAnalysisById;

// ========================================================
// 2. Tab Navigation (In-Place Smooth Pane Switching)
// ========================================================
function setupNavigationTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetViewId = tab.dataset.tab;
      if (targetViewId) {
        switchView(targetViewId);
      }
    });
  });
}

function switchView(viewId) {
  // Update nav tab buttons
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === viewId);
  });

  // Update workspace panes
  document.querySelectorAll('.workspace-pane').forEach(p => {
    p.classList.toggle('active', p.id === viewId);
  });

  // If switching to canvas, recalculate cables or view
  if (viewId === 'view-canvas' && currentAnalysis) {
    setTimeout(resetCanvasView, 50);
  }
}
window.switchView = switchView;

// ========================================================
// 3. Upload System (Hero Dropzone + Top Header Button)
// ========================================================
function setupUploadSystem() {
  const apkFileInput = document.getElementById('apkFileInput');
  const dropzoneCard = document.getElementById('dropzoneCard');
  const canvasContainer = document.getElementById('canvasContainer');

  // File input change
  if (apkFileInput) {
    apkFileInput.addEventListener('change', () => {
      if (apkFileInput.files && apkFileInput.files.length > 0) {
        handleUpload(apkFileInput.files[0]);
      }
    });
  }

  // Dropzone drag & drop
  const dropTargets = [dropzoneCard, canvasContainer].filter(Boolean);
  dropTargets.forEach(target => {
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      target.classList.add('drag-active');
    });

    target.addEventListener('dragleave', (e) => {
      e.preventDefault();
      target.classList.remove('drag-active');
    });

    target.addEventListener('drop', (e) => {
      e.preventDefault();
      target.classList.remove('drag-active');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const validExts = ['.apk', '.apks', '.xapk', '.apkm', '.zip'];
        if (validExts.some(ext => file.name.toLowerCase().endsWith(ext))) {
          handleUpload(file);
        } else {
          showToast('⚠️ Supported formats: .apk, .apks, .xapk, .apkm, .zip');
        }
      }
    });
  });
}

async function handleUpload(file) {
  const progressBox = document.getElementById('uploadProgressBox');
  const progressText = document.getElementById('uploadProgressText');

  if (progressBox) progressBox.style.display = 'flex';
  if (progressText) progressText.textContent = `Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`;

  showToast(`Uploading ${file.name}...`);

  const formData = new FormData();
  formData.append('apk', file);

  try {
    // Step progress indicators
    setTimeout(() => {
      if (progressText) progressText.textContent = 'Extracting primary APK bundle & decompiling DEX...';
    }, 1500);

    setTimeout(() => {
      if (progressText) progressText.textContent = 'Analyzing JNI libraries, OWASP SAST, & Secret patterns...';
    }, 3200);

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

    const data = await res.json();

    // Hide empty state, reveal active enterprise workspace
    const emptyStateView = document.getElementById('emptyStateView');
    const activeWorkspaceView = document.getElementById('activeWorkspaceView');
    const projectInfoBar = document.getElementById('projectInfoBar');
    const mainNavTabs = document.getElementById('mainNavTabs');

    if (emptyStateView) emptyStateView.style.display = 'none';
    if (activeWorkspaceView) activeWorkspaceView.style.display = 'block';
    if (projectInfoBar) projectInfoBar.style.display = 'flex';
    if (mainNavTabs) mainNavTabs.style.display = 'flex';

    window.history.replaceState({}, '', `?analysisId=${data.id}`);

    renderAnalysis(data);
    switchView('view-canvas');
    showToast(`✅ Successfully analyzed ${data.app.name}!`);

  } catch (err) {
    console.error('Analysis failed:', err);
    showToast(`❌ Error: ${err.message}`);
    alert(`ApkFlow Analysis Error:\n\n${err.message}`);
  } finally {
    if (progressBox) progressBox.style.display = 'none';
  }
}

// ========================================================
// 4. Render Analysis into Workspace
// ========================================================
function renderAnalysis(data) {
  currentAnalysis = data;

  // Header meta (with safe null-checks)
  const headerAppName = document.getElementById('headerAppName');
  const headerAppPkg = document.getElementById('headerAppPkg');
  const headerAppVersion = document.getElementById('headerAppVersion');
  const headerAppFramework = document.getElementById('headerAppFramework');

  if (headerAppName) headerAppName.textContent = data.app.name || 'Android Application';
  if (headerAppPkg) headerAppPkg.textContent = data.app.packageName || 'com.app';
  if (headerAppVersion) headerAppVersion.textContent = data.app.versionName ? `v${data.app.versionName}` : 'v1.0';
  if (headerAppFramework) headerAppFramework.textContent = data.app.framework?.displayName || 'Android';

  // 1. Render Flowchart Nodes
  renderFlowNodes(data.flow?.nodes || []);

  // 2. Load Extended Subsystems
  loadProjectSources(data.id);
  loadAuditReport(data.id);
  loadSecrets(data.id);
  loadElfAnalysis(data.id);
  loadIntentMatrix(data.id);
  loadFridaSuite(data.id);
  populateSandboxEndpoints(data.endpoints || []);
  setupExportLinks(data.id);
  loadAdbDevices();
}

// ========================================================
// 5. Flowchart Canvas & Bezier Connectors (View 1)
// ========================================================
function renderFlowNodes(nodes) {
  const nodesLayer = document.getElementById('nodesLayer');
  const connectionsSvg = document.getElementById('connectionsSvg');
  if (!nodesLayer || !connectionsSvg) return;

  nodesLayer.innerHTML = '';
  connectionsSvg.innerHTML = '';

  const nodePositions = [];
  const startXPos = 60;
  const spacingX = 350;
  const startYPos = 140;

  nodes.forEach((node, i) => {
    const yOffset = (i % 2 === 1) ? 50 : 0;
    const posX = startXPos + (i * spacingX);
    const posY = startYPos + yOffset;
    nodePositions.push({ x: posX, y: posY, width: 280, height: 180 });

    const card = document.createElement('div');
    card.className = 'n8n-node';
    card.id = `node-${node.id}`;
    card.style.left = `${posX}px`;
    card.style.top = `${posY}px`;

    const iconSvg = SVG_ICONS[node.icon] || SVG_ICONS.Rocket;
    const badgeColor = node.badgeColor || '#6366f1';

    card.innerHTML = `
      ${i > 0 ? `<div class="port-pin port-input" style="border-color: ${badgeColor};"></div>` : ''}
      <div class="node-top-row">
        <div class="node-icon" style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}55;">
          ${iconSvg}
        </div>
        <span class="node-badge" style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}55;">
          ${escapeHtml(node.badge || 'Flow')}
        </span>
      </div>
      <h4 class="node-title">${escapeHtml(node.title || '')}</h4>
      <p class="node-subtitle">${escapeHtml(node.subtitle || '')}</p>
      <p class="node-summary">${escapeHtml(node.description || '')}</p>
      <div class="node-footer">
        <span>Step ${i + 1} of ${nodes.length}</span>
        <span style="color: ${badgeColor}; font-weight: 600;">Inspect ➔</span>
      </div>
      ${i < nodes.length - 1 ? `<div class="port-pin port-output" style="border-color: ${badgeColor};"></div>` : ''}
    `;

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.n8n-node').forEach(n => n.classList.remove('selected'));
      card.classList.add('selected');
      openInspectorDrawer(node, i + 1);
    });

    nodesLayer.appendChild(card);
  });

  // Render curved bezier connectors
  let svgPaths = '';
  for (let i = 0; i < nodePositions.length - 1; i++) {
    const from = nodePositions[i];
    const to = nodePositions[i + 1];
    const x1 = from.x + from.width;
    const y1 = from.y + 90;
    const x2 = to.x;
    const y2 = to.y + 90;
    const controlX = (x1 + x2) / 2;
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

function setupCanvasPanZoom() {
  const canvasContainer = document.getElementById('canvasContainer');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetView = document.getElementById('btnResetView');

  if (!canvasContainer) return;

  canvasContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('.n8n-node') || e.target.closest('.canvas-controls-overlay') || e.target.closest('.inspector-drawer')) return;
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

  canvasContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    scale = Math.min(Math.max(scale * zoomFactor, 0.4), 2.0);
    if (btnResetView) btnResetView.textContent = `${Math.round(scale * 100)}%`;
    updateCanvasTransform();
  }, { passive: false });

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      scale = Math.min(scale * 1.15, 2.0);
      if (btnResetView) btnResetView.textContent = `${Math.round(scale * 100)}%`;
      updateCanvasTransform();
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      scale = Math.max(scale * 0.85, 0.4);
      if (btnResetView) btnResetView.textContent = `${Math.round(scale * 100)}%`;
      updateCanvasTransform();
    });
  }

  if (btnResetView) {
    btnResetView.addEventListener('click', resetCanvasView);
  }

  canvasContainer.addEventListener('click', (e) => {
    if (!e.target.closest('.n8n-node') && !e.target.closest('.inspector-drawer')) {
      const drawer = document.getElementById('inspectorDrawer');
      if (drawer) drawer.classList.remove('open');
      document.querySelectorAll('.n8n-node').forEach(n => n.classList.remove('selected'));
    }
  });
}

function updateCanvasTransform() {
  const canvasWorld = document.getElementById('canvasWorld');
  if (canvasWorld) {
    canvasWorld.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }
}

function resetCanvasView() {
  panX = 60;
  panY = 60;
  scale = 1.0;
  const btnResetView = document.getElementById('btnResetView');
  if (btnResetView) btnResetView.textContent = '100%';
  updateCanvasTransform();
}

// ========================================================
// 6. Node Inspector Drawer
// ========================================================
function setupInspectorDrawer() {
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const btnCopyStepCode = document.getElementById('btnCopyStepCode');

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', () => {
      const drawer = document.getElementById('inspectorDrawer');
      if (drawer) drawer.classList.remove('open');
      document.querySelectorAll('.n8n-node').forEach(n => n.classList.remove('selected'));
    });
  }

  // Drawer tabs
  document.querySelectorAll('.drawer-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.drawer-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.drawer-pane').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.drawerTab);
      if (targetPane) targetPane.style.display = 'block';
    });
  });

  if (btnCopyStepCode) {
    btnCopyStepCode.addEventListener('click', () => {
      const codeEl = document.getElementById('drawerStepCode');
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent);
        showToast('Step code copied to clipboard!');
      }
    });
  }
}

function openInspectorDrawer(node, stepIndex) {
  const drawer = document.getElementById('inspectorDrawer');
  if (!drawer) return;
  drawer.classList.add('open');

  const drawerIcon = document.getElementById('drawerIcon');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerSubtitle = document.getElementById('drawerSubtitle');
  const drawerDescription = document.getElementById('drawerDescription');
  const drawerMetrics = document.getElementById('drawerMetrics');
  const drawerEndpointContent = document.getElementById('drawerEndpointContent');
  const drawerStepCode = document.getElementById('drawerStepCode');
  const drawerSecurityContent = document.getElementById('drawerSecurityContent');

  if (drawerIcon) {
    drawerIcon.innerHTML = SVG_ICONS[node.icon] || SVG_ICONS.Rocket;
    drawerIcon.style.color = node.badgeColor || '#6366f1';
  }
  if (drawerTitle) drawerTitle.textContent = `${stepIndex}. ${node.title}`;
  if (drawerSubtitle) drawerSubtitle.textContent = node.subtitle || '';
  if (drawerDescription) drawerDescription.textContent = node.description || '';

  // Overview metrics
  if (drawerMetrics) {
    let metricsHtml = `
      <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.85rem; font-size: 0.85rem;">
        <div style="color: var(--text-muted); margin-bottom: 0.25rem;">Node Category:</div>
        <strong style="color: ${node.badgeColor || '#6366f1'}; font-family: var(--font-mono);">${node.badge || 'Flow'} (${node.type || 'step'})</strong>
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
  }

  // Endpoints tab
  const endpoints = currentAnalysis?.endpoints || [];
  const relevantEndpoint = endpoints.find(e => 
    (node.type === 'authStep' && e.category === 'auth') ||
    (node.type === 'apiEndpoint' && (e.category === 'payment' || e.category === 'user' || e.category === 'core'))
  ) || endpoints[0];

  if (drawerEndpointContent) {
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
  }

  // Code Tab
  if (drawerStepCode) {
    drawerStepCode.textContent = generateStepSnippet(node, relevantEndpoint);
  }

  // Security Tab
  if (drawerSecurityContent) {
    drawerSecurityContent.innerHTML = generateStepBypass(node);
  }
}

function generateStepSnippet(node, ep) {
  if (node.type === 'authStep') {
    return `// 🔑 Step: Authenticate & Acquire JWT\nconst res = await fetch('${ep ? ep.url : 'https://api.example.com/auth/login'}', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json',\n    'X-App-Version': '${currentAnalysis?.app?.versionName || '1.0'}',\n    'X-Timestamp': Date.now().toString()\n  },\n  body: JSON.stringify({ username: 'user_01', pin: '1234' })\n});\nconst data = await res.json();\nconsole.log('Access Token:', data.accessToken);`;
  }
  if (node.type === 'cryptoStep') {
    return `// ⚡ Step: Calculate JNI Signature\nimport crypto from 'node:crypto';\n\nfunction computeHmacSignature(payload: string, secretKey: string): string {\n  const timestamp = Math.floor(Date.now() / 1000).toString();\n  return crypto.createHmac('sha256', secretKey)\n    .update(\`\${timestamp}:\${payload}\`)\n    .digest('hex');\n}`;
  }
  return `// 🚀 Step: ${node.title}\nconst res = await fetch('${ep ? ep.url : 'https://api.example.com/v2/action'}', {\n  headers: { 'Authorization': 'Bearer <token>' }\n});\nconst result = await res.json();\nconsole.log('Result:', result);`;
}

function generateStepBypass(node) {
  if (node.type === 'securityGate' || (node.title && node.title.toLowerCase().includes('root'))) {
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
});</code></pre>
    `;
  }
  return `<p style="color: var(--text-muted); font-size: 0.85rem;">Standard execution flow. No aggressive anti-tampering bypass required on this step.</p>`;
}

// ========================================================
// 7. Decompiled Source Tree & Editor (View 2)
// ========================================================
function setupSourceExplorer() {
  const sourceFileSearch = document.getElementById('sourceFileSearch');
  const btnCopyCurrentFile = document.getElementById('btnCopyCurrentFile');
  const btnSaveCurrentFile = document.getElementById('btnSaveCurrentFile');

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
      const display = document.getElementById('sourceCodeDisplay');
      if (display) {
        navigator.clipboard.writeText(display.value);
        showToast(`Copied ${activeSourceFilePath} to clipboard!`);
      }
    });
  }

  if (btnSaveCurrentFile) {
    btnSaveCurrentFile.addEventListener('click', async () => {
      if (!currentAnalysis) return;
      const display = document.getElementById('sourceCodeDisplay');
      if (!display) return;
      showToast('Saving changes into memory...');
      try {
        const res = await fetch(`/api/sources/${currentAnalysis.id}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: activeSourceFilePath,
            content: display.value,
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

async function loadProjectSources(analysisId) {
  try {
    const res = await fetch(`/api/sources/${analysisId}`);
    if (!res.ok) return;
    const data = await res.json();
    currentSourcesData = data;

    const sourcesTotalFilesBadge = document.getElementById('sourcesTotalFilesBadge');
    if (sourcesTotalFilesBadge) {
      sourcesTotalFilesBadge.textContent = `${data.fileCount} Files`;
    }

    renderSourcesTree(data.tree);

    const defaultFile = data.availableFiles?.includes('AndroidManifest.xml') 
      ? 'AndroidManifest.xml' 
      : data.availableFiles?.[0];

    if (defaultFile) {
      activeSourceFilePath = defaultFile;
      loadSourceFileContent(analysisId, defaultFile);
    }
  } catch (err) {
    console.error('Failed to load project sources:', err);
  }
}

function renderSourcesTree(nodes, filterText = '') {
  const container = document.getElementById('sourcesTreeContainer');
  if (!container) return;
  container.innerHTML = '';
  buildTreeElements(nodes, filterText, container, 0);
}

function buildTreeElements(nodes, filterText, container, depth) {
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
      <span style="overflow: hidden; text-overflow: ellipsis;">${escapeHtml(node.name)}</span>
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
      buildTreeElements(node.children, filterText, childContainer, depth + 1);
      container.appendChild(childContainer);
    }
  });
}

function matchesFilter(node, query) {
  if (node.name.toLowerCase().includes(query) || (node.path && node.path.toLowerCase().includes(query))) return true;
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

    const currentFilePath = document.getElementById('currentFilePath');
    const currentFileLang = document.getElementById('currentFileLang');
    const sourceCodeDisplay = document.getElementById('sourceCodeDisplay');
    const editorStatusInfo = document.getElementById('editorStatusInfo');

    if (currentFilePath) currentFilePath.textContent = data.path;
    if (currentFileLang) currentFileLang.textContent = data.path.split('.').pop().toUpperCase();
    if (sourceCodeDisplay) sourceCodeDisplay.value = data.content;

    const lines = data.content.split('\n').length;
    const kb = (new Blob([data.content]).size / 1024).toFixed(1);
    if (editorStatusInfo) editorStatusInfo.textContent = `Lines: ${lines} • Size: ${kb} KB`;
  } catch (err) {
    console.error('Failed to load file content:', err);
  }
}

// ========================================================
// 8. OWASP SAST Security Auditor (View 3)
// ========================================================
async function loadAuditReport(analysisId) {
  try {
    const res = await fetch(`/api/audit/${analysisId}`);
    if (!res.ok) return;
    const report = await res.json();

    const auditGradeCircle = document.getElementById('auditGradeCircle');
    const auditScorePoints = document.getElementById('auditScorePoints');
    const auditRiskBadge = document.getElementById('auditRiskBadge');
    const auditCountCritical = document.getElementById('auditCountCritical');
    const auditCountHigh = document.getElementById('auditCountHigh');
    const auditCountMedium = document.getElementById('auditCountMedium');
    const auditCountLow = document.getElementById('auditCountLow');
    const auditVulnsList = document.getElementById('auditVulnsList');

    if (auditGradeCircle) auditGradeCircle.textContent = report.grade || 'A';
    if (auditScorePoints) auditScorePoints.textContent = `Score: ${report.score || 90}/100`;
    if (auditRiskBadge) {
      auditRiskBadge.textContent = `${report.riskLevel || 'LOW'} RISK`;
      auditRiskBadge.style.background = report.riskLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : report.riskLevel === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)';
      auditRiskBadge.style.color = report.riskLevel === 'CRITICAL' ? '#f87171' : report.riskLevel === 'HIGH' ? '#fbbf24' : '#34d399';
    }

    if (auditCountCritical) auditCountCritical.textContent = report.metrics?.critical || 0;
    if (auditCountHigh) auditCountHigh.textContent = report.metrics?.high || 0;
    if (auditCountMedium) auditCountMedium.textContent = report.metrics?.medium || 0;
    if (auditCountLow) auditCountLow.textContent = report.metrics?.low || 0;

    if (auditVulnsList) {
      auditVulnsList.innerHTML = '';
      (report.vulnerabilities || []).forEach(v => {
        const card = document.createElement('div');
        card.className = 'vuln-item-card';
        card.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span class="badge-tag" style="background: rgba(239, 68, 68, 0.2); color: #f87171;">${v.severity}</span>
              <span style="font-size: 0.75rem; color: var(--accent-cyan); font-family: var(--font-mono); font-weight: 700;">OWASP ${v.category}</span>
              <strong style="color: #fff; font-size: 0.95rem;">${escapeHtml(v.title)}</strong>
            </div>
            <span class="badge-tag" style="background: rgba(255,255,255,0.06); color: #fff; font-family: var(--font-mono); font-size: 0.75rem;">CVSS ${v.cvss}</span>
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

// ========================================================
// 9. Sensitive Data & Secret Vault (View 4)
// ========================================================
function setupSecretVault() {
  const secretSearchInput = document.getElementById('secretSearchInput');
  const btnAiRedactAllSecrets = document.getElementById('btnAiRedactAllSecrets');

  if (secretSearchInput) {
    secretSearchInput.addEventListener('input', () => {
      if (currentSecretsReport) renderSecrets(currentSecretsReport);
    });
  }

  if (btnAiRedactAllSecrets) {
    btnAiRedactAllSecrets.addEventListener('click', () => {
      switchView('view-agent');
      const agentInput = document.getElementById('agentPromptInput');
      if (agentInput) {
        agentInput.value = 'احذف وعقم جميع المفاتيح السرية الحساسة المستخرجة من المشروع، واستبدلها بمفاتيح بيئة ديناميكية، ثم أعد بناء التطبيق';
        agentInput.focus();
      }
    });
  }
}

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
  const secretTotalCount = document.getElementById('secretTotalCount');
  const secretCriticalCount = document.getElementById('secretCriticalCount');
  const secretHighCount = document.getElementById('secretHighCount');
  const secretRiskLevel = document.getElementById('secretRiskLevel');
  const secretOverallBadge = document.getElementById('secretOverallBadge');
  const secretListContainer = document.getElementById('secretListContainer');
  const secretSearchInput = document.getElementById('secretSearchInput');

  if (secretTotalCount) secretTotalCount.textContent = report.totalSecrets || 0;
  if (secretCriticalCount) secretCriticalCount.textContent = report.criticalCount || 0;
  if (secretHighCount) secretHighCount.textContent = report.highCount || 0;
  if (secretRiskLevel) {
    secretRiskLevel.textContent = report.overallRisk || 'LOW';
    secretRiskLevel.style.color = report.overallRisk === 'CRITICAL' ? '#ef4444' : report.overallRisk === 'HIGH' ? '#f59e0b' : '#10b981';
  }
  if (secretOverallBadge) {
    secretOverallBadge.textContent = `${report.totalSecrets || 0} Detected`;
    secretOverallBadge.style.background = (report.totalSecrets > 0) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    secretOverallBadge.style.color = (report.totalSecrets > 0) ? '#f87171' : '#34d399';
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
      <div style="text-align: center; padding: 2.5rem; background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: 12px; color: var(--text-muted);">
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
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1.1rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="badge-tag" style="background: ${sevColor}22; color: ${sevColor}; font-weight: 700;">${s.severity}</span>
            <h4 style="font-size: 1rem; font-weight: 700; color: #fff;">${escapeHtml(s.title)}</h4>
          </div>
          <span class="badge-tag" style="background: rgba(255, 255, 255, 0.05); color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.72rem;">
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

// ========================================================
// 10. Native ELF & JNI Inspector (View 5)
// ========================================================
async function loadElfAnalysis(analysisId) {
  try {
    const res = await fetch(`/api/elf/${analysisId}`);
    if (!res.ok) return;
    const data = await res.json();

    const elfTotalLibsBadge = document.getElementById('elfTotalLibsBadge');
    const elfContentContainer = document.getElementById('elfContentContainer');

    if (elfTotalLibsBadge) elfTotalLibsBadge.textContent = `${data.totalLibraries || 0} Shared Objects (.so)`;
    if (!elfContentContainer) return;

    if (!data.libraries || data.libraries.length === 0) {
      elfContentContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: 12px; color: var(--text-muted);">
          <span style="font-size: 2rem;">⚙️</span>
          <h4 style="font-size: 1.1rem; color: #fff; margin-top: 0.5rem;">Pure Java / Kotlin Application</h4>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">No native C/C++ shared objects (.so) bundled in this APK.</p>
        </div>
      `;
      return;
    }

    elfContentContainer.innerHTML = data.libraries.map(lib => `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(168, 85, 247, 0.15); color: #c084fc; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
              ⚙️
            </div>
            <div>
              <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff;">${escapeHtml(lib.filename)}</h4>
              <p style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">${lib.architecture} • ${lib.elfHeader?.bitness || '64-bit'} • ${lib.elfHeader?.machine || 'AArch64'} • ${(lib.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <span class="badge-tag" style="background: ${lib.securityMitigations?.hasStackCanary ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${lib.securityMitigations?.hasStackCanary ? '#34d399' : '#f87171'};">
              ${lib.securityMitigations?.hasStackCanary ? '🛡️ Stack Canary' : '⚠️ No Stack Canary'}
            </span>
            <span class="badge-tag" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">
              ${lib.securityMitigations?.hasJniOnLoad ? 'JNI_OnLoad' : 'Manual Bind'}
            </span>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <h5 style="font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">Exported JNI Bridge Functions (${lib.exportedJniMethods?.length || 0}):</h5>
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${(lib.exportedJniMethods || []).map(m => `
              <div style="background: #060911; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.45rem 0.75rem; font-family: var(--font-mono); font-size: 0.78rem; display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #67e8f9;">${escapeHtml(m.rawSymbol)}</span>
                <span style="color: var(--text-muted); font-size: 0.72rem;">${escapeHtml(m.javaClass)}.${escapeHtml(m.javaMethod)}()</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <h5 style="font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem;">Linked Dynamic Libraries:</h5>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
            ${(lib.importedLibraries || []).map(dep => `
              <span class="badge-tag" style="background: rgba(255, 255, 255, 0.05); color: #cbd5e1; font-family: var(--font-mono); font-size: 0.72rem;">
                ${escapeHtml(dep)}
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load ELF analysis:', err);
  }
}

// ========================================================
// 11. Deep Link & Intent-Filter Matrix (View 6)
// ========================================================
async function loadIntentMatrix(analysisId) {
  try {
    const res = await fetch(`/api/intent/${analysisId}`);
    if (!res.ok) return;
    const data = await res.json();

    const intentTotalCount = document.getElementById('intentTotalCount');
    const intentCustomCount = document.getElementById('intentCustomCount');
    const intentAppLinksCount = document.getElementById('intentAppLinksCount');
    const intentUnverifiedCount = document.getElementById('intentUnverifiedCount');
    const intentTotalBadge = document.getElementById('intentTotalBadge');
    const intentListContainer = document.getElementById('intentListContainer');

    if (intentTotalCount) intentTotalCount.textContent = data.totalDeepLinks || 0;
    if (intentCustomCount) intentCustomCount.textContent = data.customSchemeCount || 0;
    if (intentAppLinksCount) intentAppLinksCount.textContent = data.appLinksCount || 0;
    if (intentUnverifiedCount) intentUnverifiedCount.textContent = data.unverifiedCount || 0;
    if (intentTotalBadge) intentTotalBadge.textContent = `${data.totalDeepLinks || 0} Active Schemes`;

    if (!intentListContainer) return;

    intentListContainer.innerHTML = (data.deepLinks || []).map(dl => {
      const riskColor = dl.riskLevel === 'HIGH' ? '#ef4444' : dl.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981';
      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1.1rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span class="badge-tag" style="background: ${riskColor}22; color: ${riskColor}; font-weight: 700;">${dl.riskLevel} RISK</span>
              <code style="font-size: 0.95rem; color: #fff; font-weight: 700;">${escapeHtml(dl.sampleUri)}</code>
            </div>
            <span class="badge-tag" style="background: ${dl.hasAutoVerify ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${dl.hasAutoVerify ? '#34d399' : '#f87171'}; font-size: 0.72rem;">
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

          ${(dl.vulnerabilities || []).map(v => `
            <div style="background: rgba(239, 68, 68, 0.06); border-left: 3px solid ${riskColor}; padding: 0.45rem 0.75rem; border-radius: 4px; font-size: 0.8rem; margin-top: 0.35rem;">
              <strong style="color: ${riskColor};">${escapeHtml(v.title)}:</strong> <span style="color: var(--text-secondary);">${escapeHtml(v.description)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load intent matrix:', err);
  }
}

window.runIntentInAdb = function(uri) {
  switchView('view-adb');
  executeAdb('custom', `adb shell am start -W -a android.intent.action.VIEW -d "${uri}" ${currentAnalysis?.app?.packageName || 'com.app'}`);
};

// ========================================================
// 12. APK Modding & 1-Click Rebuilder Studio (View 7)
// ========================================================
function setupRebuilderStudio() {
  const btnTriggerRebuild = document.getElementById('btnTriggerRebuild');
  const patchRoot = document.getElementById('patchRoot');
  const patchSsl = document.getElementById('patchSsl');
  const patchDebug = document.getElementById('patchDebug');
  const patchRedirect = document.getElementById('patchRedirect');
  const inputRedirectUrl = document.getElementById('inputRedirectUrl');
  const patchTelemetry = document.getElementById('patchTelemetry');
  const rebuildLogs = document.getElementById('rebuildLogs');
  const rebuildOutputCard = document.getElementById('rebuildOutputCard');
  const rebuildSuccessTitle = document.getElementById('rebuildSuccessTitle');
  const rebuildMetaInfo = document.getElementById('rebuildMetaInfo');
  const btnDownloadRebuiltApk = document.getElementById('btnDownloadRebuiltApk');
  const rebuildAdbCmd = document.getElementById('rebuildAdbCmd');
  const btnCopyAdbCmd = document.getElementById('btnCopyAdbCmd');

  if (!btnTriggerRebuild) return;

  btnTriggerRebuild.addEventListener('click', async () => {
    if (!currentAnalysis) {
      showToast('⚠️ No active application loaded. Please upload an APK first.');
      return;
    }

    btnTriggerRebuild.disabled = true;
    btnTriggerRebuild.innerHTML = `<span style="animation: spin 1s linear infinite; display: inline-block;">⚙️</span> Rebuilding & Signing...`;
    if (rebuildLogs) rebuildLogs.innerHTML = `<div class="term-line" style="color: #a5b4fc;">[INITIALIZING] Starting ApkFlow Rebuilder & Pure-TS Signer...</div>`;
    if (rebuildOutputCard) rebuildOutputCard.style.display = 'none';

    try {
      const payload = {
        id: currentAnalysis.id,
        bypassRoot: patchRoot?.checked ?? true,
        bypassSsl: patchSsl?.checked ?? true,
        makeDebuggable: patchDebug?.checked ?? true,
        redirectApiUrl: patchRedirect?.checked ? inputRedirectUrl?.value?.trim() : undefined,
        removeTelemetry: patchTelemetry?.checked ?? false,
      };

      const res = await fetch('/api/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (rebuildLogs) {
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
      }

      if (rebuildOutputCard) rebuildOutputCard.style.display = 'block';
      if (rebuildSuccessTitle) rebuildSuccessTitle.textContent = data.filename;
      if (rebuildMetaInfo) rebuildMetaInfo.textContent = `Size: ${(data.size / 1024 / 1024).toFixed(2)} MB • SHA-256: ${data.sha256.substring(0, 16)}...`;
      if (btnDownloadRebuiltApk) {
        btnDownloadRebuiltApk.href = data.downloadUrl;
        btnDownloadRebuiltApk.download = data.filename;
      }
      if (rebuildAdbCmd) rebuildAdbCmd.textContent = `adb install -r ${data.filename}`;

      showToast(`🎉 Modded APK Ready: ${data.filename}`);
    } catch (err) {
      console.error('Rebuild failed:', err);
      if (rebuildLogs) rebuildLogs.innerHTML += `<div class="term-line" style="color: #ef4444;">[ERROR] ${err.message}</div>`;
      alert(`Rebuild error: ${err.message}`);
    } finally {
      btnTriggerRebuild.disabled = false;
      btnTriggerRebuild.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Rebuild & Sign APK Now`;
    }
  });

  if (btnCopyAdbCmd && rebuildAdbCmd) {
    btnCopyAdbCmd.addEventListener('click', () => {
      navigator.clipboard.writeText(rebuildAdbCmd.textContent);
      showToast('Copied ADB command!');
    });
  }
}

// ========================================================
// 13. Frida Dynamic Instrumentation Studio (View 8)
// ========================================================
function setupFridaStudio() {
  const btnCopyFridaScript = document.getElementById('btnCopyFridaScript');
  const btnDownloadFridaScript = document.getElementById('btnDownloadFridaScript');

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
      const fridaCodeArea = document.getElementById('fridaCodeArea');
      if (fridaCodeArea) {
        navigator.clipboard.writeText(fridaCodeArea.value);
        showToast('Frida script copied to clipboard!');
      }
    });
  }

  if (btnDownloadFridaScript) {
    btnDownloadFridaScript.addEventListener('click', (e) => {
      e.preventDefault();
      const fridaCodeArea = document.getElementById('fridaCodeArea');
      if (!fridaCodeArea) return;
      const blob = new Blob([fridaCodeArea.value], { type: 'application/javascript' });
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
      const targetId = btn.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        navigator.clipboard.writeText(targetEl.textContent);
        showToast('Command copied!');
      }
    });
  });
}

async function loadFridaSuite(analysisId) {
  try {
    const res = await fetch(`/api/frida/${analysisId}`);
    if (!res.ok) return;
    const suite = await res.json();
    currentFridaSuite = suite;

    const fridaCmdSpawn = document.getElementById('fridaCmdSpawn');
    if (fridaCmdSpawn) fridaCmdSpawn.textContent = suite.cliCommands?.usbSpawn || `frida -U -f ${currentAnalysis?.app?.packageName || 'app'} -l agent.js`;

    updateFridaDisplay();
  } catch (err) {
    console.error('Failed to load Frida suite:', err);
  }
}

function updateFridaDisplay() {
  if (!currentFridaSuite) return;

  const fridaCodeArea = document.getElementById('fridaCodeArea');
  const fridaScriptLabel = document.getElementById('fridaScriptLabel');

  let code = currentFridaSuite.fullScript || '';
  let label = 'Comprehensive All-in-One Instrumentation Agent';

  if (currentFridaModule === 'root') {
    code = currentFridaSuite.modules?.rootBypass || '';
    label = 'RootBeer & System Anti-Root Hook';
  } else if (currentFridaModule === 'ssl') {
    code = currentFridaSuite.modules?.sslUnpinning || '';
    label = 'Universal SSL Pinning Bypass';
  } else if (currentFridaModule === 'crypto') {
    code = currentFridaSuite.modules?.cryptoSpy || '';
    label = 'Real-Time Cipher & Key Spy';
  } else if (currentFridaModule === 'native') {
    code = currentFridaSuite.modules?.nativeJni || '';
    label = 'Native C++ JNI Memory Hook';
  } else if (currentFridaModule === 'tracer') {
    code = currentFridaSuite.modules?.methodTracer || '';
    label = 'Activity Lifecycle Tracer';
  }

  if (fridaCodeArea) fridaCodeArea.value = code;
  if (fridaScriptLabel) fridaScriptLabel.textContent = `Frida Script — ${label}`;
}

// ========================================================
// 14. Interactive API Sandbox & Mock Gateway (View 9)
// ========================================================
function setupSandboxGateway() {
  const sandboxEndpointSelect = document.getElementById('sandboxEndpointSelect');
  const sandboxMethodSelect = document.getElementById('sandboxMethodSelect');
  const sandboxUrlInput = document.getElementById('sandboxUrlInput');
  const sandboxRequestBody = document.getElementById('sandboxRequestBody');
  const btnExecuteSandboxRequest = document.getElementById('btnExecuteSandboxRequest');
  const sandboxResponseStatus = document.getElementById('sandboxResponseStatus');
  const sandboxResponseLatency = document.getElementById('sandboxResponseLatency');
  const sandboxResponseBody = document.getElementById('sandboxResponseBody');

  if (sandboxEndpointSelect) {
    sandboxEndpointSelect.addEventListener('change', () => {
      const idx = sandboxEndpointSelect.value;
      if (idx === '' || !currentAnalysis?.endpoints[idx]) return;

      const ep = currentAnalysis.endpoints[idx];
      if (sandboxMethodSelect) sandboxMethodSelect.value = ep.method;
      if (sandboxUrlInput) sandboxUrlInput.value = ep.url;

      let payload = ep.samplePayload || {};
      if (sandboxRequestBody) {
        sandboxRequestBody.value = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
      }
    });
  }

  if (btnExecuteSandboxRequest) {
    btnExecuteSandboxRequest.addEventListener('click', async () => {
      const url = sandboxUrlInput?.value?.trim() || '';
      const method = sandboxMethodSelect?.value || 'GET';

      if (!url) {
        showToast('⚠️ Please enter or select a target URL');
        return;
      }

      btnExecuteSandboxRequest.disabled = true;
      btnExecuteSandboxRequest.innerHTML = `<span style="animation: spin 1s linear infinite; display: inline-block;">⚡</span> Executing...`;
      if (sandboxResponseBody) sandboxResponseBody.textContent = 'Executing request in sandbox...';

      let parsedBody = null;
      if (['POST', 'PUT', 'PATCH'].includes(method) && sandboxRequestBody) {
        try {
          if (sandboxRequestBody.value.trim()) {
            parsedBody = JSON.parse(sandboxRequestBody.value.trim());
          }
        } catch {
          parsedBody = sandboxRequestBody.value.trim();
        }
      }

      try {
        const res = await fetch('/api/mock/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            method,
            headers: { 'Content-Type': 'application/json' },
            body: parsedBody,
            mode: 'sandbox',
          }),
        });

        const data = await res.json();
        if (sandboxResponseStatus) {
          sandboxResponseStatus.textContent = `${data.status} ${data.statusText || 'OK'}`;
          sandboxResponseStatus.style.background = (data.status >= 200 && data.status < 300) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
          sandboxResponseStatus.style.color = (data.status >= 200 && data.status < 300) ? '#34d399' : '#f87171';
        }
        if (sandboxResponseLatency) sandboxResponseLatency.textContent = `${data.latencyMs || 45} ms`;
        if (sandboxResponseBody) sandboxResponseBody.textContent = JSON.stringify(data.data || data, null, 2);

        showToast(`Request complete: ${data.status}`);
      } catch (err) {
        console.error('Sandbox request failed:', err);
        if (sandboxResponseBody) sandboxResponseBody.textContent = `Error: ${err.message}`;
      } finally {
        btnExecuteSandboxRequest.disabled = false;
        btnExecuteSandboxRequest.innerHTML = 'Execute Request';
      }
    });
  }
}

function populateSandboxEndpoints(endpoints) {
  const sandboxEndpointSelect = document.getElementById('sandboxEndpointSelect');
  if (!sandboxEndpointSelect) return;
  sandboxEndpointSelect.innerHTML = '<option value="">Select an endpoint to pre-fill...</option>';

  endpoints.forEach((ep, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `[${ep.method}] ${ep.path} (${ep.category})`;
    sandboxEndpointSelect.appendChild(opt);
  });
}

// ========================================================
// 15. ADB Live Device Bridge (View 10)
// ========================================================
function setupAdbBridge() {
  const btnAdbLaunchApp = document.getElementById('btnAdbLaunchApp');
  const btnAdbStopApp = document.getElementById('btnAdbStopApp');
  const btnAdbClearData = document.getElementById('btnAdbClearData');
  const btnAdbInstallApk = document.getElementById('btnAdbInstallApk');
  const btnAdbStartFrida = document.getElementById('btnAdbStartFrida');
  const btnRefreshLogcat = document.getElementById('btnRefreshLogcat');
  const btnClearLogcat = document.getElementById('btnClearLogcat');

  if (btnAdbLaunchApp) btnAdbLaunchApp.addEventListener('click', () => executeAdb('launch', currentAnalysis?.app?.mainActivity));
  if (btnAdbStopApp) btnAdbStopApp.addEventListener('click', () => executeAdb('stop'));
  if (btnAdbClearData) btnAdbClearData.addEventListener('click', () => executeAdb('clear'));
  if (btnAdbInstallApk) btnAdbInstallApk.addEventListener('click', () => executeAdb('install'));
  if (btnAdbStartFrida) btnAdbStartFrida.addEventListener('click', () => executeAdb('frida-start', 'apkflow_agent.js'));
  if (btnRefreshLogcat) btnRefreshLogcat.addEventListener('click', loadLogcatStream);
  if (btnClearLogcat) btnClearLogcat.addEventListener('click', () => {
    const out = document.getElementById('adbLogcatOutput');
    if (out) out.innerHTML = '';
  });

  loadLogcatStream();
}

async function loadAdbDevices() {
  try {
    const res = await fetch('/api/adb/devices');
    if (!res.ok) return;
    const devices = await res.json();
    if (devices.length > 0) {
      const dev = devices[0];
      const adbDeviceName = document.getElementById('adbDeviceName');
      const adbDeviceDetails = document.getElementById('adbDeviceDetails');
      if (adbDeviceName) adbDeviceName.textContent = `${dev.model} (${dev.type === 'virtual' ? 'Virtual Emulator' : 'USB Device'})`;
      if (adbDeviceDetails) adbDeviceDetails.textContent = `${dev.id} • ${dev.androidVersion} (API ${dev.apiLevel}) • ${dev.abi} • ${dev.state.toUpperCase()}`;
    }
  } catch (err) {
    console.error('Failed to load ADB devices:', err);
  }
}

async function executeAdb(action, extraParam) {
  const pkg = currentAnalysis?.app?.packageName || 'com.app';
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
  const out = document.getElementById('adbLogcatOutput');
  if (!out) return;
  const line = document.createElement('div');
  line.style.borderLeft = '3px solid var(--accent-emerald)';
  line.style.paddingLeft = '0.5rem';
  line.style.marginBottom = '0.5rem';
  line.style.color = '#a7f3d0';
  line.textContent = text;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}

async function loadLogcatStream() {
  const pkg = currentAnalysis?.app?.packageName || 'com.app';
  try {
    const res = await fetch(`/api/adb/logcat/${pkg}`);
    if (!res.ok) return;
    const logs = await res.json();
    const out = document.getElementById('adbLogcatOutput');
    if (!out) return;
    out.innerHTML = '';

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
      out.appendChild(row);
    });
    out.scrollTop = out.scrollHeight;
  } catch (err) {
    console.error('Failed to load logcat:', err);
  }
}

// ========================================================
// 16. Autonomous AI Agent Copilot (View 11)
// ========================================================
function setupAiAgent() {
  const btnSendAgentPrompt = document.getElementById('btnSendAgentPrompt');
  const agentPromptInput = document.getElementById('agentPromptInput');

  if (btnSendAgentPrompt) {
    btnSendAgentPrompt.addEventListener('click', sendAgentPrompt);
  }

  if (agentPromptInput) {
    agentPromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAgentPrompt();
      }
    });
  }

  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (agentPromptInput) {
        agentPromptInput.value = chip.textContent.trim();
        sendAgentPrompt();
      }
    });
  });
}

async function sendAgentPrompt() {
  const input = document.getElementById('agentPromptInput');
  const container = document.getElementById('agentMessagesContainer');
  if (!input || !container) return;

  const promptText = input.value.trim();
  if (!promptText || !currentAnalysis) {
    if (!currentAnalysis) showToast('⚠️ Please upload an APK first to interact with Copilot.');
    return;
  }

  input.value = '';

  // Render User Message
  const userRow = document.createElement('div');
  userRow.className = 'chat-msg user';
  userRow.innerHTML = `
    <div class="chat-avatar" style="background: var(--accent-indigo);">ME</div>
    <div class="chat-bubble user-bubble">${escapeHtml(promptText)}</div>
  `;
  container.appendChild(userRow);

  // Render Thinking Row
  const thinkingRow = document.createElement('div');
  thinkingRow.className = 'chat-msg bot';
  thinkingRow.id = 'agentThinkingRow';
  thinkingRow.innerHTML = `
    <div class="chat-avatar">AI</div>
    <div class="chat-bubble" style="display: flex; align-items: center; gap: 0.6rem; color: var(--accent-cyan);">
      <span style="display: inline-block; animation: spin 1s linear infinite;">⚡</span>
      Analyzing DEX bytecode, synthesizing patches, and compiling APK...
    </div>
  `;
  container.appendChild(thinkingRow);
  container.scrollTop = container.scrollHeight;

  try {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentAnalysis.id,
        prompt: promptText,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    thinkingRow.remove();

    const botRow = document.createElement('div');
    botRow.className = 'chat-msg bot';

    let thoughtHtml = '';
    if (data.thoughtProcess && data.thoughtProcess.length > 0) {
      thoughtHtml = `
        <details class="thought-box" open style="margin-top: 0.75rem; background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.6rem 0.85rem;">
          <summary style="font-weight: 600; color: #a5b4fc; cursor: pointer; font-size: 0.85rem;">🧠 Agent Reasoning & Actions (${data.thoughtProcess.length} Steps)</summary>
          <ul style="margin: 0.5rem 0 0 1.25rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6;">
            ${data.thoughtProcess.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
          </ul>
        </details>
      `;
    }

    let diffsHtml = '';
    if (data.fileDiffs && data.fileDiffs.length > 0) {
      diffsHtml = data.fileDiffs.map(df => `
        <div style="margin-top: 0.75rem; background: #060911; border: 1px solid var(--border-subtle); border-radius: 8px; overflow: hidden;">
          <div style="background: rgba(255,255,255,0.03); padding: 0.4rem 0.75rem; font-size: 0.75rem; font-family: var(--font-mono); color: #cbd5e1; display: flex; justify-content: space-between;">
            <span>📄 ${escapeHtml(df.path)}</span>
            <span style="color: var(--accent-emerald);">Synthesized Code Diff</span>
          </div>
          <pre style="margin: 0; padding: 0.75rem; font-family: var(--font-mono); font-size: 0.78rem; overflow-x: auto; color: #6ee7b7;"><code>${escapeHtml(df.unifiedDiff)}</code></pre>
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
              ${(data.rebuiltApk.size / 1024 / 1024).toFixed(2)} MB • Android Debug Signed
            </div>
          </div>
          <a href="${data.rebuiltApk.downloadUrl}" download="${data.rebuiltApk.filename}" class="btn btn-primary" style="text-decoration: none; padding: 0.55rem 1.1rem;">
            Download Modded APK
          </a>
        </div>
      `;
    }

    botRow.innerHTML = `
      <div class="chat-avatar">AI</div>
      <div class="chat-bubble">
        <div>${formatMarkdown(data.summary)}</div>
        ${thoughtHtml}
        ${diffsHtml}
        ${rebuildCardHtml}
      </div>
    `;

    container.appendChild(botRow);
    container.scrollTop = container.scrollHeight;

    loadProjectSources(currentAnalysis.id);

  } catch (err) {
    console.error('Agent chat error:', err);
    thinkingRow.remove();
    const errorRow = document.createElement('div');
    errorRow.className = 'chat-msg bot';
    errorRow.innerHTML = `
      <div class="chat-avatar">AI</div>
      <div class="chat-bubble" style="color: #fca5a5; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25);">
        <strong>Agent Execution Error:</strong> ${escapeHtml(err.message)}
      </div>
    `;
    container.appendChild(errorRow);
  }
}

// ========================================================
// 17. Enterprise Export Hub (View 12)
// ========================================================
function setupExportHub() {
  const btnExportApk = document.getElementById('btnExportApk');
  if (btnExportApk) {
    btnExportApk.addEventListener('click', () => {
      switchView('view-rebuild');
    });
  }
}

function setupExportLinks(analysisId) {
  const btnExportPostman = document.getElementById('btnExportPostman');
  const btnExportOpenApi = document.getElementById('btnExportOpenApi');
  const btnExportReport = document.getElementById('btnExportReport');

  if (btnExportPostman) btnExportPostman.href = `/api/export/${analysisId}/postman`;
  if (btnExportOpenApi) btnExportOpenApi.href = `/api/export/${analysisId}/openapi`;
  if (btnExportReport) btnExportReport.href = `/api/export/${analysisId}/report`;
}

// ========================================================
// 18. Shared Utility Helpers
// ========================================================
function showToast(msg) {
  const toastNotice = document.getElementById('toastNotice');
  const toastMessage = document.getElementById('toastMessage');
  if (!toastNotice || !toastMessage) return;

  toastMessage.textContent = msg;
  toastNotice.classList.add('show');
  setTimeout(() => {
    toastNotice.classList.remove('show');
  }, 2800);
}
window.showToast = showToast;

window.copyText = function(text) {
  navigator.clipboard.writeText(text);
  showToast(`Copied ${text}`);
};

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
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
