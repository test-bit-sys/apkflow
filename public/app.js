// ApkFlow Frontend Logic
let currentAnalysis = null;
let currentLanguage = 'typescript';

// DOM Elements
const metaAppName = document.getElementById('metaAppName');
const metaAppPkg = document.getElementById('metaAppPkg');
const metaAppVersion = document.getElementById('metaAppVersion');
const metaAppFramework = document.getElementById('metaAppFramework');

const flowTrack = document.getElementById('flowTrack');
const nodeInspector = document.getElementById('nodeInspector');
const inspectBadge = document.getElementById('inspectBadge');
const inspectTitle = document.getElementById('inspectTitle');
const inspectSubtitle = document.getElementById('inspectSubtitle');
const inspectContent = document.getElementById('inspectContent');
const btnCloseInspector = document.getElementById('btnCloseInspector');

const recipePlainEnglish = document.getElementById('recipePlainEnglish');
const recipeStepsList = document.getElementById('recipeStepsList');

const codeDisplayArea = document.getElementById('codeDisplayArea');
const codeLangLabel = document.getElementById('codeLangLabel');
const btnCopySnippet = document.getElementById('btnCopySnippet');

const endpointTableBody = document.getElementById('endpointTableBody');
const endpointSearchInput = document.getElementById('endpointSearchInput');
const tabEndpointCount = document.getElementById('tabEndpointCount');

const secRootBadge = document.getElementById('secRootBadge');
const secRootIndicators = document.getElementById('secRootIndicators');
const secRootBypass = document.getElementById('secRootBypass');
const secSslBadge = document.getElementById('secSslBadge');
const secSslIndicators = document.getElementById('secSslIndicators');
const secSslBypass = document.getElementById('secSslBypass');
const cryptoPrimitivesList = document.getElementById('cryptoPrimitivesList');

const dropzone = document.getElementById('dropzone');
const fileUploadInput = document.getElementById('fileUploadInput');
const btnLoadDemo = document.getElementById('btnLoadDemo');
const btnQuickDemo = document.getElementById('btnQuickDemo');
const toastNotice = document.getElementById('toastNotice');
const toastMessage = document.getElementById('toastMessage');

// Icons Map (SVG)
const ICONS = {
  Rocket: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path></svg>`,
  ShieldAlert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  Globe: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  Key: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 2-2 2m-1.5 1.5L14 9l-3 3-2-2-5 5 2 2 3-3 2 2 4.5-4.5"></path><circle cx="7.5" cy="15.5" r="5.5"></circle></svg>`,
  Lock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  CreditCard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  Database: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
};

// Initialize Application
async function init() {
  setupTabs();
  setupCodeTabs();
  setupUpload();

  try {
    // Load default banking demo
    const res = await fetch('/api/demos/demo_fintech_baridi');
    if (res.ok) {
      const data = await res.json();
      renderAnalysis(data);
    }
  } catch (err) {
    console.error('Failed to load initial demo:', err);
  }
}

// Render entire Analysis Result
function renderAnalysis(data) {
  currentAnalysis = data;

  // Header metadata
  metaAppName.textContent = data.app.name;
  metaAppPkg.textContent = data.app.packageName;
  metaAppVersion.textContent = `v${data.app.versionName}`;
  metaAppFramework.textContent = data.app.framework.displayName;

  tabEndpointCount.textContent = data.endpoints.length;

  // Render components
  renderFlow(data.flow);
  renderRecipe(data.recipe);
  renderCodeSnippets(data.recipe.codeSnippets);
  renderEndpoints(data.endpoints);
  renderSecurity(data.security);
}

