module.exports = {
  apps: [
    {
      name: 'socialhub-app',
      script: 'npm',
      args: 'start',
      cwd: '/root/socialhub_global_v5',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
    // Temporarily disabled until queue files are created:
    // {
    //   name: 'socialhub-queue',
    //   script: 'npm',
    //   args: 'run queue',
    //   cwd: '/root/socialhub_global_v5',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   env: {
    //     NODE_ENV: 'production'
    //   },
    //   error_file: './logs/queue-error.log',
    //   out_file: './logs/queue-out.log',
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    //   merge_logs: true,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '512M'
    // },
    // {
    //   name: 'socialhub-insights',
    //   script: 'npm',
    //   args: 'run insights',
    //   cwd: '/root/socialhub_global_v5',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   env: {
    //     NODE_ENV: 'production'
    //   },
    //   error_file: './logs/insights-error.log',
    //   out_file: './logs/insights-out.log',
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    //   merge_logs: true,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '512M'
    // }
  ]
};

