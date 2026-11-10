module.exports = {
  apps: [
    {
      name: "draw-the-imposter-server",
      script: "src/index.js",
      cwd: __dirname,
      env: { NODE_ENV: "production", PORT: 3000 },
      autorestart: true,
      max_memory_restart: "300M",
    },
  ],
};
