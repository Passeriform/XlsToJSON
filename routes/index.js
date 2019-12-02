/* Legacy Modules */
const express = require('express');
const mongodb = require('mongodb');
const multer = require('multer');
var xlstojson = require("xls-to-json");
var xlsxtojson = require("xlsx-to-json");

/* Import Utils */
const debugLog = require('utils/DebugLogger');


/* Custom Options */
const Options = require('models/Options');


/* Custom Variables */
const {
  locationDB
} = require('models/CustomVariables');


/* Module Pre-Init */
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, Options.uploadSuffix);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname.split('.')[0] + '-' + Date.now() + '.' + file.originalname.split('.')[1]);
  }
});

const upload = multer({
  storage: storage,
  limits: Options.fileLimit
}).single('uploadFile');


/* Routes */

// Index Display
router.get('/', (req, res) => {
    res.render('index');
});

// Return Structure JSON
router.get('/getJSON', (req, res) => {
  xlsxtojson({
      input: Options.uploadSuffix + '/' + req.query.URL,
      output: 'response.json',
      lowerCaseHeaders:true
  }, (err, result) => {
    if(err) {
      debugLog.info('Error converting spreadsheet to JSON');
      res.status(500).json(err);
    }
    else {
      debugLog.info('Sending converted JSON');
      res.status(200).json(result);
    }
  });
});

// Upload File Route
router.post('/uploadXLS', (req, res) => {
  const xmlloc = req.app.get('db').collection(locationDB);

  upload(req, res, (err) => {
    if (err) {
      debugLog.error('File couldn\'t be uploaded', err);
      res.status(500).send(err);
    }
    else if (!req.file) {
      debugLog.error('No file provided');
      res.status(500).send('No file was sent');
    }
    else {
      const feed = {
        FileName: req.file.originalname,
        DownloadURL: req.file.path,
      };

      xmlloc.insertOne(feed, (insertErr, insertResult) => {
        if (insertErr) {
          debugLog.error('Can\'t insert url into database', insertErr);
          res.status(500).send(insertErr);
        }
        else {
          debugLog.success('Inserted into database');
          res.status(200).send(req.file.filename)
        }
      });
    }
    return true;
  });
});

/* Module Exports */
module.exports = router;
