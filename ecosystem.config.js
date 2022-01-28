/* eslint-disable camelcase */
/* eslint-disable max-len */
module.exports = {
  apps : [{
    name: "volatility-services",
    script: "ts-node -r tsconfig-paths/register --project tsconfig.json ./node_modules/moleculer/bin/moleculer-runner.js --config moleculer.config.ts services/**/*.service.ts NODE_ENV=production",
    watch: ".",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }],

  deploy : {
    production : {
      "user" : "volatility",
      "host" : "ec2-user@ec2-52-90-62-58.compute-1.amazonaws.com",
      "ref"  : "origin/develop",
      "repo" : "https://github.com/VolatilityGroup/volatility-services",
      "path" : "/data/src/volatility",
      "pre-deploy-local": "",
      "post-deploy" : "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": ""
    }
  }
};
