const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken');


app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async(req, res, next)=> {
  try {
    res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', async(req, res, next)=> {
  try {
    res.send(await User.byToken(req.headers.authorization));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:id/notes', async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    console.log(token)
    const data = jwt.verify(token, process.env.JWT)
    console.log(typeof data.userId)
    console.log(typeof req.params.id)
    if (data.userId === Number(req.params.id)){
      const user = await User.findOne({
        where: {
          id: req.params.id
        },
        include: Note
      })
      console.log(user.notes)
      res.send(user.notes)
    }
  } catch (e){
    next(e)
  }
})

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
