const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://angeldvcraw:admin@cluster0.idxql2r.mongodb.net/db-exercise-tracker?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true });

const schemaExercise = new mongoose.Schema({ 
  user_id: {type: String, required: true},
  description: { type: String, required: true },  
  duration: { type: Number, required: true },
  date: Date
});

const schemaUser = new mongoose.Schema({
  username: { type: String, required: true }
});

const Exercise = mongoose.model('Exercise', schemaExercise);
const User = mongoose.model('User', schemaUser);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use('/api/users', bodyParser.urlencoded({ extended: false }));
app.use('/api/users/:_id/exercises', bodyParser.urlencoded({ extended: false }));

app.post('/api/users', (req, res) => {
  // create new users
  const user_name = req.body.username;
  const newUser = new User({ username: user_name });
  newUser.save()
  .then((result) => {
    res.json({ username: result.username, _id: result.id });
  })
  .catch((err) => {
    res.json({ error: err });
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const idUser = req.params._id;
  const newDescription = req.body.description;
  const newDuration = req.body.duration;
  //const newDate = req.body.date === '' ? new Date().toDateString() : new Date(req.body.date).toDateString();
  const newDate = req.body.date === '' ? new Date() : new Date(req.body.date);

  User.findById(idUser)
  .then((foundUser) => {
    if(!foundUser) {
      res.send("User not found.");
      return;
    }

    const newExercise = new Exercise({
      user_id: idUser,
      description: newDescription,
      duration: Number(newDuration),
      date: newDate
    });

    newExercise.save()
    .then((exerciseSaved) => {
      res.json({
        _id: foundUser.id,
        username: foundUser.username,
        description: exerciseSaved.description,
        duration: Number(exerciseSaved.duration),
        date: exerciseSaved.date.toDateString()
      });
    })
    .catch((saveErr) => {
      res.json({ error: saveErr });
    });
  })
  .catch((err) => {
    res.json({ error: err });
  });
});

app.get('/api/users', (req, res) => {
  // get list of all users
  User.find({})
  .then((users) => {
    res.json(users);
  })
  .catch((err) => {
    res.json({ error: err });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  const idUser = req.params._id;

  User.findById(idUser)
  .then((foundUser) => {
    if(!foundUser) {
      res.json({ message: "User not found." });
      return;
    }

    const dateObj = {};
    if(from) dateObj['$gte'] = new Date(from);
    if(to) dateObj['$lte'] = new Date(to);
    
    console.log(dateObj);

    const filter = { user_id: idUser };
    if(from || to) filter.date = dateObj;

    Exercise.find(filter)
    .limit(+limit ?? 500)
    .then((exercises) => {
      const logs = exercises.map(e => ({
        description: e.description,
        duration: Number(e.duration),
        date: e.date.toDateString()
      }));

      console.log({
        username: foundUser.username,
        count: Number(exercises.length),
        _id: foundUser.id,
        log: logs
      });

      res.json({
        username: foundUser.username,
        count: Number(exercises.length),
        _id: foundUser.id,
        log: logs
      });
    })
    .catch((error) => {
      res.json({ error: error });
    });
  })
  .catch((err) => {
    res.json({ error: err });
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
