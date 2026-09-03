# AWS Deployment, Route 53, Linux, and GitHub Flow

Interview revision notes for deploying the Express application in this folder to an Ubuntu EC2 instance. The deployment path is:

```text
Browser -> Route 53 -> EC2 public IP -> Nginx:80 -> Node.js/PM2:3000
```

## 1. EC2 Deployment Flow

1. Launch an Ubuntu EC2 instance and attach a security group.
2. Allow SSH on port `22` only from your own IP where possible. Allow HTTP `80` and HTTPS `443` from the internet. Port `3000` should normally remain private behind Nginx.
3. Connect with SSH or EC2 Instance Connect.
4. Install Node.js, clone the repository, and install dependencies.
5. Run the app with PM2 so it survives the terminal closing and can restart after a reboot.
6. Configure Nginx as a reverse proxy from ports `80`/`443` to `localhost:3000`.
7. Point a DNS record at the instance and verify the application using the domain name.

The [`server.js`](server.js) application reads `process.env.PORT` and falls back to `3000`, which allows the same code to run locally and on EC2.

## 2. Server Setup Commands

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git nginx -y

# Install Node.js through NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install --lts

git clone https://github.com/fastwithkamran/Fullstack-Learning-Log.git
cd Fullstack-Learning-Log/devOps/01_Deploying_to_AWS
npm install
```

For repeatable production installs, commit the lockfile and prefer `npm ci` instead of `npm install`.

## 3. PM2 and Nginx

```bash
npm install -g pm2
pm2 start server.js --name node-app
pm2 save
pm2 startup

pm2 status
pm2 logs node-app
pm2 restart node-app
```

PM2 is a process manager, not a reverse proxy. Nginx accepts public web traffic, can terminate TLS, serves static files, and forwards application requests to Node.js.

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
curl http://localhost:3000
curl -I http://example.com
```

## 4. DNS and Route 53

DNS translates human-readable names into addresses. A typical lookup goes through the resolver, root name servers, TLD name servers, and the domain's authoritative name servers before returning a record.

### Important Records

| Record | Purpose |
| --- | --- |
| `A` | Maps a name to an IPv4 address |
| `AAAA` | Maps a name to an IPv6 address |
| `CNAME` | Maps a subdomain to another hostname; not normally used at the zone apex |
| `Alias` | AWS Route 53 feature that points to supported AWS resources, including load balancers and CloudFront |
| `MX` | Specifies mail servers |
| `TXT` | Verification and policy text such as SPF or domain ownership |
| `NS` | Identifies the authoritative name servers for a zone |

For this EC2 example, an `A` record can map `api.example.com` to the instance's public IPv4 address. An Elastic IP is preferable because an EC2 public IP can change when the instance stops and starts. A common production design points Route 53 to an Application Load Balancer instead.

### Route 53 Routing Policies

- **Simple:** Return one record or resource.
- **Weighted:** Split traffic by weights, useful for canary releases or A/B testing.
- **Latency-based:** Return the region with the lowest measured latency.
- **Failover:** Use a primary record until a health check fails, then return the secondary.
- **Geolocation:** Route based on the user's geographic location.
- **Geoproximity:** Route based on location and optional geographic bias.
- **Multivalue answer:** Return multiple healthy records for basic client-side distribution.

Weighted traffic share can be estimated as:

$$\text{Traffic Share} = \frac{\text{Record Weight}}{\text{Total Weight}} \times 100$$

Route 53 routing happens at DNS lookup time. It is not an HTTP reverse proxy and does not inspect application paths or request bodies.

### DNS and Nginx Together

Route 53 directs the browser to the server IP, then the browser sends the domain in the HTTP `Host` header. Nginx uses `server_name` to select the correct virtual host and proxies the request to Node.js. DNS does not replace Nginx; they solve different problems.

## 5. Linux Commands for an EC2 Server

### Files and Permissions

