const fs = require('fs');
const path = require('path')
const bcrypt = require('bcryptjs')
const db = require('../../database/models/index')

const { validationResult } = require('express-validator');

const userController = {
    login: (req, res) => {
        return res.render('user/login')
    },

    processLogin: async (req, res) =>{
        let userToLogin = await db.User.findOne({where: {email: req.body.email}})

        if(userToLogin){
            let isOkPassword = bcrypt.compareSync(req.body.password, userToLogin.password)
            if(isOkPassword){
                delete userToLogin.password;
                req.session.userLogged = userToLogin;
                if(req.body.recordar){
                    res.cookie('userEmail', req.body.email, {maxAge: (1000 * 60 * 60 * 24 * 365)})
                }

                return res.redirect('profile');
            }
        }
        return res.render('user/login', { 
            errors:{
                email:{
                    msg: 'Credenciales invalidas'
                }
            }
        })
    },

    register: (req, res) => {
        return res.render('user/register');
    },

    processRegister: async (req, res) =>{
        const resultValidation = validationResult(req);

        if(resultValidation.errors.length > 0){
            const filePath = path.join(__dirname, '../../public/images/user', req.file.filename);
            fs.unlinkSync(filePath);
            return res.render("user/register", {
				errorsObjeto: resultValidation.mapped(),
				oldData: req.body
			})
        }

        let userInDB = await db.User.findOne({ where: { email: req.body.email}})

        if(userInDB) {
            const filePath = path.join(__dirname, '../../public/images/user', req.file.filename);
            fs.unlinkSync(filePath);

            const errorsObjeto = {
                ...resultValidation.mapped(),
                email: {
                    msg: 'Este email ya está registrado'
                }
            };
            
            console.log(errorsObjeto);
        
            return res.render("user/register", {
                errorsObjeto,
                oldData: req.body
            });
        }

        db.User.create({
            name:req.body.name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            image: req.file.filename,
            admin: 0
        })

        return res.redirect('/')
    },

    profile: (req, res) => {
        return res.render('user/profile', {
            user: req.session.userLogged
        })
    },

    logout: (req, res) => {
        res.clearCookie('userEmail');
        req.session.destroy();
        return res.redirect('/');
    },

    list: async (req, res) => {
        let users = await db.User.findAll();
        res.render('user/list', {users})
    },

    deleteUser: async (req, res) => {
        await db.User.destroy({
            where : {
                id : req.params.id
            }
        });

        res.redirect('back')
    }
}

module.exports = userController;