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
