require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const fileName = uuidv4() + '.' + file.originalname.split('.').pop();
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    res.status(200).send(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(fileName)}`);
  } catch (err) {
    console.error('Error uploading file: ', err);
    res.status(500).send(err);
  }
});

app.listen(3001, () => console.log('Server started on port 3001'));

module.exports = app