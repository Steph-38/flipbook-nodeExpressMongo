var express = require('express');
var createError = require('http-errors');
var router = express.Router();
const Mongo = require('../bin/mongo') ;
const ObjectId = require('mongodb').ObjectId
const uniqueId = require('uniqid') ;
const multer = require('multer');
const fs = require('fs')

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, __dirname + "/../uploadedFiles");
  },
  filename: function (req, file, cb) {
    let ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
    let fileName = uniqueId('pdfFile-') + ext ;
    cb(null, fileName);
  }
});
const upload = multer({storage: storage});


//
// const upload = multer({ dest: __dirname + "/../uploadedFiles" })

/* admin avec formulaire login/creation */
router.get('/', function(req, res, next) {
  if(req.session && req.session.user)
    return next() ;
  res.render('admin/index', {title:"flipBook"});
});

router.use(function(req, res, next) {
  // si la session n'exite pas
  if(!req.session || !req.session.user)
    return next(createError(403));
  return next();
})

/* retourne le dashboard */
router.get('/', function(req, res, next) {
  Mongo.getInstance().collection('flipbook').find().toArray((err, books)=> {
    res.render('admin/dashboard', {title:"Administration des FlipBook", books:books});
  })
});

/* creation d'un filpbook */
router.post('/', upload.single('file'), function(req, res, next) {

  let errors = [] ;
  if(!req.body.name || !/(.{4,})/.test(req.body.name)) {
    errors.push('Nom du livre') ;
  }
  if(!req.body.description || !/(.{4,})/.test(req.body.description)) {
    errors.push('Résumé') ;
  }
  if(!req.file || !req.file.filename) {
    errors.push('Fichier PDF') ;
  }

  if(errors.length)
    return next(createError(412, "Merci de vérifier les champs : "+errors.join(', ')));

  let datas = {
    name: req.body.name,
    description: req.body.description,
    file: req.file.filename,
    publisher:req.session.user.username,
    publishDate:new Date(),
    status:'draft'
  };

  Mongo.getInstance().collection('flipbook').insertOne(datas, (err, result) => {
    if(err) {
      return next(createError(400));
    }
    res.redirect('/admin');
  })
});

/* detail d'un filpbook */
router.get('/:id', function(req, res, next) {
  Mongo.getInstance().collection('flipbook').findOne({_id:new ObjectId(req.params.id)}, (err, book) => {
    if(err)
      return res.json({status : false, message:err.message});
    res.json({status : !!book._id, datas:book});
  })

});

/* edition d'un filpbook */
router.put('/:id', function(req, res, next) {

  let errors = [] ;
  if(!req.body.name || !/(.{4,})/.test(req.body.name)) {
    errors.push('Nom du livre') ;
  }
  if(!req.body.description || !/(.{4,})/.test(req.body.description)) {
    errors.push('Résumé') ;
  }

  if(errors.length)
    return next(createError(412, "Merci de vérifier les champs : "+errors.join(', ')));

  let datas = {
    name: req.body.name,
    description: req.body.description,
  };
  Mongo.getInstance().collection('flipbook').updateOne({_id:new ObjectId(req.params.id)}, {$set:datas}, (err, result) => {
    if(err)
      return res.json({status : false, message:err.message});
    res.json({status : result.modifiedCount === 1});
  })

});

/* suppression d'un filpbook */
router.delete('/:id', function(req, res, next) {

  Mongo.getInstance().collection('flipbook').findOne({_id:new ObjectId(req.params.id)}, (err, book) => {
    if(err)
      return res.json({status : false, message:err.message});
    if(!book._id)
      return res.json({status : false, message:'document non trouvé'});

    Mongo.getInstance().collection('flipbook').deleteOne({_id:new ObjectId(req.params.id)}, (err, result) => {
      if(err)
        return res.json({status : false, message:err.message});
      if (fs.existsSync(__dirname + '/../uploadedFiles/' + book.file)) {
        fs.unlinkSync( __dirname + '/../uploadedFiles/'+book.file) ;
      }
      res.json({status : result.deletedCount === 1});
    })

  })

});

module.exports = router;