// 1. Render Flowchart Diagram
function renderFlow(flow) {
  flowTrack.innerHTML = '';
  nodeInspector.style.display = 'none';

  flow.nodes.forEach((node, index) => {
    const card = document.createElement('div');
    card.className = 'node-card';
    card.dataset.nodeId = node.id;

    const iconSvg = ICONS[node.icon] || ICONS.Rocket;

    card.innerHTML = `
      <div class="node-header">
        <div class="node-icon-box" style="background: ${node.badgeColor}22; color: ${node.badgeColor}; border: 1px solid ${node.badgeColor}55;">
          ${iconSvg}
        </div>
        <span class="badge" style="background: ${node.badgeColor}22; color: ${node.badgeColor}; border: 1px solid ${node.badgeColor}44;">
          ${node.badge}
        </span>
      </div>
      <h4 class="node-title">${node.title}</h4>
      <p class="node-subtitle">${node.subtitle}</p>
      <p class="node-desc">${node.description}</p>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.node-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      showNodeInspector(node);
    });

    flowTrack.appendChild(card);

    // Connector Arrow (if not last)
    if (index < flow.nodes.length - 1) {
      const edge = flow.edges[index];
      const connector = document.createElement('div');
      connector.className = 'flow-connector';
      connector.innerHTML = `
        <span class="connector-label">${edge ? edge.label : 'Next'}</span>
        <div class="connector-line"></div>
      `;
      flowTrack.appendChild(connector);
    }
  });
}

// Show Node Inspector
function showNodeInspector(node) {
  nodeInspector.style.display = 'block';
  inspectBadge.textContent = node.badge;
  inspectBadge.style.background = `${node.badgeColor}22`;
  inspectBadge.style.color = node.badgeColor;
  inspectBadge.style.borderColor = `${node.badgeColor}55`;

  inspectTitle.textContent = node.title;
  inspectSubtitle.textContent = node.subtitle;

  let extraHtml = `<p style="margin-bottom: 1rem;">${node.description}</p>`;

  if (node.type === 'securityGate' && node.data.rootDetection) {
    extraHtml += `
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-md); padding: 1rem; margin-top: 0.75rem;">
        <strong style="color: #f87171;">🛡️ Root & Integrity Indicators Found:</strong>
        <ul style="margin-left: 1.25rem; margin-top: 0.5rem; font-size: 0.88rem;">
          ${node.data.rootDetection.indicators.map(i => `<li>${i}</li>`).join('')}
        </ul>
        <div style="margin-top: 0.75rem; font-size: 0.85rem; color: #fca5a5;">
          <strong>Bypass:</strong> ${node.data.rootDetection.bypassTip}
        </div>
      </div>
    `;
  } else if (node.type === 'authStep' && node.data.endpoint) {
    const ep = node.data.endpoint;
    extraHtml += `
      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-md); padding: 1rem; margin-top: 0.75rem;">
        <strong style="color: #fbbf24;">🔑 Auth Endpoint Schema:</strong>
        <p style="font-family: var(--font-mono); font-size: 0.85rem; margin-top: 0.35rem;">${ep.method} ${ep.url}</p>
        <pre style="background: #06080d; padding: 0.75rem; border-radius: 4px; margin-top: 0.5rem; font-size: 0.82rem; overflow-x: auto;"><code>Headers: ${JSON.stringify(ep.headers, null, 2)}</code></pre>
      </div>
    `;
  } else if (node.type === 'cryptoStep') {
    extraHtml += `
      <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--radius-md); padding: 1rem; margin-top: 0.75rem;">
        <strong style="color: #c084fc;">⚡ Cryptographic Pipeline Mechanics:</strong>
        <p style="font-size: 0.88rem; margin-top: 0.35rem;">
          The client computes dynamic request signatures inside native JNI libraries to prevent server-side request forgery.
        </p>
      </div>
    `;
  }

  inspectContent.innerHTML = extraHtml;
  nodeInspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

btnCloseInspector.addEventListener('click', () => {
  nodeInspector.style.display = 'none';
  document.querySelectorAll('.node-card').forEach(c => c.classList.remove('selected'));
});

// 2. Render Reconstruction Blueprint
function renderRecipe(recipe) {
  recipePlainEnglish.textContent = recipe.howItWorksInPlainEnglish;

  recipeStepsList.innerHTML = recipe.stepByStepGuide.map(s => `
    <div class="recipe-step-card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="step-num-badge">${s.step}</span>
          <div>
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; margin-bottom: 0.2rem;">${s.phase}</span>
            <h4 style="font-size: 1.15rem; font-weight: 700;">${s.title}</h4>
          </div>
        </div>
      </div>
      <p style="color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.6;">${s.explanation}</p>
      <div style="background: rgba(16, 185, 129, 0.06); border-left: 3px solid var(--accent-emerald); padding: 0.75rem 1rem; border-radius: 4px; font-size: 0.88rem; color: #a7f3d0; margin-bottom: 0.5rem;">
        <strong>How to Recreate / Intercept:</strong> ${s.howToBuild}
      </div>
      ${s.gotchas ? `
        <div style="background: rgba(245, 158, 11, 0.06); border-left: 3px solid var(--accent-amber); padding: 0.75rem 1rem; border-radius: 4px; font-size: 0.85rem; color: #fde68a;">
          <strong>Security Gotcha:</strong> ${s.gotchas.join(' ')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// 3. Render Code Snippets
function renderCodeSnippets(snippets) {
  const code = snippets[currentLanguage] || snippets.typescript;
  codeDisplayArea.querySelector('code').textContent = code;

  if (currentLanguage === 'typescript') {
    codeLangLabel.textContent = 'TypeScript Client SDK (fetch / node:crypto)';
  } else if (currentLanguage === 'python') {
    codeLangLabel.textContent = 'Python Client Script (requests / hmac)';
  } else {
    codeLangLabel.textContent = 'cURL Terminal Command';
  }
}

// 4. Render Endpoints Table
function renderEndpoints(endpoints) {
  const query = endpointSearchInput.value.toLowerCase().trim();
  const filtered = endpoints.filter(ep => {
    return ep.path.toLowerCase().includes(query) ||
           ep.method.toLowerCase().includes(query) ||
           ep.domain.toLowerCase().includes(query);
  });

  endpointTableBody.innerHTML = filtered.map(ep => {
    const methodClass = `method-${ep.method.toLowerCase()}`;
    return `
      <tr>
        <td><span class="method-badge ${methodClass}">${ep.method}</span></td>
        <td style="font-family: var(--font-mono); font-size: 0.85rem; color: #fff;">${ep.path}</td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${ep.domain}</td>
        <td><span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">${ep.authType}</span></td>
        <td>${ep.requiresSignature ? `<span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c084fc;">HMAC-SHA256</span>` : `<span style="color: var(--text-muted);">None</span>`}</td>
        <td>
          <button class="btn btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="copyEndpoint('${ep.url}')">
            Copy URL
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.copyEndpoint = function(url) {
  navigator.clipboard.writeText(url);
  showToast(`Copied ${url}!`);
};

endpointSearchInput.addEventListener('input', () => {
  if (currentAnalysis) renderEndpoints(currentAnalysis.endpoints);
});

// 5. Render Security & Crypto
function renderSecurity(sec) {
  // Root
  if (sec.rootDetection.found) {
    secRootBadge.textContent = 'ACTIVE DEFENSE';
    secRootBadge.style.background = 'rgba(239, 68, 68, 0.2)';
    secRootBadge.style.color = '#f87171';
    secRootIndicators.innerHTML = sec.rootDetection.indicators.map(i => `<li>${i}</li>`).join('');
    secRootBypass.textContent = sec.rootDetection.bypassTip;
  } else {
    secRootBadge.textContent = 'NOT DETECTED';
    secRootBadge.style.background = 'rgba(16, 185, 129, 0.2)';
    secRootBadge.style.color = '#34d399';
    secRootIndicators.innerHTML = `<li>No explicit root/su verification detected in DEX strings.</li>`;
    secRootBypass.textContent = 'None required—app executes normally on rooted devices.';
  }

  // SSL Pinning
  if (sec.sslPinning.found) {
    secSslBadge.textContent = 'ENFORCED';
    secSslBadge.style.background = 'rgba(239, 68, 68, 0.2)';
    secSslBadge.style.color = '#f87171';
    secSslIndicators.innerHTML = sec.sslPinning.indicators.map(i => `<li>${i}</li>`).join('');
    secSslBypass.textContent = sec.sslPinning.bypassTip;
  } else {
    secSslBadge.textContent = 'STANDARD TLS';
    secSslBadge.style.background = 'rgba(16, 185, 129, 0.2)';
    secSslBadge.style.color = '#34d399';
    secSslIndicators.innerHTML = `<li>Standard Android CA certificate validation.</li>`;
    secSslBypass.textContent = 'Install custom user/system CA certificate in device settings.';
  }

  // Crypto Primitives
  cryptoPrimitivesList.innerHTML = sec.cryptoPrimitives.map(c => `
    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.9rem; margin-bottom: 0.75rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
        <strong style="color: var(--accent-indigo); font-family: var(--font-mono);">${c.algorithm}</strong>
        <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Cryptographic Primitive</span>
      </div>
      <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${c.description}</p>
      <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted);">
        References: ${c.locations.join(' | ')}
      </div>
    </div>
  `).join('');
}

// Tab Switching
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-item');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.style.display = 'none');

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      document.getElementById(targetId).style.display = 'block';
    });
  });
}

