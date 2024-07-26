let express = require('express');
let app = express();
const { Server } = require("socket.io");
const http = require('http');
let mongoose = require('mongoose');
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
let Comment = require('./Comment');
let port=8080;
const JWT_SECRET = 'gsh83gfd*32#f8sfg@^28hsa0g4&^7s2';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.use(express.urlencoded({extended:true}));
app.use(express.json())
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(bodyParser.json());



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
// app.get('/posts', async (req, res) => {
//     let posts = await Post.aggregate([
//         { $match: {} },
//         { $sort: { createdAt: -1 } }
//     ]);
//     res.send(posts);
// });


//crud operations for creator of posts

app.get('/post', authenticateJWT , async (req,res)=>{
    let post = await Post.find({ userId: req.user.userId });
    res.send(post)
});

// app.get('/post', authenticateJWT, async (req, res) => {
//     try {
//         let posts = await Post.aggregate([
//             { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
//             { $sort: { createdAt: -1 } }
//         ]);
//         res.send(posts);
//     } catch (err) {
//         res.status(500).send({ message: err.message });
//     }
// });


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
// app.get('/post/:id', async (req, res) => {
//     let { id } = req.params;
//     let singlePost = await Post.aggregate([
//         { $match: { _id: new mongoose.Types.ObjectId(id) } }
//     ]);
//     res.send(singlePost[0]);
// });

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
// app.patch('/post/:id', upload.single('image'), async (req, res) => {
//     let id = req.params.id;
//     let updatedData = {
//         user: req.body.user,
//         title: req.body.title,
//     };
//     if (req.file) {
//         updatedData.image = req.file.path;
//     }

//     try {
//         let result = await Post.updateOne(
//             { _id: new mongoose.Types.ObjectId(id) },
//             { $set: updatedData },
//             { new: true }
//         );

//         // if (result.nModified > 0) {
//         //     let updatedUser = await Post.findById(id);
//         //     res.send(updatedUser);
//         // } else {
//         //     res.status(404).send({ error: 'User not found or no changes made' });
//         // }
//     } catch (error) {
//         console.error('Error updating user:', error);
//         res.status(500).send({ error: 'Error updating user' });
//     }
// });



app.delete('/post/:id'  ,async (req , res) => {
    let {id} = req.params;
    await Post.findByIdAndDelete(id);
    res.send('post deleted successfully');
});
// app.delete('/post/:id', async (req, res) => {
//     let { id } = req.params;

//     try {
//         let result = await Post.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

//         // if (result.deletedCount > 0) {
//         //     res.send('Post deleted successfully');
//         // } else {
//         //     res.status(404).send({ error: 'Post not found' });
//         // }
//     } catch (error) {
//         console.error('Error deleting post:', error);
//         res.status(500).send({ error: 'Error deleting post' });
//     }
// });



// app.put('/post/:id/like', async(req,res)=>{
//     let {id} = req.params;
//     let singlePost = await Post.findById(id);
//     singlePost.likes+=1;
//     await singlePost.save();
//     io.emit('postLiked', singlePost);
//     res.send(singlePost);
// });

app.put('/post/:id/like', async (req, res) => {
    let { id } = req.params;

    try {
        let post = await Post.findById(id);

        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }

        post.likes += 1;
        await post.save();

        io.emit('postLiked', post);
        res.send(post);
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).send({ error: 'Error liking post' });
    }
});


// app.post('/post/:id/comment', authenticateJWT, async (req, res) => {
//     let { id } = req.params;
//     let { comment } = req.body;
    
//     let post = await Post.findById(id);
//     if (!post) {
//       return res.status(404).send({ message: 'Post not found' });
//     }
    
//     let newComment = new Comment({
//       user: req.user.userId,
//       postId: id,
//       comment: comment
//     });
    
//     await newComment.save();
    
//     post.comments.push(newComment._id);
//     await post.save();
    
//     io.emit('postCommented', { postId: id, comment: newComment });
//     res.status(201).send(newComment);
//   });
app.post('/post/:id/comment', authenticateJWT, async (req, res) => {
    let { id } = req.params;
    let { comment } = req.body;

    let post = await Post.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } }
    ]);
    if (post.length === 0) {
        return res.status(404).send({ message: 'Post not found' });
    }

    let newComment = new Comment({
        user: req.user.userId,
        postId: id,
        comment: comment
    });

    await newComment.save();

    await Post.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $push: { comments: newComment._id } }
    );

    io.emit('postCommented', { postId: id, comment: newComment });
    res.status(201).send(newComment);
});

//   app.get('/post/:id/comment', async (req,res)=>{
//     let {id} = req.params;
//     let allComments = await Comment.find({ postId: id }).populate('user', 'name');
//     res.send(allComments)
// });
app.get('/post/:id/comment', async (req, res) => {
    let { id } = req.params;
    let allComments = await Comment.aggregate([
        { $match: { postId: new mongoose.Types.ObjectId(id) } },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: '$user' },
        { $project: { 'user.password': 0 } }
    ]);
    res.send(allComments);
});

//   app.post('/comment/:id/reply', authenticateJWT, async (req, res) => {
//     let { id } = req.params;
//     let { reply } = req.body;
  
//     let parentComment = await Comment.findById(id);
//     if (!parentComment) {
//       return res.status(404).send({ message: 'Comment not found' });
//     }
  
//     let newReply = new Comment({
//       user: req.user.userId,
//       postId: parentComment.postId,
//       comment: reply
//     });
  
//     await newReply.save();
  
//     parentComment.replies.push(newReply._id);
//     await parentComment.save();
  
//     io.emit('commentReplied', { commentId: id, reply: newReply });
//     res.status(201).send(newReply);
//   });
app.post('/comment/:commentId/reply', authenticateJWT, async (req, res) => {
    let { commentId } = req.params;
    let { reply } = req.body;

    try {
        console.log("Request body:", req.body);
        console.log("Comment ID:", commentId);

        let parentComment = await Comment.findById(commentId);

        if (!parentComment) {
            console.log("Comment not found for ID:", commentId);
            return res.status(404).send({ message: 'Comment not found' });
        }

        console.log("Parent comment found:", parentComment);

        let newReply = new Comment({
            user: req.user.userId,
            postId: parentComment.postId,
            comment: reply,
            replies: []  
        });

        await newReply.save();
        console.log("New reply saved:", newReply);

        parentComment.replies.push(newReply._id);
        console.log("Updated parent comment with new reply ID:", parentComment);

        await parentComment.save();
        console.log("Parent comment saved with new reply ID");

        io.emit('commentReplied', { commentId: commentId, reply: newReply });

        res.status(201).send(newReply);
    } catch (error) {
        console.error('Error replying to comment:', error);
        res.status(500).send({ error: 'Error replying to comment' });
    }
});








  app.get('/comment/:id/reply', async (req,res)=>{
    let {id} = req.params;
    let allComments = await Comment.find({ postId: id }).populate('user', 'name');
    res.send(allComments)
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
          let user = await Post.findByIdAndUpdate(userId, updatedUserData, { new: true });
  
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