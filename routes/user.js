var express = require('express');
var router = authen = display = action = express.Router();
var pool = require('../connect/database')
// const Product = require('../models/product');
const saltRounds = 10
const bcrypt = require('bcrypt');
const secretkey = 'mykey'



const middleware_authen = (req, res, next) => {
    if(!req.session.userid) res.json({ status : 'please login before' })
    next()
}
const middleware_authen_session = (req, res, next) => {
    if(req.session.userid) res.json({ status : `you're in session` })
    next()
}

router.use('/authen', authen);
router.use('/display', display);
router.use('/action', action);

authen.post('/login',middleware_authen_session, async function(req, res, next) {
    let res_to = { status : 'wrong params' }
    if(req.body.username&&req.body.password){
        let username = req.body.username , password = req.body.password+secretkey
        let info = await pool.query("SELECT `id`,`password`, `status` FROM `user` WHERE `username`=?",[username])
        if(info[0]){
            if(info[0].status){
                if(bcrypt.compareSync(password, info[0].password)){
                    req.session.userid = info[0].id
                    res_to.status = 'login success'
                }else res_to.status = 'wrong password'
            }else res_to.status = 'your id have been block'
        }else res_to.status = 'please register before'
    }
    res.json(res_to);
});

authen.post('/register', async function(req, res, next) {
    let res_to = { status : 'wrong params' }
    if(req.body.username && req.body.password){
        let username = req.body.username , password = bcrypt.hashSync(req.body.password+secretkey, saltRounds)
        let check_username = await pool.query('SELECT `username` FROM `user` WHERE `username`=?',[username])
        if(!check_username[0]){
            await pool.query('INSERT INTO `user`( `username`, `password`) VALUES (?,?)',[username,password])
            res_to.status = 'complete'
        }else res_to.status = 'this username have already'
    }
    res.json(res_to);
});

authen.get('/logout',middleware_authen, async function(req, res, next) {
    req.session.destroy()
    res.json({ status : 'logout success' });
});

display.post('/score',middleware_authen, async function(req, res, next) {
    let res_to = { left : 0 , used : 0 }
    let load_score = await pool.query('( SELECT "left" as type ,`score` FROM `user` WHERE `id`=? ) UNION ( SELECT "used" as type , COALESCE(SUM(`score`),0) as score FROM `product_owner` WHERE `user_id`=? )',[req.session.userid,req.session.userid])
    for(let val of load_score){
        switch(val.type){
            case 'left' : res_to.left = val.score; break;
            case 'used' : res_to.used = val.score; break;
        }
    }
    res_to.total = res_to.left+res_to.used
    res.json(res_to);
});

display.post('/product',middleware_authen, async function(req, res, next) {
    let check_list = ['list','my_list'],res_to = {} 
    if(req.body.type){
        let type = req.body.type
        if(check_list.indexOf(type) >= 0){
            let sql , params = []
            switch(type){
                case 'list' : sql='SELECT `id`, `name`, `display`, `amount`, `score`  FROM `product` WHERE `amount` > 0 and `status` = 1 ORDER BY `create_date` DESC'; break;
                case 'my_list' : sql = 'SELECT pdo.`product_id`,pdo.`score`,pd.`name`,pd.`display` FROM `product_owner` pdo INNER JOIN `product` pd ON pdo.`product_id`=pd.`id` and pdo.`user_id`=?'; params[0]=req.session.userid; break;            }
            let product = await pool.query(sql,params)
            res_to.product = product
        }else res_to.status = 'wrong method type'
    }else res_to.status = 'wrong params'
    res.json(res_to);
});

action.post('/bill',middleware_authen, async function(req, res, next) {
    let res_to = { status : 'wrong params' }
    if(req.body.bill){
        let bill = req.body.bill
        await pool.query('INSERT INTO `bill`( `user_id`,`display`) VALUES (?,?)',[req.session.userid,bill])
        res_to.status = 'request success'
    }
    res.json(res_to);
});

action.post('/choose_product',middleware_authen, async function(req, res, next) {
    let res_to = { status : 'wrong params' }
    if(Number(req.body.product_id)){
        let product_id = Number(req.body.product_id),score = { user : 0 , product : 'none' }
        let load_data = await pool.query('( SELECT "user" as type , `score` , 0 as amount FROM `user` WHERE `id`=? ) UNION ( SELECT "product" as type , `score` , `amount` FROM `product` WHERE `id`=? )',[req.session.userid,product_id])
        for(let val of load_data){
            switch(val.type){
                case 'user' : score.user = val.score; break;
                case 'product' : score.product = Number(val.amount)?val.score:'sold out'; break;
            }
        }
        if(score.product!=='none'){
            if(score.product!=='sold out'){
                if(score.user){
                    if(score.user-score.product>=0){
                        await pool.query('UPDATE `product` SET `amount`=`amount`-1 WHERE `id`=?',[product_id])
                        await pool.query('UPDATE `user` SET `score`=`score`-? WHERE `id`=?',[score.product,req.session.userid])
                        await pool.query('INSERT INTO `product_owner`( `user_id`, `product_id`, `score`) VALUES (?,?,?)',[req.session.userid,product_id,score.product])
                        res_to.status = 'success'
                    }else res_to.status = 'not enought score'
                }else res_to.status = 'you need to have score'
            }else res_to.status = 'this product is sold out'
        }else res_to.status = 'wrong product id'
    }
    res.json(res_to);
});

module.exports = router;
