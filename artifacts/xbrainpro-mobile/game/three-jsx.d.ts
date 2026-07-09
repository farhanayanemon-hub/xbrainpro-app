import type { ThreeElements } from "@react-three/fiber";

// React Three Fiber v9 no longer augments the JSX namespace automatically;
// extend both React 19's JSX types and the global JSX namespace (used by
// react-native's type definitions) so <mesh />, <group />, etc. typecheck.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

export {};
