module.exports = (api) => {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Drizzle migrations: inline-import convierte `import sql from './x.sql'`
    // en `const sql = "<contenido>"` en compile-time. Sin esto, Metro
    // intenta parsear el .sql como JavaScript y peta.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
