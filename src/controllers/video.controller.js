import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if([title,description].some((field) =>{field.trim() === ""})){
        throw new ApiError(400, "Title is required.")
    }
    
    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    console.log(videoFileLocalPath)
    console.log(thumbnailLocalPath)

    if(!videoFileLocalPath || !thumbnailLocalPath){
        throw new ApiError(400, "Video and Thumbnail files are required.")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile){
        throw new ApiError(500, "Issue in uploading video file on cloud")
    }

    if(!thumbnail){
        throw new ApiError(500, "Issue in uploading thumbnail file on cloud")
    }

    const video = await Video.create(
        {
            videoFile: {
                url: videoFile.url,
                public_id: videoFile.public_id
            },
            thumbnail: {
                url: thumbnail.url,
                public_id: thumbnail.public_id
            },
            title,
            description: description || "",
            duration: videoFile?.duration,
            owner: req.user._id
        }
    )

    const uploadedVideoDetails = Video.findById(video._id)

    if(!uploadedVideoDetails){
        throw new ApiError(400, "Error in uploading video.")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video uploaded successfully."
    ))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "No Video ID Received.")
    }

    const video = await Video.aggregate([
        {
            $match: mongoose.Types.ObjectId(videoId) 
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                isLiked:{
                    $cond: {
                        if:{
                            $in: [req.user._id, "$likes.likedBy"], 
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                "thumbnail.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1

            }
        }
    ])

    if(!video){
        throw new ApiError(500, "Error fetching the video")
    }

    await Video.findByIdAndUpdate(videoId,{
        $inc: {
            views: 1
        }
    })

    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: videoId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully."
        )
    )
    

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
