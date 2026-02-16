import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        federation({
            name: "k3-window",
            filename: "remoteEntry.js",
            exposes: {
                "./Plugin": "./src/Plugin.tsx",
            },
            dts: false, // Disable DTS generation to avoid dev server issues
            shared: {
                react: { singleton: true, requiredVersion: "19.1.1" },
                "react-dom": { singleton: true, requiredVersion: "19.1.1" },
                "@mui/material": { singleton: true, requiredVersion: "^7.1.1" },
                "@mui/styled-engine": { singleton: true, requiredVersion: "^7.1.1" },
                "@emotion/react": { singleton: true, requiredVersion: "^11.10.0" },
                "@emotion/styled": { singleton: true, requiredVersion: "^11.10.5" },
                "@emotion/cache": { singleton: true, requiredVersion: "^11.14.0" },
                "@react-three/drei": { singleton: true, requiredVersion: "^10.1.2" },
                "@react-three/fiber": { singleton: true, requiredVersion: "^9.1.2" },
                three: { singleton: true, requiredVersion: "^0.177.0" },
            },
        }),
    ],
    build: {
        modulePreload: false,
        target: "esnext",
        minify: false,
        cssCodeSplit: false,
    },
});
