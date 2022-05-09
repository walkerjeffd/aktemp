# Dependencies

Set environmental variables

```sh
source .env.<NODE_ENV>.local
# or (manually)
export REGION=
export DB_SECRET_NAME=
export NOTIFY_TOPIC=
```

Run using node

```sh
node process.js files <id>
```

# Build, Run and Deploy

## AWS ECR

### Development

```bash
# config
source .env.development.local

# log in
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_REPO}

# build image (Intel chip)
docker build -t ${AWS_REPO} .

# build image (Mac M1 chip)
# ref: https://stackoverflow.com/questions/67361936/exec-user-process-caused-exec-format-error-in-aws-fargate-service
docker buildx build --platform=linux/amd64 -t ${AWS_REPO} .

# push to ecr repo
docker push ${AWS_REPO}
```
