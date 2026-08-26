# Curve & Comfort CI/CD deployment to AWS EC2

The workflow in `.github/workflows/deploy.yml` deploys this app to EC2:

- Push to `main`: build backend/frontend images, push to Docker Hub, and deploy
  that exact commit to EC2.
- Manual run: use **Actions > Deploy to EC2 > Run workflow**.

The production stack is Nginx, Next.js, Express, Redis, and MongoDB Atlas.

## Deployment checklist

- Create Docker Hub repos: `curve-comfort-backend`, `curve-comfort-frontend`.
- Add EC2 inbound rules for SSH `22`, HTTP `80`, and HTTPS `443`.
- Install Docker and Docker Compose plugin on EC2.
- Add the EC2 public IP to MongoDB Atlas Network Access.
- Add GitHub Actions secrets listed below.
- Make `PROD_MONGODB_URI` include `/ecomerce-production`, not just the cluster host.
- Push to `main` or run the workflow manually.
- Verify on EC2 with `docker compose -f docker-compose.prod.yml --env-file .env ps`.

## 1. Protect secrets before the first pipeline commit

This repository currently tracks `.env` and `.env.development`. Adding them to
`.gitignore` does not untrack existing files.
Rotate every credential those files have ever contained, then run:

```bash
git rm --cached .env .env.development
git add .gitignore docs/.env.example
```

Do not delete your local files. `git rm --cached` only removes them from future
commits. If the repository was public or shared, assume the old values are
compromised and rotate them before deployment.

## 2. Create Docker Hub repositories

Create these repositories under your Docker Hub account or organization:

- `curve-comfort-backend`
- `curve-comfort-frontend`

Create a Docker Hub access token with read/write permission.

## 3. Create and prepare EC2

Recommended starting point:

- Ubuntu Server 24.04 LTS
- `t3.small` or larger
- 20 GB or more gp3 storage
- Elastic IP

Allow inbound TCP 22 from an appropriate deployment source, and ports 80/443
from the internet. GitHub-hosted runner IPs change; for strict SSH access use a
self-hosted runner, VPN, or bastion.

Install Docker and Git:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
sudo mkdir -p /opt/curve-comfort
sudo chown ubuntu:ubuntu /opt/curve-comfort
```

Reconnect after adding the user to the Docker group. If the GitHub repository is
private, clone it into `/opt/curve-comfort` manually with a read-only deploy key;
the automatic HTTPS clone is intended for a public repository.

## 4. Prepare MongoDB Atlas

Create a production database and user. Add the EC2 Elastic IP to Atlas Network
Access. Use a connection string similar to:

```text
mongodb+srv://<db_username>:<db_password>@curve-and-comfort.lvwb3ba.mongodb.net/ecomerce-production?retryWrites=true&w=majority&appName=curve-and-comfort
```

URL-encode special characters in usernames and passwords.

## 5. Configure deployment SSH

Create a dedicated SSH key. Add its public key to
`/home/ubuntu/.ssh/authorized_keys` on EC2. Store the complete private key in the
GitHub secret `EC2_SSH_KEY`.

Get the server fingerprint from a trusted EC2 session:

```bash
sudo ssh-keygen -l -E sha256 -f /etc/ssh/ssh_host_ed25519_key.pub
```

Store only the `SHA256:...` value as `EC2_HOST_FINGERPRINT`.

## 6. GitHub Actions secrets

Add these under **Settings > Secrets and variables > Actions**:

| Secret | Purpose |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub account or organization |
| `DOCKERHUB_TOKEN` | Docker Hub read/write token |
| `EC2_HOST` | EC2 Elastic IP or hostname |
| `EC2_USER` | Optional; defaults to `ubuntu` |
| `EC2_SSH_KEY` | Complete private deployment key |
| `EC2_HOST_FINGERPRINT` | SSH `SHA256:...` fingerprint |
| `PROD_MONGODB_URI` | MongoDB Atlas URI |
| `PROD_FRONTEND_URL` | Public URL, such as `https://example.com` |
| `PROD_CORS_ORIGIN` | Allowed comma-separated public origins |
| `PROD_JWT_ACCESS_SECRET` | Random secret of at least 32 bytes |
| `PROD_JWT_REFRESH_SECRET` | Different random secret of at least 32 bytes |

Optional secrets:

- `PROD_HTTP_PORT` (defaults to `80`)
- `PROD_COOKIE_DOMAIN`
- `PROD_SMTP_HOST`, `PROD_SMTP_PORT`, `PROD_SMTP_SECURE`
- `PROD_SMTP_USER`, `PROD_SMTP_PASS`, `PROD_MAIL_FROM`

Generate JWT secrets with `openssl rand -hex 32` twice.

## 7. First deployment

Push the pipeline and application changes to `main`. The workflow publishes the
images and deploys to EC2.

You can also use **Actions > Deploy to EC2 > Run workflow**.

On EC2, verify:

```bash
cd /opt/curve-comfort
docker compose -f docker-compose.prod.yml --env-file .env ps
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=100
curl -I http://127.0.0.1/health # redirects to the admin-only health endpoint
docker compose -f docker-compose.prod.yml --env-file .env exec -T backend node -e "fetch('http://127.0.0.1:5000/api/v1/health/internal').then(r => process.exit(r.ok ? 0 : 1))"
curl http://127.0.0.1/
```

## HTTPS

The supplied Nginx configuration publishes HTTP. Before production launch, add
TLS certificates, port 443, renewal, and an HTTP-to-HTTPS redirect. Until HTTPS
is active, secure cookies will not work in browsers; do not treat an HTTP-only
deployment as production-ready authentication.
