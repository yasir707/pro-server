// const mongoose = require('mongoose');

// const CommentSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
//   comment: { type: String, required: true },
//   replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
// }, { timestamps: true });

// module.exports = mongoose.model('Comment', CommentSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    comment: { type: String, required: true },
    replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