```bash
pwd                         # Show the current directory
ls -la                      # List files, including hidden files
cd /path/to/app             # Change directory
find . -name "*.log"       # Find matching files
cat .env                    # Print a file; avoid exposing secrets in shared terminals
chmod 755 script.sh         # Set owner rwx, group rx, others rx
chmod +x script.sh          # Add execute permission
chown ubuntu:ubuntu file    # Change owner and group
```

Permission numbers represent owner, group, and others: `r=4`, `w=2`, and `x=1`. Avoid using `chmod 777`; grant only the permissions required.

### Processes, Resources, and Logs

```bash
ps aux | grep node          # Find processes
top                         # Monitor CPU and memory
free -h                     # Show memory usage
df -h                       # Show disk usage
du -sh ./*                  # Show directory sizes
ss -tulpn                   # Show listening ports and processes
kill <PID>                  # Ask a process to stop
kill -9 <PID>               # Force stop only when necessary
```

### Services and Networking

```bash
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo journalctl -u nginx -n 100 --no-pager
curl http://localhost:3000
ping example.com            # ICMP diagnostic; may be blocked by security groups
```

`ping` uses ICMP and has no port. HTTP uses TCP port `80`, and HTTPS uses TCP port `443`, so a failed ping does not prove that a web server is unavailable.

## 6. GitHub Flow

GitHub Flow is a lightweight branch-based workflow:

1. Create a short-lived branch from the default branch.
2. Make focused commits and push the branch.
3. Open a pull request and describe the change and validation.
4. Review, run CI checks, and address feedback.
5. Merge the approved pull request.
6. Deploy from the updated default branch and delete the old branch.

```bash
git switch main
git pull origin main
git switch -c feature/route53-notes

git status
git add 01_Deploying_to_AWS/ReadMe.md
git commit -m "docs: add Route 53 and Linux revision notes"
git push -u origin feature/route53-notes

# After the pull request is merged
git switch main
git pull origin main
git branch -d feature/route53-notes
```

Good GitHub Flow habits: keep branches small, write meaningful commit messages, never commit secrets, review the diff before pushing, and use pull requests to run automated checks before deployment.

## 7. Interview Questions

**What is the difference between Route 53 and Nginx?**

Route 53 resolves domain names to targets through DNS. Nginx receives HTTP traffic at the target and routes it to the application.

**Why use an Elastic IP for EC2 DNS?**

An ordinary public IP may change after a stop/start. An Elastic IP provides a stable address for an `A` record, though a load balancer is often better for production availability.

**Why use Nginx in front of Node.js?**

It provides a public entry point, TLS termination, reverse proxying, buffering, static file serving, and a place to add routing and security controls.

**What happens when Nginx configuration is changed?**

Run `sudo nginx -t` first. If valid, reload with `sudo systemctl reload nginx` so existing connections are disturbed as little as possible.

**What problem does PM2 solve?**

It keeps the Node.js process running, restarts it after crashes, manages logs, and can restore the process list after a reboot.

**What is GitHub Flow?**

It is a pull-request workflow using short-lived feature branches, review and CI, then merging into the deployable default branch.

## 8. Deployment Troubleshooting Order

1. Check the EC2 instance and security group rules.
2. Check DNS resolution with `nslookup example.com` or `dig example.com`.
3. Check that Node.js is listening with `ss -tulpn` and inspect `pm2 logs`.
4. Test the app locally with `curl http://localhost:3000`.
5. Validate Nginx with `sudo nginx -t` and inspect its journal.
6. Check the domain, `server_name`, ports `80`/`443`, and HTTPS certificate configuration.

## 9. Five-Minute Revision Checklist

- Explain the request path from Route 53 to Node.js.
- Compare `A`, `CNAME`, Alias, `MX`, and `TXT` records.
- Explain why an Elastic IP or load balancer matters.
- Demonstrate `systemctl`, `journalctl`, `ss`, `curl`, `df`, and `ps`.
- Explain PM2 versus Nginx.
- Describe GitHub Flow from branch creation to deployment.
- Diagnose a domain that resolves but returns `502 Bad Gateway`.
