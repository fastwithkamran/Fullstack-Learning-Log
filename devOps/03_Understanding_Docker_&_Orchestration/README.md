# Docker and Orchestration Interview Revision Notes

This folder contains a small Express service packaged with Docker.

## 1. The Core Model

- **Dockerfile:** Build instructions for an image.
- **Image:** An immutable, versioned package containing application code, runtime, libraries, and metadata.
- **Container:** A running, isolated process created from an image. Containers are disposable by default.
- **Registry:** A service such as Docker Hub, Amazon ECR, or GitHub Container Registry that stores and distributes images.
- **Volume:** Docker-managed storage that lives beyond a container's lifecycle.
- **Network:** A virtual network that lets containers communicate by name and isolates traffic.

### Image vs. Container

An image is the template; a container is a process created from that template. One image can create many containers, each with its own writable layer and runtime state.

### Containers vs. Virtual Machines

| Area | Containers | Virtual machines |
| --- | --- | --- |
| Kernel | Share the host kernel | Include a guest operating system |
| Isolation | Process-level isolation | Hardware-level virtualization |
| Startup | Usually very fast | Usually slower |
| Footprint | Small | Larger |
| Best fit | Portable application workloads | Strong OS isolation or different kernels |

## 2. This Example, Explained

The [`Dockerfile`](Dockerfile) does the following:

```dockerfile
FROM node:slim       # Base image with Node.js and a smaller Debian userspace
WORKDIR /app         # Default directory inside the image
COPY . /app          # Copy project files into the image
RUN npm install      # Install dependencies while building
EXPOSE 3000          # Document the application's listening port
CMD node server.js   # Default command when a container starts
```

The application listens on port 3000 inside the container. `EXPOSE` does not publish that port to the host; `-p 3000:3000` does.

## 3. Commands to Practise

```bash
# Build and inspect an image
docker build -t learning-docker .
docker images

# Run it and publish host port 3000 to container port 3000
docker run --name learning-docker-app -p 3000:3000 learning-docker

# Inspect runtime state and logs
docker ps
docker logs learning-docker-app
docker exec -it learning-docker-app sh

# Stop and remove the container
docker stop learning-docker-app
docker rm learning-docker-app
```

Useful debugging order: check `docker ps`, read `docker logs`, inspect the container, verify port mapping, then check the process command and environment variables.

## 4. Dockerfile and Build Concepts

- **Layers:** Most Dockerfile instructions create cached image layers. Put stable, expensive steps before frequently changing files to improve build speed.
- **`.dockerignore`:** Exclude `node_modules`, secrets, logs, and build output from the build context.
- **`CMD` vs. `ENTRYPOINT`:** `CMD` supplies a default command or arguments; `ENTRYPOINT` makes the main executable harder to replace.
- **`RUN` vs. `CMD`:** `RUN` executes during image creation; `CMD` executes when a container starts.
- **Multi-stage builds:** Use one stage to compile or install tooling and copy only the required artifacts into a smaller runtime stage.
- **Reproducibility:** Pin important dependency and base-image versions, and build images in CI rather than modifying running containers.

Production improvements for this example would include a lockfile with `npm ci`, a non-root user, a health check, a `.dockerignore`, and a multi-stage or minimal runtime image where appropriate.

## 5. Storage, Configuration, and Networking

Container filesystems are ephemeral. Use volumes for stateful local development, and use managed databases or durable cloud storage for most production data. Do not bake passwords or API keys into an image; inject them through environment variables or a secret manager.

Containers on the same user-defined network can reach each other by service name. In Docker Compose, an application can connect to a database using a hostname such as `db`, not `localhost`; `localhost` means the current container.

## 6. Compose vs. Kubernetes

| Tool | Scope | Typical use |
| --- | --- | --- |
| Docker Compose | Multiple containers on one machine | Local development and integration testing |
| Kubernetes | Container workloads across a cluster | Scheduling, scaling, service discovery, and self-healing |
| Amazon ECS/Fargate | Managed AWS container platform | AWS-native deployments without managing Kubernetes control planes |

Kubernetes vocabulary worth remembering:

- **Pod:** Smallest deployable unit; usually contains one application container.
- **Deployment:** Declares the desired number and version of replicated Pods.
- **Service:** Stable network endpoint in front of Pods.
- **ConfigMap/Secret:** Configuration and sensitive values supplied to workloads.
- **Ingress:** HTTP routing from outside the cluster to Services.

Orchestration typically provides scheduling, rolling updates, service discovery, load balancing, health-based replacement, and horizontal scaling. It does not make an application stateless or remove the need for monitoring, backups, security, and capacity planning.

## 7. Production and Security Checklist

- Use a small trusted base image and scan it for vulnerabilities.
- Run as a non-root user and give the container only required permissions.
- Keep containers stateless; externalize databases, files, and queues.
- Add readiness and liveness health checks.
- Set CPU and memory requests/limits in the orchestrator.
- Log to standard output and collect logs centrally.
- Tag images with immutable version identifiers, not only `latest`.
- Push through CI/CD and support rollback to a known image.

## 8. Interview Questions and Short Answers

**Why does Docker help with "it works on my machine"?**  
It makes the runtime, dependencies, and startup process repeatable across environments.

**Does a container have its own kernel?**  
No. Containers share the host kernel, while isolating processes, filesystems, networking, and resources.

**What happens to data when a container is deleted?**  
Data in the writable container layer is deleted. Data in a mounted volume or external service remains.

**Why is `localhost` often wrong for container-to-container communication?**  
It points to the current container. Use the other service's DNS name on a shared network.

**How would you make this image production-ready?**  
Use a lockfile and `npm ci`, add `.dockerignore` and health checks, run as non-root, avoid secrets in the image, pin versions, scan the image, and publish logs and metrics.

**Compose or Kubernetes?**  
Compose is simple for multi-container workloads on one machine. Kubernetes is for cluster-level scheduling, scaling, networking, and recovery.

**How should a database be deployed?**  
Use a container plus a volume for local development or tests. For production, prefer a managed database when its backups, availability, patching, and recovery features justify the cost.

## 9. Five-Minute Revision Checklist

- Explain image, container, registry, volume, and network in one sentence each.
- Build this image and explain every Dockerfile instruction.
- Run it with `-p 3000:3000` and explain both port numbers.
- Diagnose a stopped container using `docker ps -a` and `docker logs`.
- Compare Compose, Kubernetes, and a managed container service.
- Describe how you would handle secrets, persistence, health checks, scaling, and rollback.
