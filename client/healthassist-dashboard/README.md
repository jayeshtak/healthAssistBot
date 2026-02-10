# React + Vite

This template provides a **minimal setup** to get React working in Vite, including Hot Module Replacement (HMR) and basic ESLint rules.

---

## Available Plugins

Currently, two official plugins are available for React in Vite:

- **[@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)**  
  Uses **Babel** (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) to enable Fast Refresh.

- **[@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc)**  
  Uses **SWC** compiler for Fast Refresh, offering faster compilation times in some setups.

---

## React Compiler

The React Compiler is **not enabled by default** in this template because it can impact dev and build performance.  
To enable it, follow the [React Compiler installation guide](https://react.dev/learn/react-compiler/installation).

---

## Expanding ESLint Configuration

For production-level projects, it’s recommended to:

1. Use **TypeScript** for better type safety.
2. Enable **type-aware lint rules** using [`typescript-eslint`](https://typescript-eslint.io).

See the [React + TS Vite template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for an example of how to integrate TypeScript and ESLint properly.

---
