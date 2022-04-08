#!/bin/bash
set -o nounset
set -o errexit

INSTANCE=i-0569c3818f19a3283
AZ=us-east-2a

echo -e 'y\n' | ssh-keygen -t rsa -f /tmp/temp -N '' >/dev/null 2>&1
aws ec2-instance-connect send-ssh-public-key \
  --instance-id ${INSTANCE} \
  --availability-zone ${AZ} \
  --instance-os-user ssm-user \
  --ssh-public-key file:///tmp/temp.pub
ssh -i /tmp/temp.pub \
  -Nf -M \
  -L 5432:vg-ue2-stageplatform-cluster.cluster-cceymqxp5c9l.us-east-2.rds.amazonaws.com:5432 \
  -o "UserKnownHostsFile=/dev/null" \
  -o "StrictHostKeyChecking=no" \
  -o ProxyCommand="aws ssm start-session --target %h --document AWS-StartSSHSession --parameters portNumber=%p --region=us-east-2" \
  ssm-user@${INSTANCE}