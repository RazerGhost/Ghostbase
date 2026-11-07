---
name: Haunt
description: A desktop git client that also maps your code, function by function.
href: 'https://github.com/RazerGhost/haunt'
tags:
  - git
  - desktop
stack:
  - tauri
  - rust
  - nuxt
  - typescript
images: []
status: active
featured: false
draft: false
date: '2026-11-07'
---
Haunt is a git client for Windows, macOS and Linux. It does the usual work:
staging, committing, branches, merging, rebasing and pull requests.

It also reads a project by function. For a change it shows which functions it
touches, what calls them, which tests reach them and who knows that part of the
code. It draws maps of the layers, call paths and imports too.

Everything runs locally. Haunt sends nothing anywhere unless you ask, and it
runs none of a project's own code until you trust its folder.

TypeScript and JavaScript are read with the TypeScript compiler. PHP, Rust, Lua,
Python, Go, Java, C#, Ruby, C and C++ are read with tree-sitter.

Installers are on the [releases page](https://github.com/RazerGhost/haunt/releases).
