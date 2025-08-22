import { UserConfig, defineConfig } from 'vite';
import fs from 'fs-extra';
import tsconfigPaths from 'vite-tsconfig-paths';

const moduleName = 'pf2e-ratings';

const config = defineConfig(({ command }): UserConfig => {

  const outDir = 'dist';

  if (command === 'serve') {
    const message = 'This file is for a running vite dev server and is not copied to a build';
    fs.writeFileSync('./index.html', `<h1>${message}</h1>\n`);
    fs.writeFileSync('./main.js', `/** ${message} */\n\nimport './src/main.ts';\n`);
  }

  const plugins = [tsconfigPaths()];

  plugins.push(
    {
      name: "hmr-handler",
      apply: "serve",
      handleHotUpdate(context) {
        if (context.file.startsWith(outDir)) return;

        if (context.file.endsWith(".hbs")) {
          const basePath = context.file.slice(context.file.indexOf("templates/"));
          console.log(`Updating template file at ${basePath}`);
          fs.promises.copyFile(context.file, `${outDir}/${basePath}`).then(() => {
            context.server.ws.send({
              type: "custom",
              event: "template-update",
              data: { path: `modules/${moduleName}/${basePath}` },
            });
          });
        }
      },
    },
  );

  return {
    publicDir: 'static',
    base: `/modules/${moduleName}/`,
    server: {
      port: 30001,
      open: '/',
      proxy: {
        '^(?!/modules/pf2e-ratings)': 'http://localhost:30000/',
        '^/modules/pf2e-ratings/storage': 'http://localhost:30000/',
        '/socket.io': {
          target: 'ws://localhost:30000',
          ws: true,
        },
      }
    },
    esbuild: { keepNames: true },
    build: {
      outDir: outDir,
      emptyOutDir: false,
      sourcemap: true,
      lib: {
        name: moduleName,
        entry: 'src/main.ts',
        formats: ['es'],
        fileName: 'main'
      },
      target: 'es2022',
    },
    plugins
  }
});

export default config;
