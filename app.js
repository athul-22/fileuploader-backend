// backend/server.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const zlib = require('zlib');

const app = express();
app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:admin@cluster0.pxfdxzk.mongodb.net/mern_todo');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully!');
});

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'tesalab',
  api_key: '129872178934864',
  api_secret: 'C8UsT4h4-uudmbIyoIaZW1MbNwg',
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

const File = mongoose.model('File', {
  originalname: String,
  filename: String,
  mimetype: String,
  fileLink: String,
});

const compressAndUpload = async (filePath, originalname) => {
  return new Promise((resolve, reject) => {
    const compressedStream = fs.createReadStream(filePath).pipe(zlib.createGzip());

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'your_folder_name', public_id: `${Date.now()}_${originalname}`, quality: 50 },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    compressedStream.pipe(uploadStream);
  });
};

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const compressedFile = await compressAndUpload(req.file.path, req.file.originalname);

    const file = new File({
      originalname: req.file.originalname,
      filename: compressedFile.public_id,
      mimetype: req.file.mimetype,
      fileLink: compressedFile.secure_url,
    });

    await file.save();

    console.log('File uploaded successfully:', file);
    res.status(200).json({ message: 'File uploaded successfully', file });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

app.get('/files', async (req, res) => {
  try {
    const files = await File.find();
    res.status(200).json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Error fetching files', details: error.message });
  }
});

app.use('/public', express.static('./public'));

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
