import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";


const generateAccessandRefreshToken = async (userId) => {
    // console.log("generateAccessandRefreshToken");
    try {
      const user = await User.findById(userId);
      const accessToken = await user.generateAccessToken();
      // console.log("accessToken", accessToken);
      const refreshToken = await user.generateRefreshToken();
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
      return { refreshToken, accessToken };
    } catch (error) {
      return new ApiError(
        500,
        "Something went wrong while generating refresh and access token"
      );
    }
  };


  const registerUser = asynchandler(async (req, res) => {
    // get user details (validation)
    // put it into mongodb( if new user)(chek old user) (you have to make a object)
    //sent success msg(check for user creation) (but remove password and refresh token form response data.)
    // console.log(req.body);
    const { fullName, jobId, password, area, role } = req.body;
    console.log(fullName, jobId, password, area, role);
    if (
      [fullName, jobId, password, area, role].some((field) => field?.trim === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }
  
    //find the existing user (jobIdor eamil) (helps to give error)
    const existedUser = await User.findOne({ $or: [{ jobId }] });
    if (existedUser) {
      throw new ApiError(409, "User with  jobId already exists.");
    }
    const user = await User.create({
      fullName,
      password,
      jobId,
      area,
      role,
    });
    
    console.log("user :", user);
    //it check weather user is created(if created then remove password and refreshToken (we user select method in which we pass field which we don't required(put it in a string with a -ve symbol)))
    // or not .
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
  
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  });


  // const loginUser = asynchandler(async (req, res) => {
  //   // req.body-> jobIdor email ,password
  //   // find the user if found (proceed further ) throw apiError(register first)
  //   // compare password
  //   //  access and refresh token
  //   // send cookies
  //   // console.log("login User :");
  
  //   const { jobId, password } = req.body;
  //   // console.log(jobId, password);
  //   if (!jobId) {
  //     return new ApiError(400, "jobId required");
  //   }
  
  //   const user = await User.findOne({ $or: [{ jobId }] });
  
  //   if (!user) {
  //     return  res.status(400).send("User does not exit")
  //     // return new ApiError(400, "User does not exit");
  //   }
  //   const isPasswordValid = await user.isPasswordCorrect(password);
  
  //   if (!isPasswordValid) {
  //     return res.status(400).send("Enter correct Password")
  //     // return new ApiError(400, "Enter correct Password");
  //   }
  //   const { refreshToken, accessToken } = await generateAccessandRefreshToken(
  //     user._id
  //   );
  //   const loggedInUser = await User.findById(user._id).select(
  //     "-password -refreshToken"
  //   );
  
  //   const options = {
  //     httpOnly: true,
  //     secure: true,
  //   };
  //   console.log("options", options);
  //   return res
  //     .status(200)
  //     .cookie("accessToken", accessToken, options)
  //     .cookie("refreshToken", refreshToken, options)
  //     .json(
  //       new ApiResponse(
  //         200,
  //         {
  //           user: loggedInUser,
  //           accessToken,
  //           refreshToken,
  //         },
  //         "User LoggedIn Successfully"
  //       )
  //     );
  // });

  const loginUser = asynchandler(async (req, res) => {
    const { jobId, password } = req.body;

    if (!jobId) {
      return res.status(500).send("jobId required");
    }

    const user = await User.findOne({ $or: [{ jobId }] });

    if (!user) {
      return res.status(500).send("User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.status(500).send("Incorrect Password");
    }

    const { refreshToken, accessToken } = await generateAccessandRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
      httpOnly: true,
      secure: true, // Only use secure cookies in production
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User LoggedIn Successfully"
        )
      );
});


  const logoutUser = asynchandler(async (req, res) => {
    //clear cookies
    // console.log("refreshToken :", Headers);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );
  
    console.log("use", user);
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "user logout successfully"));
  });


  const refresh_token = asynchandler(async (req, res) => {
  
    // fetch data (req.body || req.header.cookies)
    // find the user in data (_id)
    // set accessToken in cookies for this.
  
    const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;
    console.log(incomingToken);
    try {
      if (!incomingToken) {
        throw new ApiError(401, "Unauthorized request");
      }
      const decodedToken = jwt.verify(
        incomingToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      if (!decodedToken) {
        throw new ApiError(
          400,
          "Something went wrong while decoding refresh Token"
        );
      }
      // console.log(decodedToken);
      const user = await User.findById(decodedToken?._id);
      // console.log("user", user);
      if (!user) {
        throw new ApiError(401, "Invalid refresh Token");
      }
      // console.log("userrefreshToken", user.refreshToken);
      if (incomingToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used");
      }
      const { refreshToken, accessToken } = await generateAccessandRefreshToken(
        user._id
      );
      console.log(refreshToken, accessToken);
      const options = {
        httpOnly: true,
        secure: true,
      };
      res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(
            200,
            { accessToken, refreshToken: refreshToken },
            "Access Token refreshed"
          )
        );
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh Token");
    }
  });



  export {
    registerUser,
    loginUser,
    logoutUser,
    refresh_token
  }