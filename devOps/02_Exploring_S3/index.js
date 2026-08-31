require('dotenv').config()
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});

// Get Object URL
async function getObjectURL(key) {
  const command = new GetObjectCommand({
    Bucket: "aws-s3-936274645289-ap-south-1-an",
    Key: key,
  });
  const url = await getSignedUrl(s3Client, command);
  return url;
}

// Put Object
async function putObjectURL(fileName, contentType) {
  const command = new PutObjectCommand({
    Bucket: "aws-s3-936274645289-ap-south-1-an",
    Key: `images/user uploads/${fileName}`,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3Client, command);
  return url;
}

// Get All bucket objects
async function listObject() {
  const command = new ListObjectsV2Command({
    Bucket: "aws-s3-936274645289-ap-south-1-an",
    Key: `/`,
  });

  const res = await s3Client.send(command);
  console.log(res);
}

async function init() {
    console.log(
      "Object URL: ",
      await getObjectURL("images/user uploads/image-1788197428741.jpg"),
    );

  //   console.log(
  //     "Image Upload URL: ",
  //     await putObjectURL(`image-${Date.now()}.jpg`, "image/jpg"),
  //   );

  //   await listObject();

  // Delete Object
  // const command = new DeleteObjectCommand({
  //   Bucket: "aws-s3-936274645289-ap-south-1-an",
  //   Key: `Kamran.png`,
  // });

  // await s3Client.send(command);
  // console.log("Object deleted success");
}

init();
