import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";
import xlsx from 'xlsx';
import bcrypt from 'bcrypt';
import path from 'path';
import moment from 'moment';
import { fileURLToPath } from 'url';
import Employee from "../models/employee.model.js";
// import User from '../models/user.model.js';


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


const loginUser = asynchandler(async (req, res) => {
    const { employeeId, password } = req.body;

    if (!employeeId) {
      return res.status(500).send("employeeId required");
    }

    const user = await User.findOne({ $or: [{ employeeId }] });

    if (!user) {
      return res.status(500).send("User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    // console.log("ispassword", isPasswordValid);

    if (!isPasswordValid) {
      // console.log("password is not correct");
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


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the path to your Excel file
// const excelFilePath = path.join(__dirname, '"C:\Users\Vishal Gupta\Downloads\Book 4.xlsx"');

const excelFilePath = 'C:/Users/Vishal Gupta/Downloads/DOB Master_final.xlsx';

// "C:\Users\Vishal Gupta\Downloads\DOB Master_final.xlsx"

function convertExcelDate(serial) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + serial * 86400000);
    return date;
  }

const registerUser = async (req, res) => {
    try {
      const workbook = xlsx.readFile(excelFilePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
      const usersToInsert = [];

      // let rowCount = 0;
   
      for (const row of data) {
        
        // if (rowCount === 200) break;

        const { employeeId, dob } = row;

        // rowCount++; // ✅ Count the row after processing

        
        // const employeeExists = await Employee.findOne({ employeeId });

        // if (!employeeExists) {
        //   // console.log(`Skipping: Employee ${employeeId} not found.`);
        //   continue;
        // }

        const reportingHeadMatch = await Employee.findOne({
          reportingHead: { $regex: `\\(${employeeId}\\)` }
        });
  
        if (!reportingHeadMatch) {
          // console.log(`Skipping: ${employeeId} is not a reporting head.`);/
          continue;
        }

        if (!employeeId || !dob) continue;

        let jsDate;

        if (typeof dob === 'number') {
          jsDate = convertExcelDate(dob); // Convert from Excel serial
        } else {
          jsDate = new Date(dob); // Parse normally if it's already a Date
        }
      
        const dobFormatted = moment(jsDate).format('DDMMYYYY');


        console.log("dobFormatted", dobFormatted);

        const hashedPassword = await bcrypt.hash(dobFormatted, 10);
  
        usersToInsert.push({
          employeeId,
          password: hashedPassword,
          // dob: dobFormatted
        });
      }

      // console.log("EmployeeDetails", usersToInsert);
  
      const result = await User.insertMany(usersToInsert, { ordered: false });
      res.status(201).json({ message: 'Users registered successfully', count: result.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error registering users', error: error.message });
    }
  }

  
// registerUser = 

  


export {
    registerUser,
    loginUser,
  }