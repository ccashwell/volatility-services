#!/bin/bash
set -o nounset
set -o errexit

INSTANCE=i-018b9a8cf7ddb2157
AZ=us-east-2a
TMP=/tmp
REGION=us-east-2
AURORA_ENDPOINT=vg-ue2-stageplatform-cluster.cluster-cceymqxp5c9l.us-east-2.rds.amazonaws.com
BASTION_USER=ssm-user

# This script will create a temporary ssh key and then
# connect to the bastion to port-forward to the aurora db
# in staging
rm -rf /tmp/temp*
echo -e 'y\n' | ssh-keygen -t rsa -f ${TMP}/temp -N '' >/dev/null 2>&1
chmod 600 /tmp/temp && chmod 600 ${TMP}/temp.pub
aws ec2-instance-connect send-ssh-public-key \
  --instance-id ${INSTANCE} \
  --availability-zone ${AZ} \
  --instance-os-user ${BASTION_USER} \
  --ssh-public-key file://${TMP}/temp.pub

ssh -i /tmp/temp \
  -Nf -M \
  -L 5432:${AURORA_ENDPOINT}:5432 \
  -o "UserKnownHostsFile=/dev/null" \
  -o "StrictHostKeyChecking=no" \
  -o ProxyCommand="aws ssm start-session --target %h --document AWS-StartSSHSession --parameters portNumber=%p --region=${REGION}" \
  ${BASTION_USER}@${INSTANCE}
