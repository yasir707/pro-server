let express = require('express');
let app = express();
const multer  = require('multer');
let path=require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateJWT = require('./authenticateJWT'); 
const cors = require('cors');
let bodyParser = require('body-parser')
require('./connection');
let Post = require('./Post')
let User = require('./User');
let port=8080;
const JWT_SECRET = 'gsh83gfd*32#f8sfg@^28hsa0g4&^7s2';


app.use(express.urlencoded({extended:true}));
app.use(express.json())
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });


 
  //sign up
  app.post('/signup' , (req , res)=>{
    console.log('Request body:', req.body);
    let {name , email , password} = req.body;
    console.log(name)
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const hashedPassword = bcrypt.hashSync(password, 4);
    let newUser = new User({
        name:name,
        email:email,
        password:hashedPassword
    });
    newUser.save().then(()=>console.log('saved')).catch((err)=>console.log(err));
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1h' });
    console.log('sign up token' ,token);
  })

  //sign in
 app.post('/signin', async (req,res)=>{
    let {email , password} = req.body;
    let user = await User.findOne({email});
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'User signed in successfully', token , userId: user._id });
    console.log('sign in token',token)
  
});
// get all posts on main page
app.get('/posts', async (req,res)=>{
    let posts = await Post.find();
    res.send(posts)
});

//crud operation

app.get('/post', authenticateJWT , async (req,res)=>{
    let post = await Post.find({ userId: req.user.userId });
    res.send(post)
});


app.post('/post',  authenticateJWT , upload.single('image'),  async (req , res) => {
    console.log('User ID from token:', req.user.userId);
    let {user , title , price , description} = req.body;
    // console.log(title,price,description)
    let newPost = new Post({
        image: req.file ? req.file.path : null,
        user:user,
        title:title,
        price:price,
        description:description,
        userId: req.user.userId
      });
      if (req.file) {
        newPost.image = req.file.path;
      }
    //   console.log(newPost)
 
  await newPost.save().catch((err) => console.log(err));

});

app.get('/post/:id', async(req,res)=>{
    let {id} = req.params;
    let singlePost = await Post.findById(id);
    res.send(singlePost);
});


app.patch('/post/:id'  ,  upload.single('image'),async(req , res) => {
    let id = req.params.id;
    let updatedData = {
        user: req.body.user,
        title: req.body.title,
        description:req.body.description,
        price:req.body.price
      };
      if (req.file) {
        updatedData.image = req.file.path;
    }
    console.log(updatedData)

    try {
        let user = await Post.findByIdAndUpdate(id, updatedData, { new: true });

        if (user) {
            res.send(user);
        } else {
            res.status(404).send({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send({ error: 'Error updating user' });
    }
});


app.delete('/post/:id'  ,async (req , res) => {
    let {id} = req.params;
    await Post.findByIdAndDelete(id);
    res.send('post deleted successfully');
});



// specific user posts
app.get('/posts/:userId', async(req,res)=>{
    const userId = req.params.userId;
    console.log(userId)
    let userPosts = await Post.find({ userId: userId });
    console.log(userPosts)
    res.send(userPosts);
});

// specific user profile data

app.get('/profile/:userId', authenticateJWT, async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findById(userId);
      if (!user) return res.status(404).send('User not found');
      res.json(user);
    } 
    catch (err) {
      res.status(500).send('Server error');
    }
  });

//   specific user profile update

app.patch('/profile/:userId', authenticateJWT, async (req, res) => {
    
      const userId = req.params.userId; 
      console.log(userId)
      let updatedUserData = {
          name: req.body.name,
          email: req.body.email,
          password:req.body.password
        };
      console.log(updatedUserData)
  
      try {
          let user = await User.findByIdAndUpdate(userId, updatedUserData, { new: true });
  
          if (user) {
              res.send(user);
          } else {
              res.status(404).send({ error: 'User not found' });
          }
      } catch (error) {
          console.error('Error updating user:', error);
          res.status(500).send({ error: 'Error updating user' });
      }
    })

app.listen(port , ()=>{
    console.log(`Server is listening at http://localhost:${port}`);
})