var express = require('express');
var router = authen = display = action = product = express.Router();
var pool = require('../connect/database')
const saltRounds = 10
const bcrypt = require('bcrypt');
const secretkey = 'adminmykey'

const middleware_authen = (req, res, next) => {
    if(!req.session.adminid) res.json({ status : 'please login before' })
    next()
}
const middleware_authen_session = (req, res, next) => {
    if(req.session.adminid) res.json({ status : `you're in session` })
    next()
}

router.use('/authen', authen);
router.use('/display', display);
router.use('/action', action);
router.use('/product', product);

authen.post('/login',middleware_authen_session, async function(req, res, next) {
    let res_to = { status : 'wrong params' }
    if(req.body.username&&req.body.password){
        let username = req.body.username , password = req.body.password+secretkey
        let info = await pool.query("SELECT `id`,`password`, `status` FROM `admin` WHERE `username`=?",[username])
        if(info[0]){
            if(info[0].status){
                if(bcrypt.compareSync(password, info[0].password)){
                    req.session.adminid = info[0].id
                    res_to.status = 'login success'
                }else res_to.status = 'wrong password'
            }else res_to.status = 'your id have been block'
        }else res_to.status = 'please register before'
    }
    res.json(res_to);
});

authen.get('/logout',middleware_authen, async function(req, res, next) {
    req.session.destroy()
    res.json({ status : 'logout success' });
});

action.post('/set_bill_score',middleware_authen, async function(req, res, next) {
    let res_to = { status : 'wrong params' }
    if(Number(req.body.bill_id)&&Number(req.body.score)){
        let bill = Number(req.body.bill_id),score = Number(req.body.score)
        if(score>0){
            let check_billid = await pool.query('SELECT `user_id`,`approve_status` FROM `bill` WHERE `id`=?',[bill])
            if(check_billid[0]){
                if(!check_billid[0].approve_status){
                    await pool.query('UPDATE `bill` SET `score`=?,`approve_status`=1,`approve_by`=? WHERE `id`=?',[score,req.session.adminid,bill])
                    await pool.query('UPDATE `user` SET `score`=`score`+? WHERE `id`=?',[score,check_billid[0].user_id])
                    res_to.status = 'success'
                }else res_to.status = 'connot approve again'
            }else res_to.status = 'wrong bill id'
        }else res_to.status = 'wrong input score'
    }
    res.json(res_to);
});

display.post('/product',middleware_authen, async function(req, res, next) {
    let res_to = {} 
    let product = await pool.query('SELECT * FROM `product` ORDER BY `create_date` DESC,`status` DESC')
    res_to.product = product
    res.json(res_to);
});

display.post('/user',middleware_authen, async function(req, res, next) {
    let res_to = {} 
    let user = await pool.query('SELECT `id`, `username`, `score`, `status` FROM `user` ORDER BY `create_date` DESC')
    res_to.user = user
    res.json(res_to);
});

display.post('/bill',middleware_authen, async function(req, res, next) {
    let res_to = {} 
    if(Number(req.body.userid)){
        let userid = Number(req.body.userid)
        let bill = await pool.query('SELECT `id` , `display`, `score`, `approve_status`, `approve_by` FROM `bill` WHERE `user_id` =? ORDER BY `request_date` DESC',[userid])
        res_to.bill = bill
    }else res_to.status = 'wrong params'
    res.json(res_to);
});

product.post('/create',middleware_authen, async function(req, res, next) {
    let res_to = { status : 'wrong params' }
    if(req.body.name&&Number(req.body.amount)&&Number(req.body.score)){
        let name=req.body.name,amount = Number(req.body.amount),score = Number(req.body.score)
        if(amount>=0&&score>0){
            await pool.query('INSERT INTO `product`( `name`, `amount`, `score`) VALUES ( ?, ? ,?)',[name,amount,score])
            res_to.status = 'success'
        }else res_to.status = 'wrong input number value'
    }
    res.json(res_to);
});

product.post('/delete',middleware_authen, async function(req, res, next) {
    let res_to = { status : 'wrong params' }
    if(Number(req.body.product_id)){
        let product = Number(req.body.product_id)
        let count_product = await pool.query('SELECT coalesce(count(`product_id`),0) as count FROM `product_owner` WHERE `product_id`=?',[product])
        if(!Number(count_product.count)){
            await pool.query('DELETE FROM `product` WHERE `id`=?',[product])
            res_to.status = 'success'
        }else res_to.status = 'this product id have in process'
    }
    res.json(res_to);
});

module.exports = router;
