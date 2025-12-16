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
