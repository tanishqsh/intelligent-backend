module.exports = {
  apps: [
    {
      name: 'intelligent-backend',
      script: 'dist/index.js',
      watch: true,
      instances: '8',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      autorestart: true,  // Ensure the app restarts on crash
      max_restarts: 10,   // Optional: Limit the number of restarts to avoid infinite loops
      restart_delay: 5000 // Optional: Delay between restarts (in milliseconds)
    }
  ]
};
