//Importing libraries that build routes, handle file uploads, and working with file paths
import express from 'express';
import multer from 'multer';
import path from 'path';


//For better structure, created a new router object
const router = express.Router();

//Defines where and how files are saved on the disk
const storage = multer.diskStorage({
    //Set the folder for uploaded files
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    }
    //Saving each file that was uploaded as a time stamp to avoid duplicate naming of files
    filename: (req, file, cb) => {
        cb(null, Date, now() + '-' + file.originalname);
    }
});

//Validating the file name before the file is saved
const fileFilter = (req, file, cb) => {
    //Setting which types are accepted
    const allowedTypes = ['.csv', '.xlsx'];
    //Getting the original file extension
    const ext = path.extreme(file.originalname).toLowerCase();
    //If statement that makes sure the file extension is either .csv or .xlsx, else an error will appear
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only .csv and .xlsx files are allowed!'));
    }
};

//Initialize Multer to tell where the files are saved and which extensions are allowed
const upload = multer({storage, fileFilter});

//Creating a POST route and expecting a single file request
router.post('upload', upload.single("file"), (req, res) => {
    //If statement that sends an error if no file that the user put in was found or returning the confirmation of the file
    if (!req.file) {
        return res,status(400).json({error: "No file uploaded"});
    }
    res.json({
        message: 'File uploaded successfully!',
        file: {
            filename: req.file.filename,
            path: req.file.path,
        },
    });
});
//Makes it possible to import into another .js file
export default router;