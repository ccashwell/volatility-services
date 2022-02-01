/* eslint-disable camelcase */
/* eslint-disable max-len */
module.exports = {
  apps : [{
    name: "volatility-services",
    script: "SERVICEDIR=dist/services TS_NODE_BASEURL=./dist node -r tsconfig-paths/register node_modules/.bin/moleculer-runner --config dist/moleculer.config.js",
    env: {
      NODE_ENV: "development",
      AWS_PROFILE: "vg",
      AWS_REGION: "us-east-1",
      LOG_LEVEL: "debug"
    },
    env_production: {
      NODE_ENV: "production",
      APP_NAME: "volatility-services",
      AWS_PROFILE: "vg",
      AWS_REGION: "us-east-1",
      NEW_RELIC_LICENSE_KEY: "ba2e72fd105fd15c4f15fa19c8c86370FFFFNRAL",
      NEW_RELIC_DISTRIBUTED_TRACING_ENABLED: "true",
      NEW_RELIC_APP_NAME: "${APP_NAME}",
      NEW_RELIC_LOG_LEVEL: "info"
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
