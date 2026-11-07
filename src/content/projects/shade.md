---
name: SHADE
description: A self-hostable data engine that runs underneath client sites. Pre-release.
tags:
  - cms
  - self-hosted
stack:
  - typescript
  - hono
  - nuxt
  - postgres
images: []
status: active
featured: false
draft: false
date: '2026-11-07'
---
SHADE stands for Self-Hostable Adaptive Data Engine. It runs underneath client
systems.

Each instance runs on its own server with its own database. Editors work in an
admin app. Plugins add what a client needs, like appointments, a shop or their
own records. Frontends read it over an API, in Astro, Next.js, Nuxt, SvelteKit
or plain HTTP.

Whoever runs an instance owns it. There are no licence keys and no outside
services, and any capable developer can take it over.

SHADE is pre-release. It isn't ready for production yet, and its data formats
and APIs can still change. The code is private until the first stable release.
