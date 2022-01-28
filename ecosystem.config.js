/* eslint-disable camelcase */
/* eslint-disable max-len */
module.exports = {
  apps : [{
    name: "volatility-services",
    script: "SERVICEDIR=dist/services TS_NODE_BASEURL=./dist node -r tsconfig-paths/register node_modules/.bin/moleculer-runner --config dist/moleculer.config.js",
    watch: ".",
    env: {
      NODE_ENV: "development",
      AWS_PROFILE: "vg",
      AWS_REGION: "us-east-1"
    },
    env_production: {
      NODE_ENV: "production",
      AWS_PROFILE: "vg",
      AWS_REGION: "us-east-1"
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
