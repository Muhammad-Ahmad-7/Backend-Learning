import mongoose, { mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHanlder } from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
const publishVideo = asyncHanlder(async (req, res) => {
  // Get title and decription from the req.body
  // Get the url of video and thumbnail and other necessory details from the url
  // Now check if the URL is Valid or video and thumbnail are uploaded successfully
  // Create a Mongo documents and store complete info in the mongo
  console.log("In publish video");
  const { title, description } = req.body;
  // console.log(req.files);

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailFileLocalPath = req.files?.thumbnail[0].path;

  if (!videoFileLocalPath || !thumbnailFileLocalPath) {
    throw new ApiError(500, "Failed to upload video on local server");
  }
  console.log(videoFileLocalPath);
  console.log(thumbnailFileLocalPath);

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnailDetail = await uploadOnCloudinary(thumbnailFileLocalPath);

  console.log("VideoFile: ", videoFile);
  console.log("ThumbnailDetail", thumbnailDetail);

  if (!videoFile || !thumbnailDetail) {
    throw new ApiError(500, "Failed to upload the video");
  }
  const video = await Video.create({
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnailDetail.url,
      public_id: thumbnailDetail.public_id,
    },
    title,
    description,
    duration: videoFile.duration,
    owner: req.user?._id,
    isPublished: false,
  });

  if (!video) {
    throw new ApiError(500, "Error while uploading the video on mongo db");
  }

  console.log("Successfull");
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});
const getVideoById = asyncHanlder(async (req, res) => {
  try {
    console.log("In getVideos By Id");
    const { videoId } = req.params;
    //TODO: get video by id
    // find the video from the database
    // using the owners id from the video object get the owner information too

    const findVideo = await Video.findById(videoId);

    if (!findVideo) {
      throw new ApiError(400, "Video Not Found!!!");
    }

    const aggregateVideo = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comments",
          pipeline: [
            {
              $project: {
                content: 1,
                owner: 1,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "CommentOwner",
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
          ],
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
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
              },
            },
            {
              $addFields: {
                subscriberCount: {
                  $size: "$subscribers",
                },
                isSubscribed: {
                  $cond: {
                    if: {
                      $in: [req.user?._id, "$subscribers.subscriber"],
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          OwnerDetail: {
            $first: "$OwnerDetail",
          },
          LikeCount: {
            $size: "$likes",
          },
        },
      },
    ]);

    console.log("Video Found", findVideo);
    console.log("Video Aggregate", aggregateVideo);

    if (!aggregateVideo) {
      throw new ApiError(400, "Video Not Found!!!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, aggregateVideo, "Video Found Successfully"));
  } catch (error) {
    console.log(error);
  }
});

const getAllVideos = asyncHanlder(async (req, res) => {});

const updateVideo = asyncHanlder((req, res) => {});

const deleteVideo = asyncHanlder((req, res) => {});

export { publishVideo, getAllVideos, updateVideo, deleteVideo, getVideoById };
