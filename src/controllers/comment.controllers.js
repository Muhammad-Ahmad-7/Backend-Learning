import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.mode.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHanlder } from "../utils/asyncHandler.js";

const addComment = asyncHanlder(async (req, res) => {
  // TODO: add a comment to a video
  // first get video id from the params
  // get the user id
  // now get the comment content from the req
  // create a new mongo db comment doc and store the required information

  const { videoId } = req.params;
  const userId = req.user?._id;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Please add a comment");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to add the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added successfully"));
});

const deleteComment = asyncHanlder(async (req, res) => {
  // Get the id of the comment
  // find the particular comment document associated with that id
  // check current user is authorized to delete the comment
  // delete that document
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "You are not authorized to delete this comment");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentId);

  if (!deleteComment) {
    throw new ApiError(500, "Failed to delete the comment");
  }

  await Like.deleteMany({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "Comment deleted successfully"));
});

const updateComment = asyncHanlder(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Please add comment");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(500, "Comment not found");
  }

  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You are not authorized");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    },
  );

  if (!updatedComment) {
    throw new ApiError(500, "Failed to edit the comment please try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const getVideoComments = asyncHanlder(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const commentsAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "ownerDetails",
        },
        commentCount: {
          $size: "ownerDetails",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likesCount: 1,
        commentCount: 1,
        ownerDetails: {
          username: 1,
          fullname: 1,
          "avatar.url": 1,
        },
        isLiked: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comments = await Comment.aggregatePaginate(commentsAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments retrieved successfully"));
});

export { getVideoComments, addComment, deleteComment, updateComment };