// Code Language Switching
function setupCodeTabs() {
  const langBtns = document.querySelectorAll('[data-lang]');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => {
        b.style.background = 'rgba(255, 255, 255, 0.06)';
        b.style.color = 'var(--text-primary)';
      });
      btn.style.background = 'var(--accent-indigo)';
      btn.style.color = '#fff';

      currentLanguage = btn.dataset.lang;
      if (currentAnalysis) renderCodeSnippets(currentAnalysis.recipe.codeSnippets);
    });
  });

  btnCopySnippet.addEventListener('click', () => {
    const code = codeDisplayArea.querySelector('code').textContent;
    navigator.clipboard.writeText(code);
    showToast('Code copied to clipboard!');
  });
}

// Drag & Drop & File Upload
function setupUpload() {
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragging');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragging');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragging');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.apk')) {
      uploadApk(files[0]);
    } else {
      alert('Please upload a valid .apk file');
    }
  });

  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    fileUploadInput.click();
  });

  fileUploadInput.addEventListener('change', () => {
    if (fileUploadInput.files.length > 0) {
      uploadApk(fileUploadInput.files[0]);
    }
  });

  btnLoadDemo.addEventListener('click', () => {
    fetch('/api/demos/demo_fintech_baridi')
      .then(r => r.json())
      .then(d => {
        renderAnalysis(d);
        showToast('Loaded BaridiMob Fintech Demo!');
      });
  });

  btnQuickDemo.addEventListener('click', () => {
    btnLoadDemo.click();
  });
}

// Upload APK to Server
async function uploadApk(file) {
  showToast(`Uploading and analyzing ${file.name}...`);
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
    showToast(`Analysis complete for ${result.app.name}!`);
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
  }, 2500);
}

// Start
init();
