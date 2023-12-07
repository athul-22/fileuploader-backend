const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:admin@cluster0.pxfdxzk.mongodb.net/mern_todo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully!');
});

// Cloudinary
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

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Upload the file to Cloudinary
    const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path, {
      folder: 'your_folder_name', // folder in Cloudinary account
      public_id: `${Date.now()}_${req.file.originalname}`, // Use a unique public_id
    });

    const file = new File({
      originalname: req.file.originalname,
      filename: cloudinaryUpload.public_id,
      mimetype: req.file.mimetype,
      fileLink: cloudinaryUpload.secure_url, // Update fileLink to Cloudinary URL
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
    res.status(500).json({ error: 'Error fetching files' });
  }
});

// Serve static files
app.use('/public', express.static('./public'));

app.listen(3001, () => {
  console.log('Server is running');
});

