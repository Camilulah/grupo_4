function adminMiddleware (req, res, next){
    if(req.session.userLogged.admin != 1){
        return res.redirect('/')
    }
    next()
}

module.exports = adminMiddleware