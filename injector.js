// injector: ดันโค้ดลง "หน้าเกม" (page world) ตั้งแต่ document_start
(() => {
  const inject = () => {
    if (document.querySelector('script[data-pb-esp="1"]')) return;
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("esp.js") + "?v=" + Date.now();
    s.dataset.pbEsp = "1";
    (document.head || document.documentElement).appendChild(s);
  };
  inject();
  // เผื่อ head/documentElement ยังไม่พร้อม
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once: true });
  }
})();

/* bridge: extension options page <-> page-world esp.js
   - options page asks for the live server-owned list
   - SAFETY button asks the background to open the options page */
(() => {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) return;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.type !== "pb-get-server-owned") return;
    if (sender && sender.id !== chrome.runtime.id) return;
    const id = Date.now() + ":" + Math.random().toString(36).slice(2);
    let done = false;
    const finish = (ids, owned) => {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMsg);
      try {
        sendResponse({
          ids: Array.isArray(ids) ? ids : [],
          owned: Array.isArray(owned) ? owned : [],
        });
      } catch (_) { }
    };
    const onMsg = (ev) => {
      if (!ev.data || ev.data.__pbServerOwned !== id) return;
      finish(ev.data.ids, ev.data.owned);
    };
    window.addEventListener("message", onMsg);
    window.postMessage({ __pbGetServerOwned: id }, "*");
    setTimeout(() => finish([]), 2000);
    return true;
  });

  addEventListener("message", (ev) => {
    if (!ev.data || !ev.data.__pbOpenServerSite) return;
    try {
      chrome.runtime.sendMessage({
        type: "pb-open-server-site",
        ids: Array.isArray(ev.data.ids) ? ev.data.ids : [],
        owned: Array.isArray(ev.data.owned) ? ev.data.owned : [],
      });
    } catch (_) { }
  });
})();
