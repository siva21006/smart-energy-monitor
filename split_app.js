import fs from 'fs';
import path from 'path';

const serverTs = fs.readFileSync('server.ts', 'utf-8');

const splitPoint = serverTs.indexOf('// Vite & Production Static Handling');

const appTsContent = serverTs.substring(0, splitPoint) + '\nexport default app;\n';

const serverTsContent = `import app from './src/app.js';
import express from 'express';
import path from 'path';

const PORT = process.env.PORT || 3000;

// Vite & Production Static Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const viteModuleName = 'vite';
    const { createServer: createViteServer } = await import(viteModuleName);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // Explicitly serve index.html in dev mode
    app.use(async (req, res, next) => {
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on http://0.0.0.0:\${PORT}\`);
  });
}

startServer();
`;

fs.writeFileSync('src/app.ts', appTsContent);
fs.writeFileSync('server.ts', serverTsContent);

const apiIndexTs = `import app from '../src/app.js';\n\nexport default app;\n`;
fs.writeFileSync('api/index.ts', apiIndexTs);

console.log("Split successful");
