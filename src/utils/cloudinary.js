import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { upload } from "../middlewares/multer.middlewares.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded
    // console.log("File is uploaded on cloudinary", response.url);
    // console.log("Cloudinary Response");
    // console.log(response);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("I am in Catch");
    fs.unlinkSync(localFilePath); //remove the locally saved temp file as the upload operation got failed
    return null;
  }
};

export default uploadOnCloudinary;
