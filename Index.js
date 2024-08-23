const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
require('dotenv').config();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rapid-resolve';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Mongoose schemas and models
const userSchema = new mongoose.Schema({
  email: String,
  organization: String,
  fullName: String,
  phoneNumber: String,
  password: String,
  role: { type: String, enum: ['user', 'team-leader'] },
});

const teamSchema = new mongoose.Schema({
  name: String,
  code: String,
  password: String,
  leaderId: mongoose.Schema.Types.ObjectId,
  members: [mongoose.Schema.Types.ObjectId],
});

const User = mongoose.model('User', userSchema);
const Team = mongoose.model('Team', teamSchema);

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapid Resolve</title>
    </head>
    <body>
        <h1>Welcome to Rapid Resolve</h1>
        <a href="/signup">Sign Up</a>
        <a href="/login">Login</a>
    </body>
    </html>
  `);
});

app.get('/signup', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign Up</title>
    </head>
    <body>
        <h1>Sign Up</h1>
        <form action="/signup" method="POST">
            <label for="email">Business Email:</label>
            <input type="email" name="email" required><br>
            <label for="organization">Organization Name:</label>
            <input type="text" name="organization" required><br>
            <label for="fullName">Full Name:</label>
            <input type="text" name="fullName" required><br>
            <label for="phoneNumber">Phone Number:</label>
            <input type="text" name="phoneNumber" required><br>
            <label for="password">Password:</label>
            <input type="password" name="password" required><br>
            <label for="confirmPassword">Confirm Password:</label>
            <input type="password" name="confirmPassword" required><br>
            <label for="role">Sign Up As:</label>
            <select name="role">
                <option value="user">User</option>
                <option value="team-leader">Team Leader</option>
            </select><br>
            <button type="submit">Sign Up</button>
        </form>
        <a href="/">Back to Home</a>
    </body>
    </html>
  `);
});

app.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login</title>
    </head>
    <body>
        <h1>Login</h1>
        <form action="/login" method="POST">
            <label for="email">Business Email:</label>
            <input type="email" name="email" required><br>
            <label for="password">Password:</label>
            <input type="password" name="password" required><br>
            <label for="role">Login As:</label>
            <select name="role">
                <option value="user">User</option>
                <option value="team-leader">Team Leader</option>
                <option value="team-member">Team Member</option>
            </select><br>
            <button type="submit">Login</button>
        </form>
        <a href="/">Back to Home</a>
    </body>
    </html>
  `);
});

app.get('/team-leader-home', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Leader Home</title>
    </head>
    <body>
        <h1>Team Leader Home</h1>
        <form action="/create-team" method="POST">
            <label for="name">Team Name:</label>
            <input type="text" name="name" required><br>
            <label for="code">Team Code:</label>
            <input type="text" name="code" required><br>
            <label for="password">Team Password:</label>
            <input type="password" name="password" required><br>
            <button type="submit">Create Team</button>
        </form>
        <a href="/">Back to Home</a>
    </body>
    </html>
  `);
});

app.get('/user-home', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Home</title>
    </head>
    <body>
        <h1>User Home</h1>
        <form action="/join-team" method="POST">
            <label for="code">Team Code:</label>
            <input type="text" name="code" required><br>
            <label for="password">Team Password:</label>
            <input type="password" name="password" required><br>
            <button type="submit">Join Team</button>
        </form>
        <a href="/">Back to Home</a>
    </body>
    </html>
  `);
});

app.post('/signup', async (req, res) => {
  const { email, organization, fullName, phoneNumber, password, confirmPassword, role } = req.body;
  if (password !== confirmPassword) {
    return res.send('Passwords do not match');
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.send('User already exists');
  }
  const user = new User({ email, organization, fullName, phoneNumber, password, role });
  await user.save();
  res.redirect('/login');
});

app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  const user = await User.findOne({ email, password, role });
  if (user) {
    if (role === 'team-leader') {
      res.redirect('/team-leader-home');
    } else {
      res.redirect('/user-home');
    }
  } else {
    res.send('Invalid credentials');
  }
});

app.post('/create-team', async (req, res) => {
  const { name, code, password } = req.body;
  const team = new Team({ name, code, password, leaderId: 'some-leader-id' }); // Replace 'some-leader-id' with actual leader ID
  await team.save();
  res.redirect('/team-leader-home');
});

app.post('/join-team', async (req, res) => {
  const { code, password } = req.body;
  const team = await Team.findOne({ code, password });
  if (team) {
    team.members.push('some-user-id'); // Replace 'some-user-id' with actual user ID
    await team.save();
    res.redirect('/user-home');
  } else {
    res.send('Invalid team code or password');
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
