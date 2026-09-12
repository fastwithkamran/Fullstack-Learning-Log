# Route 53, Linux, and GitHub Flow Interview Notes

This folder contains revision notes for DNS and AWS Route 53, common Linux commands used on EC2 servers, and the GitHub Flow development workflow.

## 1. DNS Fundamentals

DNS translates human-readable domain names into addresses. A lookup commonly goes through a resolver, root name server, TLD name server, and the domain's authoritative name server.

### Domain Structure

- **TLD:** `.com`, `.org`, `.net`
- **Apex domain:** `example.com`
- **Subdomain:** `api.example.com`
- **FQDN:** The complete domain name, including its labels.

### Common DNS Records

| Record | Purpose |
| --- | --- |
| `A` | Maps a name to an IPv4 address |
| `AAAA` | Maps a name to an IPv6 address |
| `CNAME` | Maps a subdomain to another hostname |
| `Alias` | Route 53 record that points to supported AWS resources |
| `MX` | Specifies mail servers |
| `TXT` | Verification and policy text |
| `NS` | Identifies authoritative name servers |

DNS caching is controlled by a record's TTL. A shorter TTL helps changes propagate sooner but causes more DNS lookups.

## 2. AWS Route 53

Route 53 is AWS's managed DNS service. For an EC2 deployment, an `A` record can map `api.example.com` to an Elastic IP. An Elastic IP is more stable than an ordinary EC2 public IP, which may change after a stop/start. In production, Route 53 commonly points to an Application Load Balancer or CloudFront distribution instead.

### Routing Policies

- **Simple:** Return one record or resource.
- **Weighted:** Split traffic by assigned weights for canary releases or A/B testing.
- **Latency-based:** Return the AWS region with the lowest measured latency.
- **Failover:** Use a primary endpoint until a health check fails, then use a secondary.
- **Geolocation:** Route based on the user's geographic location.
- **Geoproximity:** Route based on location with optional geographic bias.
- **Multivalue answer:** Return multiple healthy records for basic distribution.

Weighted traffic share can be estimated as:

$$\text{Traffic Share} = \frac{\text{Record Weight}}{\text{Total Weight}} \times 100$$

Route 53 works at DNS lookup time. It is not an HTTP reverse proxy and does not inspect URL paths or request bodies.

### DNS and Nginx Together

Route 53 directs the browser to an IP or AWS resource. The browser then sends the domain in the HTTP `Host` header. Nginx uses `server_name` to select a virtual host and forwards the request to the Node.js application. DNS and Nginx solve different problems.

## 3. ICMP and Web Traffic

- **ICMP:** Used by `ping` and `traceroute`; it has no port numbers.
- **TCP:** Used by HTTP on port `80` and HTTPS on port `443`.
- **Security groups:** May allow web ports while blocking ICMP, so a failed `ping` does not prove that the web server is unavailable.

## 4. Linux Commands for EC2

### Files and Permissions

```bash
pwd                         # Show the current directory
ls -la                      # List files, including hidden files
cd /path/to/app             # Change directory
find . -name "*.log"       # Find matching files
chmod 755 script.sh         # Set owner rwx, group rx, others rx
chmod +x script.sh          # Add execute permission
chown ubuntu:ubuntu file    # Change owner and group
```

Permission values use `r=4`, `w=2`, and `x=1` for owner, group, and others. Avoid `chmod 777`; use the minimum required permissions.

### Processes, Resources, and Services

```bash
ps aux | grep node          # Find Node.js processes
top                         # Monitor CPU and memory
free -h                     # Show memory usage
df -h                       # Show disk usage
du -sh ./*                  # Show directory sizes
ss -tulpn                   # Show listening ports
kill <PID>                  # Ask a process to stop
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo journalctl -u nginx -n 100 --no-pager
```

Use `reload` after a valid Nginx configuration change to avoid unnecessarily interrupting existing connections. Validate first with `sudo nginx -t`.

### Useful Diagnostics

```bash
curl http://localhost:3000
curl -I https://example.com
nslookup example.com
dig example.com
```

## 5. GitHub Flow

GitHub Flow is a lightweight branch-based workflow:

Official documentation: [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)

1. Create a short-lived branch from the default branch.
2. Make focused commits and push the branch.
3. Open a pull request with the change and validation details.
4. Review the code, run CI checks, and address feedback.
5. Merge the approved pull request.
6. Deploy from the updated default branch and delete the old branch.

```bash
git switch main
git pull origin main
git switch -c feature/route53-notes

git status
git add 04_Understanding_Route53/README.md
git commit -m "docs: add Route 53 revision notes"
git push -u origin feature/route53-notes

# After the pull request is merged
git switch main
git pull origin main
git branch -d feature/route53-notes
```

Good practices include keeping branches small, reviewing `git diff` before committing, writing meaningful commit messages, using pull requests and CI, and never committing secrets.

## 6. Interview Questions

**What is the difference between Route 53 and Nginx?**

Route 53 resolves names through DNS. Nginx receives HTTP traffic and routes it to an application.

**Why use an Elastic IP?**

An ordinary EC2 public IP may change after a stop/start. An Elastic IP gives DNS a stable address, although a load balancer is usually better for production availability.

**Why can a website work when `ping` fails?**

`ping` uses ICMP, while the website uses TCP ports `80` or `443`. Security rules can block ICMP without blocking web traffic.

**What problem does GitHub Flow solve?**

It gives teams a predictable path from isolated changes to reviewed, tested, and deployable code.

**How would you troubleshoot a domain that returns `502 Bad Gateway`?**

Check DNS resolution, confirm the Node.js process is running, test `localhost:3000`, validate Nginx configuration, inspect Nginx and PM2 logs, and verify security group ports.

## 7. Five-Minute Revision Checklist

- Explain DNS resolution and the purpose of Route 53.
- Compare `A`, `AAAA`, `CNAME`, Alias, `MX`, and `TXT` records.
- Explain each Route 53 routing policy and when to use it.
- Demonstrate `systemctl`, `journalctl`, `ss`, `curl`, `df`, and `ps`.
- Explain ICMP versus TCP web traffic.
- Describe GitHub Flow from branch creation to deployment.
- Diagnose a DNS, Nginx, PM2, or port-related deployment failure.
