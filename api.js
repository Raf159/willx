/* ===========================================================================
   Willx Technologies — WILLXHST API Client
   ---------------------------------------------------------------------------
   WILLXHST is the internal name for the Willx backend server / API.
   Every network-backed feature on the site (Projects Manager portal, and
   eventually the quote/contact forms) goes through this one file.

   SWITCHING ON THE REAL SERVER:
   Just update WILLXHST_API_BASE below to the real endpoint
   (e.g. "https://hst.willxtech.ca/api/v1"). Nothing else needs to change —
   every call already uses credentials:'include' so the httpOnly session
   cookie WILLXHST sets on login is sent automatically. No auth token is
   ever stored in the browser (no localStorage/sessionStorage of secrets).

   DEMO MODE:
   Until WILLXHST is actually deployed, every call below will fail to
   connect — that's expected. Each function catches that failure and falls
   back to local mock data so the interface stays fully explorable. A small
   "Demo Mode" badge is shown in the admin portal whenever this happens, so
   it's never ambiguous whether you're looking at live or sample data.
   =========================================================================== */

const WILLXHST_API_BASE = 'https://WILLXHST/api/v1';

const WILLXHST_DEMO_CREDENTIALS = { username: 'demo.manager', password: 'Willx#Demo2026' };

let willxhstDemoMode = false;

async function willxhstRequest(path, options = {}) {
  const res = await fetch(`${WILLXHST_API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `WILLXHST request failed (${res.status})`);
  }
  return res.json();
}

/* ---------------- Auth ---------------- */

async function willxLogin(username, password) {
  try {
    const data = await willxhstRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    willxhstDemoMode = false;
    return data.user;
  } catch (err) {
    if (username === WILLXHST_DEMO_CREDENTIALS.username && password === WILLXHST_DEMO_CREDENTIALS.password) {
      willxhstDemoMode = true;
      try { sessionStorage.setItem('willxhst_demo_session', '1'); } catch (_) {}
      return { name: 'Demo Manager', role: 'project_manager', demo: true };
    }
    throw new Error('بيانات الدخول غير صحيحة، أو خادم WILLXHST غير متاح حاليًا.');
  }
}

async function willxCheckSession() {
  try {
    const data = await willxhstRequest('/auth/me');
    willxhstDemoMode = false;
    return data.user;
  } catch (err) {
    let demoFlag = false;
    try { demoFlag = sessionStorage.getItem('willxhst_demo_session') === '1'; } catch (_) {}
    if (demoFlag) {
      willxhstDemoMode = true;
      return { name: 'Demo Manager', role: 'project_manager', demo: true };
    }
    return null;
  }
}

async function willxLogout() {
  try { await willxhstRequest('/auth/logout', { method: 'POST' }); } catch (_) {}
  try { sessionStorage.removeItem('willxhst_demo_session'); } catch (_) {}
}

/* ---------------- Customers / Projects ---------------- */

async function willxGetCustomers() {
  try {
    return await willxhstRequest('/customers');
  } catch (err) {
    willxhstDemoMode = true;
    return structuredClone(WILLXHST_MOCK_CUSTOMERS);
  }
}

async function willxUpdateProjectStatus(customerId, projectId, status) {
  try {
    return await willxhstRequest(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    willxhstDemoMode = true;
    return { ok: true, demo: true };
  }
}

async function willxAddProjectNote(customerId, projectId, text, author) {
  try {
    return await willxhstRequest(`/projects/${projectId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    willxhstDemoMode = true;
    return { ok: true, demo: true, note: { date: new Date().toISOString().slice(0, 10), author, text } };
  }
}

/* ---------------- Lead forms (quote / contact) ---------------- */

async function willxSubmitLead(payload) {
  try {
    return await willxhstRequest('/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    willxhstDemoMode = true;
    return { ok: true, demo: true };
  }
}

/* ---------------- Demo dataset ---------------- */

const WILLXHST_MOCK_CUSTOMERS = [
  {
    id: 'c1', name: 'Scotiabank Arena Group', sector: 'Stadium / Arena',
    projects: [
      { id: 'p1', name: 'Arena-Wide Wireless Mesh Upgrade', type: 'Wireless Infrastructure', status: 'Active', updated: '2026-08-01',
        notes: [{ date: '2026-07-20', author: 'M. Haddad', text: 'Phase 2 access-point deployment scheduled for next home game gap.' }] },
      { id: 'p2', name: 'Ticketing Systems Cybersecurity Audit', type: 'Cybersecurity Audit', status: 'Completed', updated: '2026-05-11',
        notes: [{ date: '2026-05-11', author: 'M. Haddad', text: 'Audit closed, no critical findings outstanding.' }] },
    ],
  },
  {
    id: 'c2', name: 'National Arts Centre', sector: 'Culture / Theatre',
    projects: [
      { id: 'p3', name: 'AV-over-IP Signal Distribution', type: 'AV-over-IP', status: 'Active', updated: '2026-08-10',
        notes: [{ date: '2026-08-10', author: 'S. Farah', text: 'Dante network testing in progress across main stage.' }] },
      { id: 'p4', name: 'Backstage Managed IT Rollout', type: 'IT Managed Services', status: 'On Hold', updated: '2026-06-02',
        notes: [{ date: '2026-06-02', author: 'S. Farah', text: 'Paused pending client budget confirmation for Q3.' }] },
    ],
  },
  {
    id: 'c3', name: 'G7 Summit Task Force', sector: 'Government / Event',
    projects: [
      { id: 'p5', name: 'Summit Perimeter Network Infrastructure', type: 'Network Infrastructure', status: 'Archived', updated: '2026-01-15',
        notes: [{ date: '2026-01-15', author: 'M. Haddad', text: 'Engagement closed and archived after successful summit delivery.' }] },
    ],
  },
  {
    id: 'c4', name: 'Northern Lights Casino Resort', sector: 'Casino',
    projects: [
      { id: 'p6', name: 'Gaming Floor Network Segmentation', type: 'Cybersecurity Audit', status: 'Active', updated: '2026-08-05',
        notes: [{ date: '2026-08-05', author: 'S. Farah', text: 'VLAN segmentation live on gaming floor, back-of-house rollout next.' }] },
      { id: 'p7', name: 'Guest Wireless Expansion', type: 'Wireless Infrastructure', status: 'On Hold', updated: '2026-07-01', notes: [] },
    ],
  },
];
