const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo support — let Metro see the workspace root and its node_modules.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Drizzle migrations: el archivo `migrations.js` generado por drizzle-kit
// hace `import m0000 from './0000_xxx.sql'`. Metro no resuelve .sql por
// defecto — lo añadimos a sourceExts para que lo trate como módulo y
// expo-sqlite/drizzle-orm reciban el SQL crudo como string al arrancar.
config.resolver.sourceExts.push('sql');

// expo-sqlite web: el worker importa `./wa-sqlite.wasm` como binario.
// Metro no resuelve .wasm por defecto — lo añadimos a assetExts (NO a
// sourceExts: wasm es asset binario, no source). Sin esto, el bundle
// web peta con "Unable to resolve module wa-sqlite.wasm".
config.resolver.assetExts.push('wasm');

// expo-sqlite web (parte 2): wa-sqlite usa SharedArrayBuffer, que el
// navegador solo expone si el servidor manda dos headers de aislamiento
// (COOP + COEP). En dev, Expo no los pone solo — los inyectamos aquí.
// En producción habrá que configurarlos en el host (Vercel/Netlify/etc).
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  },
};

module.exports = withNativeWind(config, {
  input: './src/global.css',
});
