var express = require('express');
var router = express.Router()
const Mongo = require('../bin/mongo') ;
const ObjectId = require('mongodb').ObjectId;

/* lister les différents flipBook */
router.get('/', function(req, res, next) {
  Mongo.getInstance().collection('flipbook').find({status:"published"}).toArray((err, books)=> {
    res.render('index', {title:"Bienvenue dans notre  bibliotheque collaborative ", books:books});
  })
});

/* retourner en JSON les données liée à un flipBook dont l'id est dans l'url */
router.get('/:id', function(req, res, next) {

  // console.log('id demandé', req.params.id)
  if(req.params.id !== 'azerty') {
    return next() ;
  }
  res.json({
    title:'mon flipbook',
    pages:[
      {
        content:'contenu de la page 1'
      },
      {
        content:'contenu de la page 2'
      },
    ],
    description:"description",
    pubisher : "Machin bidule",
    publishDate : '2020/05/10 à 10:30'
  })
});

module.exports = router;
