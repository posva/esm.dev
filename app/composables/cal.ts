const initConfig = {
  origin: 'https://app.cal.com',
}
const styleConfig = {
  cssVarsPerTheme: {
    light: {
      'cal-bg-muted': '#e5e7eb',
      'cal-bg-emphasis': '#f3f4f6',
    },
    dark: {
      'cal-bg-muted': '#000000',
      'cal-bg-emphasis': '#111111',
    },
  },
  hideEventTypeDetails: false,
  layout: 'month_view',
}

// Important: Please add the following attributes to the element that should trigger the calendar to open upon clicking.
// `data-cal-link="posva/consultancy"`
// data-cal-namespace=""
// `data-cal-config='{"layout":"month_view"}'`

let isAdded = false

export function useCalButton() {
  // only add once on client?
  if (!isAdded) {
    useHead({
      script: [
        {
          key: 'cal',
          innerHTML: /* javascript */ `
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; typeof namespace === "string" ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", ${JSON.stringify(initConfig)});
Cal("ui", ${JSON.stringify(styleConfig)});
`,
        },
      ],
    })

    isAdded = typeof document !== 'undefined'
  }

  // MDC has a bug when adding an Icon that rerenders the content and throws away event listeners
  // so we need to add the event listener manually
  function open(link: 'posva/consultancy' | 'posva/sponsor' | 'posva/freelancing') {
    ;(window as any).Cal('modal', {
      calLink: link,
      config: initConfig,
      calOrigin: initConfig.origin,
    })
  }

  return { open }
}
