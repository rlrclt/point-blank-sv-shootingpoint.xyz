/* PB ESP - TH — background service worker (MV3).
   Makes the SERVER see a phone. Page JS cannot touch an HTTP header, and this
   client's own client-side device enum is already forced to mobile by
   mobile-spoof.js — so the only layer left is the request itself.

   Rule: for shootingpoint.xyz and every subdomain, rewrite
     · user-agent              -> Android 14 / SM-S918B Chrome Mobile
     · sec-ch-ua-mobile        -> ?1
     · sec-ch-ua-platform      -> "Android"
     · sec-ch-ua-platform-version -> "14.0.0"
   on documents, XHR/fetch and WebSocket handshakes.

   Dynamic rules are used (not a static rules.json) because every outcome can be
   written to chrome.storage.local and inspected from the service worker
   console: chrome.storage.local.get("pbEspDnr"). */

const RULE_ID = 9101;
const UA = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

const RULE = {
  id: RULE_ID,
  priority: 1,
  action: {
    type: "modifyHeaders",
    requestHeaders: [
      { header: "user-agent", operation: "set", value: UA },
      { header: "sec-ch-ua-mobile", operation: "set", value: "?1" },
      { header: "sec-ch-ua-platform", operation: "set", value: "\"Android\"" },
      { header: "sec-ch-ua-platform-version", operation: "set", value: "\"14.0.0\"" }
    ]
  },
  condition: {
    requestDomains: ["shootingpoint.xyz"],
    resourceTypes: [
      "main_frame",
      "sub_frame",
      "stylesheet",
      "script",
      "image",
      "font",
      "object",
      "xmlhttprequest",
      "ping",
      "media",
      "websocket",
      "other"
    ]
  }
};

const report = (ok, detail) => {
  try {
    chrome.storage.local.set({ pbEspDnr: { ok, detail: String(detail || ""), at: Date.now() } });
  } catch (e) { }
  try { console.log("[PB] dnr", ok, detail); } catch (e) { }
};

const install = () => {
  try {
    if (!chrome.declarativeNetRequest || !chrome.declarativeNetRequest.updateDynamicRules) {
      report(false, "declarativeNetRequest unavailable");
      return;
    }
    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: [RULE_ID], addRules: [RULE] },
      () => {
        const err = chrome.runtime.lastError;
        if (err) { report(false, err.message || "updateDynamicRules failed"); return; }
        try {
          chrome.declarativeNetRequest.getDynamicRules((rules) => {
            const has = (rules || []).some((r) => r && r.id === RULE_ID);
            report(has, has ? "rule " + RULE_ID + " active" : "rule missing after install");
          });
        } catch (e) { report(true, "installed (unverified)"); }
      }
    );
  } catch (e) {
    report(false, e && e.message ? e.message : "exception");
  }
};

install();
chrome.runtime.onInstalled.addListener(install);
chrome.runtime.onStartup.addListener(install);
