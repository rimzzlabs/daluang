# Changelog

## [0.3.0](https://github.com/rimzzlabs/daluang/compare/v0.2.0...v0.3.0) (2026-10-18)


### Features

* **auth:** let a site read the content api with a token and no session ([#27](https://github.com/rimzzlabs/daluang/issues/27)) ([050a2cc](https://github.com/rimzzlabs/daluang/commit/050a2cc1a00ecd21ad6b7a1c4825e357e37fce27))
* **cms:** call the endpoint of the notes from the browser ([#32](https://github.com/rimzzlabs/daluang/issues/32)) ([cd73d9a](https://github.com/rimzzlabs/daluang/commit/cd73d9aed9756fc234b2ae4cdbdbf23726afd46f))
* **notes:** add the table of the notes to d1 ([#20](https://github.com/rimzzlabs/daluang/issues/20)) ([5144610](https://github.com/rimzzlabs/daluang/commit/5144610787dffe7d6f2c2287c97f704b46096b1b))
* **notes:** check a post against the languages and the fields of the site ([#22](https://github.com/rimzzlabs/daluang/issues/22)) ([0a5cdc3](https://github.com/rimzzlabs/daluang/commit/0a5cdc3efcd8002d8877b6f1806d016f3ea84c2c))
* **notes:** give a site the published notes with their comark document ([#28](https://github.com/rimzzlabs/daluang/issues/28)) ([fb6dcf2](https://github.com/rimzzlabs/daluang/commit/fb6dcf224141ffc0797c8cb8eec5bf91d7388364))
* **notes:** list the notes and add a draft at /api/notes ([#23](https://github.com/rimzzlabs/daluang/issues/23)) ([a3ea5cd](https://github.com/rimzzlabs/daluang/commit/a3ea5cd2a83918b2d478b145846a6d3459e85b03))
* **notes:** publish and unpublish a note, and tell each site to rebuild ([#26](https://github.com/rimzzlabs/daluang/issues/26)) ([3b09312](https://github.com/rimzzlabs/daluang/commit/3b093125b130a0dc04476905ce02cf237202dcd6))
* **notes:** read and write the notes in d1 ([#21](https://github.com/rimzzlabs/daluang/issues/21)) ([1510456](https://github.com/rimzzlabs/daluang/commit/15104561be0b09dc2fcc6459c2720daa4754d492))
* **notes:** read, change, and delete one note at /api/notes/&lt;id&gt; ([#24](https://github.com/rimzzlabs/daluang/issues/24)) ([c354543](https://github.com/rimzzlabs/daluang/commit/c3545439d58c292b1bf044fae38f46ce79c90905))
* **webhooks:** deliver a publish event to each webhook ([#25](https://github.com/rimzzlabs/daluang/issues/25)) ([4e89cab](https://github.com/rimzzlabs/daluang/commit/4e89cab5acc1b1d73e63db744adef6c3bba3f62a))


### Documentation

* **docs:** read the published posts in an astro site ([#30](https://github.com/rimzzlabs/daluang/issues/30)) ([1d263a7](https://github.com/rimzzlabs/daluang/commit/1d263a7bf2fcfa9bd83cdd1239134f65cf947792))
* keep the commit of a move buildable ([#31](https://github.com/rimzzlabs/daluang/issues/31)) ([7f9b751](https://github.com/rimzzlabs/daluang/commit/7f9b751db799847ac6d7b33b253a761430c24a12))
* record the decisions of the posts step ([#18](https://github.com/rimzzlabs/daluang/issues/18)) ([3628253](https://github.com/rimzzlabs/daluang/commit/36282538a0042a4449dcaef2be2b95976dff0a81))
* stop the background preview before a new one ([#29](https://github.com/rimzzlabs/daluang/issues/29)) ([2d0ad38](https://github.com/rimzzlabs/daluang/commit/2d0ad383e83cc252855c4a4b9c3dbb2a232ea40f))

## [0.2.0](https://github.com/rimzzlabs/daluang/compare/v0.1.0...v0.2.0) (2026-10-17)


### Features

* **api-tokens:** make, list, and revoke the API tokens of a site ([c173ab9](https://github.com/rimzzlabs/daluang/commit/c173ab93fbdec524d676a71ef91069876946228f))
* **cms:** add the settings pages of the site and the languages ([c94da5f](https://github.com/rimzzlabs/daluang/commit/c94da5fa0b147c3199b1c50aeee32211ea289886))
* **cms:** call a note a post in the interface and the docs ([faa9aba](https://github.com/rimzzlabs/daluang/commit/faa9aba79ae91ef981f0e07e53b13868a5b80939))
* **cms:** put each action of a page in a responsive dialog ([ed69059](https://github.com/rimzzlabs/daluang/commit/ed6905985041617c4215cdda54579d5a015e0e74))
* **cms:** send a content security policy and the security headers ([dad5d5d](https://github.com/rimzzlabs/daluang/commit/dad5d5d3fe671a7241f6f0ec4eada27207640d5e))
* **cms:** show the next settings of a site on the empty notes page ([9b252bc](https://github.com/rimzzlabs/daluang/commit/9b252bc1dd34966fbb8b542d0b74a43260898611))
* **settings:** ask for the site and the languages at the first sign-in ([762e27d](https://github.com/rimzzlabs/daluang/commit/762e27d622c7d9c560ad0eed2c1980150446f58a))
* **settings:** define the extra fields of the site ([1c1e556](https://github.com/rimzzlabs/daluang/commit/1c1e556fd1c7c6a2bd4e14817eee4b307cb45be7))
* **ui:** add a responsive dialog, a confirm dialog, and a page frame ([3b45c66](https://github.com/rimzzlabs/daluang/commit/3b45c66a3ca5241bcb0663a2b48b27afa3596d43))
* **webhooks:** add the webhooks that tell a site to rebuild ([0285989](https://github.com/rimzzlabs/daluang/commit/0285989f794d396b3fb6263c2e5714ded584f6aa))


### Bug Fixes

* **auth:** answer only the endpoints of Better Auth that the CMS uses ([bd893a8](https://github.com/rimzzlabs/daluang/commit/bd893a8a2c102afe256435f27f5d27049fa6080d))
* **auth:** refuse a name of Object.prototype in the sign-in error code ([919f9d4](https://github.com/rimzzlabs/daluang/commit/919f9d4acd04ec48951b7a86706e705424590f71))
* **auth:** refuse a next value that a browser opens on another host ([2f1a043](https://github.com/rimzzlabs/daluang/commit/2f1a043ddaa81c0e37e61625cece3cc916771c43))
* **auth:** show each sign-in error on the sign-in page ([78763a6](https://github.com/rimzzlabs/daluang/commit/78763a647f8ad17eb4105523e508e6365e5d378e))
* **auth:** turn on the rate limit of the sign-in on Cloudflare ([9a10809](https://github.com/rimzzlabs/daluang/commit/9a10809db752b380f6a8ea413d53c098b32231b8))
* **cms:** answer 404 as JSON for an unknown API path ([e9a15cd](https://github.com/rimzzlabs/daluang/commit/e9a15cd6bcd8ece04e67d3efcf3c5f6ee8ea7694))
* **cms:** make each page of the app shell full width and compact ([61e6862](https://github.com/rimzzlabs/daluang/commit/61e6862135f1e00b885f8559cf6cf85ffd2a080b))
* **cms:** put the primary action of a page on the right, with 44px targets ([500b591](https://github.com/rimzzlabs/daluang/commit/500b59137baf208be7924844a67637a955073a80))
* **settings:** keep the focus in a field after a move back in the onboarding ([df2dabe](https://github.com/rimzzlabs/daluang/commit/df2dabe8e4567f2c247f5bf1ab395faab063170a))
* **settings:** list the most used languages as the choices ([55493fa](https://github.com/rimzzlabs/daluang/commit/55493fa68d558461579d96261c1f2d5248ea81a2))
* **settings:** put a space between the label of the address and (optional) ([d0f9e51](https://github.com/rimzzlabs/daluang/commit/d0f9e515090630c22c1280f288d306c65b9ab496))
* **settings:** put Required and Remove on their own line in a field row ([3b0eac3](https://github.com/rimzzlabs/daluang/commit/3b0eac317527b95fa28c2e236fd605dc1e69ac08))
* **webhooks:** apply each change of a list to the current list ([6f01ed3](https://github.com/rimzzlabs/daluang/commit/6f01ed34fc8c7ca3102543fe549dfbed8fbc9d65))
* **webhooks:** refuse a local host name with its last dot ([63a7025](https://github.com/rimzzlabs/daluang/commit/63a7025ddc34e433e8583ddda9216e386cc72647))
* **web:** send the security headers with each file of the site ([92ed8f6](https://github.com/rimzzlabs/daluang/commit/92ed8f6f37483c2455297d20ad312f3ff7b81783))


### Documentation

* add the contributor guide and the rules of the repository ([#6](https://github.com/rimzzlabs/daluang/issues/6)) ([cd2232f](https://github.com/rimzzlabs/daluang/commit/cd2232fb085b09e78d8a009937f7478546f7d0a4))
* list the parts of the CMS that exist now ([a463bcc](https://github.com/rimzzlabs/daluang/commit/a463bccbb8159ed79d9441c8216ef3c220b70579))
* name each side effect of the domain packages ([#12](https://github.com/rimzzlabs/daluang/issues/12)) ([f155a49](https://github.com/rimzzlabs/daluang/commit/f155a49caac0f09a46dd280bb69884ff62cedec4))

## 0.1.0 (2026-10-16)


### Features

* add sign-in with GitHub and the app shell of the CMS ([3563b15](https://github.com/rimzzlabs/daluang/commit/3563b15310eea1d54b6adc9e61104736db9737df))
* add the Daluang mark, the app icons, and the favicons ([ed3f89e](https://github.com/rimzzlabs/daluang/commit/ed3f89e88e0912fcb0b8a107b84c7e92fbc14e5c))
* **cms:** add the menus, and apply the theme before the first paint ([c41e527](https://github.com/rimzzlabs/daluang/commit/c41e5278c402bfcc42675f1ec1955eed20ca5c08))
* **cms:** run the app pages in one island with TanStack Router ([79ee7e8](https://github.com/rimzzlabs/daluang/commit/79ee7e8a1999b465b1ab23ef05439d8572f8d27e))
* **notes:** add the model of a note ([bc51a31](https://github.com/rimzzlabs/daluang/commit/bc51a31e31436f1b3e00f22be10c3bb6d24b8d60))
* **web:** add the landing page and serve the docs at /docs ([5e931b3](https://github.com/rimzzlabs/daluang/commit/5e931b32c81b055001ead2fb8405a43af514c123))
* **web:** hot reload the landing page and the docs from one command ([f162e2e](https://github.com/rimzzlabs/daluang/commit/f162e2eb200424a1a26e0e03b94965f2b244fe70))
* **web:** write the copy of the landing page ([4bdcfb9](https://github.com/rimzzlabs/daluang/commit/4bdcfb97fe27625839665d04d3b55f593e987a42))


### Bug Fixes

* **auth:** keep the GitHub username of the profile at sign-in ([54c044c](https://github.com/rimzzlabs/daluang/commit/54c044c1c5a0f7edd39226415393e3ddc5113333))
* **web:** rewrite the headline of the landing page ([5dc5892](https://github.com/rimzzlabs/daluang/commit/5dc58927e6066a6e263595864a5630cf4d2c32dd))
* **web:** serve the root of the docs site at /docs/ ([ffdf6aa](https://github.com/rimzzlabs/daluang/commit/ffdf6aa935a807ba9b734f1e28668b6d06201bd7))


### Documentation

* add the agent guide and the skills ([a1f21aa](https://github.com/rimzzlabs/daluang/commit/a1f21aaa1113006795c0c240966471cae05c1c2b))
