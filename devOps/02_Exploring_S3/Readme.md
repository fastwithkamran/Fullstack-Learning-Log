# Amazon S3 and Node.js Interview Revision Notes

This folder demonstrates Amazon S3 integration with the AWS SDK for JavaScript v3. The [`index.js`](index.js) example generates presigned download and upload URLs and includes examples for listing and deleting objects.

## 1. What Is Amazon S3?

Amazon S3 is highly durable object storage for unstructured data such as images, videos, documents, backups, and build artifacts. An S3 object consists of:

- **Bucket:** A globally unique container for objects.
- **Key:** The object's full name, including any prefix, such as `images/user-uploads/avatar.jpg`.
- **Value:** The file contents.
- **Metadata:** Information such as content type, size, and custom metadata.

S3 is not a relational or document database. It is optimized for storing and retrieving objects, not for filtering records with database-style queries or enforcing relationships.

## 2. S3's Flat Namespace

S3 has no real directories. A path such as `images/user-uploads/photo.jpg` is one object key containing prefixes separated by `/`. The Console displays those prefixes as folders for convenience. A "folder" created in the Console is commonly represented by a zero-byte placeholder object ending in `/`.

When listing objects, use `Prefix` to filter keys:

```js
new ListObjectsV2Command({
  Bucket: bucketName,
  Prefix: "images/user-uploads/",
});
```

For large result sets, continue with the returned `NextContinuationToken` until `IsTruncated` is false.

## 3. The AWS SDK Workflow in This Example

The code uses AWS SDK v3's modular packages:

```js
const { S3Client, GetObjectCommand, PutObjectCommand } =
  require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
```

1. `S3Client` is configured with a region and credentials.
2. A command describes the requested S3 operation.
3. `getSignedUrl` creates a temporary URL signed with the application's IAM permissions.
4. The browser can use that URL without receiving permanent AWS credentials.

The example's operations are:

- `GetObjectCommand`: Generate a temporary download URL.
- `PutObjectCommand`: Generate a temporary upload URL with a specified `ContentType`.
- `ListObjectsV2Command`: Retrieve objects in a bucket or under a prefix.
- `DeleteObjectCommand`: Delete an object when the IAM policy permits it.

## 4. Presigned URLs

Presigned URLs are temporary, scoped credentials embedded in a URL. The backend signs a specific operation, bucket, key, and expiry time; the client then sends the request directly to S3.

### Download flow

```text
Client -> Backend: request file access
Backend -> S3 SDK: sign GetObject request
Backend -> Client: return temporary URL
Client -> S3: download object using the URL
```

### Upload flow

```text
Client -> Backend: request upload permission
Backend -> S3 SDK: sign PutObject request
Backend -> Client: return temporary upload URL
Client -> S3: upload file directly
Client -> Backend: save object key and metadata
```

This keeps large file traffic away from the application server. Validate the user's authorization, file name, size, and content type on the backend before issuing an upload URL. Use a short expiry and restrict the key prefix where possible.

## 5. Security and IAM

- Keep **Block Public Access** enabled unless public access is an intentional, reviewed requirement.
- Give the application least-privilege permissions such as access to one bucket and limited prefixes.
- Never commit access keys, secret keys, or `.env` files.
- Use IAM roles for EC2, ECS, Lambda, or other AWS workloads instead of long-lived keys when possible.
- Use a secret manager for credentials outside local development.
- Enable bucket encryption, versioning, access logging, and lifecycle rules according to the data's needs.
- Treat object keys and metadata as untrusted input; validate names and content types.

`Block Public Access` blocks unauthenticated public requests. It does not prevent authorized requests made with IAM credentials or temporary presigned URLs.

## 6. S3 Compared With Other Services

| Service | Best suited for |
| --- | --- |
| S3 | Durable object storage and static files |
| MongoDB/PostgreSQL | Structured application data, querying, and relationships |
| CloudFront | CDN caching and low-latency delivery in front of S3 |
| Cloudinary | Managed media transformations such as resizing and format conversion |
| EBS/EFS | Filesystems attached to or shared by compute workloads |

Store a file in S3 and keep its object key, URL, owner, and metadata in the database. Avoid storing large media binaries inside ordinary MongoDB documents or relational rows unless there is a specific reason and design for it.

## 7. S3 Consistency, Durability, and Cost

- **Durability:** S3 is designed for extremely high durability by redundantly storing data across facilities within a region.
- **Availability:** Durability and availability are different. Durability concerns losing data; availability concerns whether the service is reachable.
- **Storage classes:** Choose among classes such as Standard, Intelligent-Tiering, and Glacier based on access frequency and retrieval requirements.
- **Lifecycle rules:** Automatically transition or expire objects to control cost.
- **Versioning:** Retains older versions and helps recover from accidental overwrites or deletes, but increases storage costs.

## 8. Common Interview Questions

**Is S3 a database?**  
No. S3 stores objects identified by keys. Use a database for structured records, indexing, relationships, and transactional queries.

**Why use a presigned URL?**  
It grants temporary access to one S3 operation without exposing long-lived AWS credentials and lets the client transfer large files directly to S3.

**Does a presigned URL make an object public?**  
No. It provides time-limited access to a particular signed request. The bucket can remain private.

**Why use CloudFront with S3?**  
CloudFront caches objects at edge locations, reducing latency and origin traffic. It also supports controls such as signed URLs, signed cookies, and a custom domain.

**How do you make S3 uploads secure?**  
Authenticate the user, authorize the intended key, restrict size and content type, issue a short-lived presigned URL, keep the bucket private, and scan or validate uploaded content asynchronously.

**Why not store images in MongoDB?**  
Large binaries increase database size and backup cost, compete with application data for resources, and are less convenient to deliver through a CDN. Store the object in S3 and metadata in MongoDB.

**What is the difference between `PutObject` and `Upload`?**  
`PutObject` is a single object upload operation. Higher-level upload helpers can manage multipart uploads, which are better for large files and can retry parts independently.

**How would you list every object?**  
Call `ListObjectsV2` repeatedly, using `NextContinuationToken` while `IsTruncated` is true. For a subset, provide a `Prefix`.

## 9. Five-Minute Revision Checklist

- Explain bucket, key, object, prefix, metadata, and storage class.
- Describe the presigned upload and download flows.
- Explain why private buckets and least-privilege IAM matter.
- Compare S3 with a database, CloudFront, and Cloudinary.
- Explain durability versus availability.
- Mention pagination, lifecycle rules, versioning, encryption, and direct-to-S3 uploads.
- Identify why credentials must come from environment configuration or IAM roles, never source control.
