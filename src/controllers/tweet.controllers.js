import { asyncHanlder } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId, mongo } from "mongoose";
const addTweet = asyncHanlder(async (req, res) => {
  // get tweet details from the req
  // get user id from the req
  // tweet document and add all the details

  const { content } = req.body;
  console.log(req.body);

  const userId = req.user?._id;

  console.log(userId);

  if (!content) {
    throw new ApiError(400, "Enter Tweet");
  }

  const tweet = await Tweet.create({
    content,
    owner: userId,
  });

  if (!tweet) {
    throw new ApiError(500, "Failed to add your tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const updateTweet = asyncHanlder(async (req, res) => {
  const userId = req.user?._id;
  const { content } = req.body;
  const { tweetId } = req.params;
  console.log(tweetId);

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "No tweet found");
  }

  if (userId.toString() !== tweet.owner.toString()) {
    throw new ApiError(400, "You are not authorized to delete this tweet");
  }

  const newTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content,
      },
    },
    { new: true },
  );

  if (!newTweet) {
    throw new ApiError(500, "Some error occurred in new tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(500, newTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHanlder(async (req, res) => {
  console.log("In delete tweet");
  const { tweetId } = req.params;
  const userId = req.user?._id;

  console.log(tweetId);
  console.log(userId);

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(401, "Object Id is not valid");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "No tweet found");
  }

  if (userId.toString() !== tweet.owner.toString()) {
    throw new ApiError(400, "You are not authorized to delete this tweet");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, { tweetId }, "Tweet deleted successfully"));
});

const getAllTweet = asyncHanlder(async (req, res) => {
  console.log("In get All tweet");
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    console.log("User is not valid");
  }

  const tweetAggregate = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "OwnerDetail",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetail",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likeCount: {
          $size: "$likeDetail",
        },
        OwnerDetail: {
          $first: "$OwnerDetail",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likeDetail.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        OwnerDetail: 1,
        likeCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ]);
  //   console.log(tweetAggregate[0].OwnerDetail[0]);
  //   console.log(tweetAggregate);

  if (!tweetAggregate) {
    throw new ApiError(500, "Failed to fetch the tweets");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, tweetAggregate, "All Tweets Fetched Successfully"),
    );
});

export { addTweet, updateTweet, deleteTweet, getAllTweet };
