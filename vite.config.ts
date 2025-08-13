import { defineConfig, loadEnv, type UserConfig } from 'vite';
import { viteConfigAliases } from '@syren-dev-tech/confetti/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default ({ mode }: UserConfig) => {
    process.env = mode && {
        ...process.env,
        ...loadEnv(mode, process.cwd())
    } || process.env;

    const { DEV } = process.env;

    return defineConfig({
        base: '/fate-gui/',
        esbuild: {
            drop: !DEV && ['console', 'debugger'] || undefined,
            legalComments: 'none'
        },
        plugins: [react(), tsconfigPaths()],
        resolve: {
            alias: {
                ...viteConfigAliases()
            }
        },
        server: {
            port: 3000
        }
    });
};