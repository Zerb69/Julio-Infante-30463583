'use strict'
const { verify } = require('crypto');
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('isomorphic-fetch');
const data = path.join(__dirname, "data", "db.db");
const admin = path.join(__dirname, "data", "dba.db");
const database = new sqlite3.Database(data, err => {
  if(err){
    return console.error(err.message);
  }
  else{
    console.log("Database conected");
  }
});
const data_admin = new sqlite3.Database(admin, err => {
  if(err){
    return console.error(err.message);
  }
  else{
    console.log("Database of admin conected");
  }
});
const create = "CREATE TABLE IF NOT EXISTS contacts(name VARCHAR(50), email VARCHAR(50), message TEXT, date DATETIME, time VARCHAR(20), ip VARCHAR(50), country VARCHAR(120));";
const create_admin = "CREATE TABLE IF NOT EXISTS admin(email_admin VARCHAR(50), password_admin VARCHAR(12));";
require('dotenv').config();
const sendmail = require('../public/javascripts/sendMail');
const { I18n } = require('i18n');
const i18n = new I18n({
  locales: ['es', 'en'],
  directory: path.join(__dirname, '/translate'),
  defaultLocale: 'es',
});



let response_cap = "null";
let login = false;

data_admin.run(create_admin, err => {
  if(err){
    return console.error(err.message);
  }
  else{
    console.log("Admin created");
    const query = "INSERT INTO admin(email_admin, password_admin) VALUES (?,?);";
	  const data = [process.env.EMAIL_ADMIN, process.env.PASSWORD_ADMIN];
    data_admin.run(query, data);
  }
});

database.run(create, err => {
  if(err){
    return console.error(err.message);
  }
  else{
    console.log("Table created");
  }
});

let lang = "";

router.get('/', (req, res, next) => {
  i18n.init(req, res);
  lang = req.acceptsLanguages('es');
  login = false;
  res.render('index.ejs',{datas:{},
  res_cap:response_cap,
  API_KEY:process.env.API_KEY,
  CAPTCHA_KEY:process.env.CAPTCHA_KEY,
  ANALITYCS_KEY:process.env.ANALITYCS_KEY,
  IMG_TRANSLATE:"/images/es.png"});
});

router.post('/translated',(req,res,next)=>{
  
  if(lang){
    i18n.init(req, res)
    res.setLocale('en');
    res.render('index.ejs',{datas:{},
    res_cap:response_cap,
    API_KEY:process.env.API_KEY,
    CAPTCHA_KEY:process.env.CAPTCHA_KEY,
    ANALITYCS_KEY:process.env.ANALITYCS_KEY,
    IMG_TRANSLATE:"/images/en.png"});
    lang = false;
  }
  else if(!lang){
    i18n.init(req, res)
    res.setLocale('es');
    res.render('index.ejs',{datas:{},
    res_cap:response_cap,
    API_KEY:process.env.API_KEY,
    CAPTCHA_KEY:process.env.CAPTCHA_KEY,
    ANALITYCS_KEY:process.env.ANALITYCS_KEY,
    IMG_TRANSLATE:"/images/es.png"});
    lang = true;
  }
});

router.get('/contacts', (req, res, next) => {
  if(!login){

    res.render("login.ejs", {info:{}, M:"", CLIENT_ID:process.env.CLIENT_ID});
  }
});

router.post('/', async (req, res) => {

  let ip = req.headers['x-forwarded-for'];
  let dt = new Date();
  let time = ""
  if(dt.getHours() >= 12){
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + " PM";
  }
  else{
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + " AM";
  }
  let _date = dt.toLocaleString();
  let date = "";


  for(let d = 0; d <= 9; d++){
      if(_date[d] == '/'){
        date += '-';
        continue;
      }
      else if(_date[d] == ','){
        continue;
      }
      date += _date[d];
  }

  if(ip){
    let ip_ls = ip.split(',');
    ip = ip_ls[ip_ls.length - 1];
  }
  else{
    console.log('IP adress not found');
  }
  
  const query = "INSERT INTO contacts(name, email, message, date, time, ip, country) VALUES (?,?,?,?,?,?,?);";
	const messages = [req.body.name, req.body.email, req.body.message, date, time, ip, req.body.country];
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SECRET_KEY}&response=${req.body['g-recaptcha-response']}`;
  fetch(url, {method:"post",})
    .then((response) => response.json())
    .then((google_response) => {

    // google_response is the object return by
    // google as a response
    if (google_response.success == true) {
      //   if captcha is verified
      database.run(query, messages, (err)=>{
        if (err){
          return console.error(err.message);
        }
        else{
          console.log("A user has commented");
        }
      });
      sendmail.Send(req.body.name, req.body.email, ip, req.body.country, date, time, req.body.message);
      console.log("Message sended");
        response_cap = "null";
        res.set({res_cap:response_cap});
        res.redirect('/');
      console.log({ response: "Successful" });
    } else {
      // if captcha is not verified
      console.log({ response: "Failed" });
      console.log("ERROR TO THE VERIFY THE reCAPTCHA");
      response_cap = "false";
      res.set({res_cap:response_cap});
      res.redirect('/');
    }
  })
  .catch((error) => {
      // Some error while verify captcha
    console.eror({ error });
  });
  //const google = await api.json();
  });  

router.post('/login',  (req, res) => {

  const query = "SELECT * FROM admin;";
    data_admin.all(query,(err, rows) => {
      if(err){
        return console.error(err.message);
      }
      else{
        let email, password;
        for(const r of rows){
          email = r.email_admin;
          password = r.password_admin;
        }
        if(req.body.email == email && req.body.pass == password || req.body.oauth != "" && req.body.google == "Si"){
          login = true;
          const query = "SELECT * FROM contacts;";
          database.all(query, (err, rows) => {
            if(err){
              return console.error(err.message);
            }
            else{
              res.render("contacts.ejs", {dbase:rows});
              login = false;
            }
        });

        }else{
          login = false;
          let msg = "Datos Incorrectos.";
          res.render("login.ejs", {info:{}, M:msg, CLIENT_ID:process.env.CLIENT_ID});
          console.log(`ERROR IN VERIFY THE DATAS`);
        }
      }
    });
  
});

module.exports = router;
