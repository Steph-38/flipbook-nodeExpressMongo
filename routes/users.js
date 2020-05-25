var express = require('express');
var createError = require('http-errors');
var router = express.Router();
var uniqid = require('uniqid');
var crypto = require('crypto');
const Mongo = require('../bin/mongo') ;

/* login */
router.put('/', function(req, res, next) {
  if(!req.body.email || !req.body.password) {
    return res.json({
      status : false,
      message:'Merci de remplir le formulaire'
    })
  }
  Mongo.getInstance()
    .collection('users')
    .findOne({$or : [ {email:req.body.email}, {username:req.body.email} ] },
      function (err, user) {
        if(err) {
          return res.json({
            status : false,
            message:err.message
          })
        }
        if(!user ||
          !user._id ||
          crypto.createHash('sha256').update(req.body.password + user.salt).digest('hex') !== user.password) {
          return res.json({
            status : false,
            message:'Merci de vérifier vos identifiants'
          })
        }
        req.session.user = user ;
        return res.json({
          status : true
        })
      })

});

/* creation compte utilisateur => créer un nouveau me  */
router.post('/', function(req, res, next) {

  // intégrité des données
  let errors = [] ;
  if(!req.body.username || !/^([\w\s]{6,})$/.test(req.body.username)) {
    errors.push('Nom utilisateur') ;
  }
  if(!req.body.email || !/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(req.body.email)) {
    errors.push('Email') ;
  }
  if(!req.body.password || !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/.test(req.body.password)) {
    errors.push('Mot de passe') ;
  }
  if(!req.body.password_confirm || req.body.password_confirm !== req.body.password) {
    errors.push('Confirmation du mot de passe') ;
  }

  if(errors.length) {
    return res.json({
        status : false,
        message: "Merci de vérifier les champs : "+errors.join(', ')
      })
  }
  // mdp en clair
  let salt = uniqid();
  // sha256(password+salt)
  let password = crypto.createHash('sha256').update(req.body.password+salt).digest('hex');

  // password_confirm inutile
  let datas = {
    username : req.body.username,
    email : req.body.email,
    password : password,
    salt:salt
  }

  Mongo.getInstance()
    .collection('users')
    .insertOne(datas,
      function (err, result) {
        if(err) {
          if(err.message.indexOf('duplicate key') !== -1) {
            return res.json({
              status : false,
              message:'Votre adresse email existe déjà !'
            })
          }
          return res.json({
            status : false,
            message:err.message
          })
        }
        return res.json({
          status : true
        })
      })

});

// => à partir d'ici l'utilisateur doit etre identifié
router.use(function(req, res, next) {
  // si la session n'exite pas
  if(!req.session || !req.session.user)
    return next(createError(403));
  return next();

})


/* retourne les données à propos de me. */
router.get('/', function(req, res, next) {
  res.json({
    status : true,
    datas : {
      email : '',
      nom : 'Machin Bidule',
    }
  })
});


/* deconnexion */
router.delete('/', function(req, res, next) {
  req.session.destroy();
  res.json({
    status : true
  })
});

module.exports = router;
