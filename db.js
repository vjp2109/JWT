const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken')
const { STRING } = Sequelize;
const config = {
  logging: false
};
const bcrypt = require('bcrypt');

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

const Note = conn.define('note', {
  text: STRING
})

User.byToken = async(token)=> {
  try {
    const data = jwt.verify(token, process.env.JWT)
    const user = await User.findByPk(data.userId);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username
    }
  });

  if(user){
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
    const token = jwt.sign({userId: user.id}, process.env.JWT)
    return token;
  }
}
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate(async (user) => {
  const SALT_COUNT = 5;
  const hashedPassword = await bcrypt.hash(user.password, SALT_COUNT);
  user.password = hashedPassword;
});

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const notes = [
    { text: 'Lucy is the best'},
    { text: 'Moe is... ok'},
    { text: 'Moe also needs to shower'},
    { text: 'Larry is nice'}
]
  const [note1, note2, note3, note4] = await Promise.all(notes.map(note => Note.create(note)))

  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  lucy.setNotes(note1);
  moe.setNotes([note2, note3]);
  larry.setNotes(note4);
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

Note.belongsTo(User)
User.hasMany(Note)

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};
