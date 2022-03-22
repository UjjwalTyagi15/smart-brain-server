const express= require('express');
const Bodyparser=require('body-parser');
const Cors=require('cors');
const knex =require('knex');
const bcrypt =require('bcryptjs');
const { password } = require('pg/lib/defaults');



const db=knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'test',
      database : 'smart-brain'
    }
  });



let database ={users:[
    {
        id:"120",
        name:"amy",
        email:"amy@gmail.com",
        password:"cookies",
        entries:0,
        joined: new Date()        
    },
    {
        id:"121",
        name:"jack",
        email:"jack@gmail.com",
        password:"bananas",
        entries:0,
        joined: new Date()        
    }
    
]}



const app=express();
app.use(Bodyparser.json());
app.use(Cors());





app.post('/register',(req,res)=>{
    const {name,email,password}=req.body;
    const hash=bcrypt.hashSync(password);
    db.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        }).into('login').
        returning('email')
        .then(loginemail=>{
            return trx('users')
            .returning('*')
            .insert({
                email:loginemail[0].email,
                name:name,
                joined:new Date()
            }) .then(user=>{
                  res.json(user[0]);
                  ;
            })
        }).then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err=>{res.status(400).json("can't register user")});


   
   
    
})


app.post('/signin', (req,res)=>{
    db.select('email','hash').from('login').where('email','=',req.body.email)
    .then(data=>{
        const isvalid=bcrypt.compareSync(req.body.password,data[0].hash);
        if(isvalid){
            return db.select('*').from('users').where('email','=',req.body.email).
            then(user=>{
                res.json(user[0])
            })
            .catch(err=>{res.status(400).json('unable to get user')})

        }else{
            res.status(400).json('wrong credentials');
        }
    })
        .catch(err=>{res.status(400).json('wrong credentials')})
    }

)


app.post('/profile/:id',(req,res)=>{
    const {id}=req.params;
    let found=false;
    db.select('*').from('users').where({
        id:id   
    }).then(user=>{
        if(user.length){

            res.json(user[0])
        }else res.status(404).json('User not found ')
    }
     ).catch(err=>{res.status(400).json("cannot fetch User")})
   
})



app.put('/image',(req,res)=>{
   const {id}=req.body;
  db('users').where('id','=',id)
  .increment('entries',1)
  .returning('entries')
  .then(entries=>{
      res.json(entries[0]['entries']);
  }).catch(err=>{res.status(400).json('Cannot increment the entries')})
})




app.listen(3000);