let mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    image:String,
    user:String,
    title: String,
    price:Number,
    description:String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    
  });

  const Post = mongoose.model('Post', postSchema);
  module.exports=Post;