module.exports = {
  apps: [
    {
      name: 'qflow-backend',
      script: './backend/src/app.js',
      instances: 'max',          // one process per CPU core
      exec_mode: 'cluster',      // Node.js cluster mode — shared port
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      max_memory_restart: '512M',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
