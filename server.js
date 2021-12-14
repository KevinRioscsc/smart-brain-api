const express = require('express');
const app = express();
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')
const Clarifai = require('clarifai');
const signin = require('/controllers/signin');
const { restart } = require('nodemon');

const app = new Clarifai.App({
    apiKey: '9a169df65b974780a0ed8ca16aa6e07e'
   });

   const handleAPI = (req,res) =>{
    app.models.predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
    .then(data => {
        res.json(data)
    })
    .catch(err => res.status(400).json('unable to work with api'))
   }


const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'Kevthebest12@',
        database: 'smart-brain'
    }
});



app.use(express.json());
app.use(cors());

//Endpoints
app.post('/imageurl', (req,res) => {handleAPI(req,res)})
app.get('/', (req, res) => {
    res.send(database.users);
})

app.post('/signin', (req,res) => {signin.handleSignin(req,res, db, bcrypt)})

app.post('/register', (req,res) => { 
    const {email, name,password} = req.body;
    if(!email || !name || !password){
        return res.status(400).json('incorrect form submission');
    }
    const hash = bcrypt.hashSync(password);
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email:email,

            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email:loginEmail[0],
                        name: name,
                        joined: new Date()

                    }).then(user =>{
                        res.json(user[0]);
                    })
                    
        
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(400).json('unable to register'));
        

})

app.get('/profile/:id', (req,res) => {
    const {id} = req.params;
    let found = false;
    db.select('*').from('users').where({
        id: id
    }).then(user => {
        if(user.length){
            res.json(user[0]);
        }
        else{
            res.status(400).json('not found')
        }
        
    })
    .catch(err => res.status(400).json('not found'))
    
})

app.put('/image', (req, res) =>{
    const {id} = req.body; 
    
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0]);
    })
    .catch(err => res.status(400).json("not found"))
   
})
/*
bcrypt.hash("bacon", null, null, function(err, hash) {
    //store hash in your password DB
});

bcrypt.compare("bacon", hash, function(err,res){
    //res == true
});

bcrypt.compare("veggies", hash, function(err, res){
    //res == false
})*/

app.listen(process.env.PORT || 3000, () => {
    console.log(`app is running on port ${process.env.PORT}`);
})

