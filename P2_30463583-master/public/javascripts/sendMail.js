'use strict'
const nodemailer = require('nodemailer');
require('dotenv').config();

this.Send = (name, email, ip, country, date, time, message) => {

        const serviceMail = nodemailer.createTransport({
            host: "smtp.hostinger.com",
    			secureConnection: false,
    			port: 465, 
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASSWORD
				}
        });

        let dataMail = {
            from: process.env.EMAIL,
            //", 
            to: "anthonyzok521@gmail.com",
            subject: "New message from CurriculumVitae | AC GAMES",
            html: `<h1>Has Receive you a message of: <b>${name}</b><h1/>
            <br>
            <h3>Datas of the user:</h3><br><p>Name: <i>${name}</i>
            <br>
            Email: <i>${email}</i>
            <br>
            IP: <b>${ip}</b>
            <br>
            Country: <i>${country}</i>
            <br>
            Date and Time: <b>${date} - ${time}</b>
            <br>
            </p>
            <h3>Message:</h3>
            <br>
            <h2>${message}</h2>`
        }
        serviceMail.sendMail(dataMail, (error) =>{
            if(error){
            console.log(error.message);
            }else{
            console.log("Send!");
            }
        });
}

module.exports = this;