if(!self.define){let e,s={};const t=(t,a)=>(t=new URL(t+".js",a).href,s[t]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=t,e.onload=s,document.head.appendChild(e)}else e=t,importScripts(t),s()})).then((()=>{let e=s[t];if(!e)throw new Error(`Module ${t} didn’t register its module`);return e})));self.define=(a,i)=>{const n=e||("document"in self?document.currentScript.src:"")||location.href;if(s[n])return;let c={};const r=e=>t(e,n),o={module:{uri:n},exports:c,require:r};s[n]=Promise.all(a.map((e=>o[e]||r(e)))).then((e=>(i(...e),c)))}}define(["./workbox-4754cb34"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"11b5bc7006b6ff8a9a19f0a842d4f58f"},{url:"/_next/static/BJRvWPC1KDVBtVMyXb8GN/_buildManifest.js",revision:"6b7e59d2d0d3ebe51f21346ba8221dfe"},{url:"/_next/static/BJRvWPC1KDVBtVMyXb8GN/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/1517-944c14a6b383d9bd.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/1920-1037f043bb1e613e.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/208-07ee38f07266d7d9.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/2615-d1301be79f347660.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/2847-d2baa626d2c60c19.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/3609-ed84e878bdaa6ff0.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/4129-4f8c36fabf00bc5e.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/4bd1b696-89976d7b35ff2b26.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/5671-9dad7443773865cb.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/6964-2dc30b9f73dfb2ad.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/7970-938901e99c9da833.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/8173-0fc0b8c4b2da2a92.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/9205-4f0ab9492265668b.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/(auth)/first-access/page-158150ba7d771734.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/(auth)/layout-d45cefe001724315.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/(auth)/login/page-bd38fa1e2ae4b9ec.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/_not-found/page-6a6ec5d7c5ad316c.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-22f3f0b76fa5dc39.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/auth/change-password/route-d0cbc6ed5724800d.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/cash/close/%5Bid%5D/route-96559cfb7f699589.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/cash/open/route-57d6114a998d9502.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/deposits/route-73791144094d23aa.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/films/%5Bid%5D/route-da8e8b5fbcd7d41a.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/films/route-250bd3745dfc44b0.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/push/send/route-4cb2dd623d9dc885.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/push/subscription/route-e222679a402709c1.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/shows/%5Bid%5D/assign/route-e026d33c2d8c8a45.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/shows/%5Bid%5D/route-c31a2fa5a3eb2c38.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/shows/%5Bid%5D/withdraw/route-a787f33c0c4e6e3e.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/shows/available/route-891c8d9364e9121f.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/shows/route-2b3c8ff09d150abd.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/users/%5Bid%5D/reset-password/route-dd03700ab739689e.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/users/%5Bid%5D/route-f0d5ec4a60a29633.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/users/route-bf64e633cf8c6e8e.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/api/withdrawals/route-c0ee55a8434d8fee.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/availability/layout-2bcf049489fd9ef5.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/availability/page-8a9f140eea132138.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/dashboard/@modal/%5Bid%5D/cash/page-26db8851bcbafc76.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/dashboard/@modal/default-3964ad117925cb6b.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/dashboard/layout-bcea88e1d2668b4a.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/dashboard/page-ffa4689bcf033a2a.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/films/@modal/%5Bid%5D/edit/page-422e512d3537ea3f.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/films/@modal/default-35712221c78e89f9.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/films/@modal/new/page-c0b6cd98a0fdc367.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/films/layout-b29f7bf57f303105.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/films/page-1e8f29381d7d0ed1.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/layout-ee764e331aae8136.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/page-f7147a4ef96fe277.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/shows/@modal/%5Bid%5D/cash/page-6d9b64ccdd5650dc.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/shows/@modal/%5Bid%5D/edit/page-76f6ddc5b0751974.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/shows/@modal/default-6e40d8e45adc7732.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/shows/@modal/new/page-05dded9edbad275b.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/shows/layout-51f8afe70e8931b5.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/shows/page-ca9e35d5841ed660.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/users/edit/%5Bid%5D/page-92a0b384714a6332.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/users/layout-41a65269badacd95.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/users/new/page-6c0a84cd9172c062.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/users/page-d2bb5fae262634a5.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/withdrawals/layout-deab74a0641f3abe.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/app/withdrawals/page-c61d31b1d8ced7ea.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/framework-28674b8561f5ef2a.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/main-app-98eafab9ef9042de.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/main-fefff7f3e0099ded.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/pages/_app-00b41aece417ee52.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/pages/_error-6b43ce36a8d09a61.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-5e5396128d5e1e38.js",revision:"BJRvWPC1KDVBtVMyXb8GN"},{url:"/_next/static/css/638d2107d819751c.css",revision:"638d2107d819751c"},{url:"/_next/static/css/b3cbcd051438d1d5.css",revision:"b3cbcd051438d1d5"},{url:"/_next/static/media/26a46d62cd723877-s.woff2",revision:"befd9c0fdfa3d8a645d5f95717ed6420"},{url:"/_next/static/media/55c55f0601d81cf3-s.woff2",revision:"43828e14271c77b87e3ed582dbff9f74"},{url:"/_next/static/media/569ce4b8f30dc480-s.p.woff2",revision:"ef6cefb32024deac234e82f932a95cbd"},{url:"/_next/static/media/581909926a08bbc8-s.woff2",revision:"f0b86e7c24f455280b8df606b89af891"},{url:"/_next/static/media/6d93bde91c0c2823-s.woff2",revision:"621a07228c8ccbfd647918f1021b4868"},{url:"/_next/static/media/747892c23ea88013-s.woff2",revision:"a0761690ccf4441ace5cec893b82d4ab"},{url:"/_next/static/media/93f479601ee12b01-s.p.woff2",revision:"da83d5f06d825c5ae65b7cca706cb312"},{url:"/_next/static/media/97e0cb1ae144a2a9-s.woff2",revision:"e360c61c5bd8d90639fd4503c829c2dc"},{url:"/_next/static/media/a34f9d1faa5f3315-s.p.woff2",revision:"d4fe31e6a2aebc06b8d6e558c9141119"},{url:"/_next/static/media/ba015fad6dcf6784-s.woff2",revision:"8ea4f719af3312a055caf09f34c89a77"},{url:"/_next/static/media/df0a9ae256c0569c-s.woff2",revision:"d54db44de5ccb18886ece2fda72bdfe0"},{url:"/icons/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/icons/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/icons/icon-192x192.svg",revision:"8b6e0e4fb5b46d12235769ec56e23c53"},{url:"/icons/icon-512x512.svg",revision:"49c774161201d1d5d542571c84e0a82b"},{url:"/icons/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/icons/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/icons/window.svg",revision:"a2760511c65806022ad20adf74370ff3"},{url:"/manifest.json",revision:"20f5493514a76a812c0c4cd52a1717df"},{url:"/offline.html",revision:"78f4fb66a3c584148881d375dd856040"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:t,state:a})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
