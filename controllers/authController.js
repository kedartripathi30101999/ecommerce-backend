const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mail");
const generateOTP = require("../utils/generateOTP");

//* Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();

    const otpExpiry = Date.now() + 5 * 60 * 1000;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false,
    });

    await transporter.sendMail({
      from: `"E-Commerce App" <${process.env.BREVO_USER}>`,

      to: email,

      subject: "Email Verification OTP",

      html: `
            <h2>E-Commerce App</h2>

            <h3>Hello ${name}</h3>

            <p>Your OTP for email verification is:</p>

            <h1>${otp}</h1>

            <p>This OTP expires in 5 minutes.</p>
            `,
    });

    res.status(201).json({
      success: true,

      message: "Registration successful. OTP sent to your email.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

//* Login User

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,

        message: "Please verify your email before logging in.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    res.status(200).json({
      message: "Login Successful",

      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//* SEND OTP

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    const otp = generateOTP();

    user.otp = otp;

    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    await transporter.sendMail({
      from: `"E-Commerce App" <${process.env.BREVO_USER}>`,

      to: email,

      subject: "Email Verification OTP",

      html: `

            <div style="font-family:Arial;padding:20px">

                <h2>E-Commerce App</h2>

                <h3>Verify Your Email</h3>

                <p>Your OTP is:</p>

                <h1 style="letter-spacing:8px;color:#4f46e5">

                    ${otp}

                </h1>

                <p>This OTP is valid for 5 minutes.</p>

            </div>

            `,
    });

    res.status(200).json({
      success: true,

      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

//* VERIFY OTP

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,

        message: "OTP not found. Please request new OTP.",
      });
    }

    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,

        message: "Invalid OTP",
      });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({
        success: false,

        message: "OTP expired",
      });
    }

    user.isVerified = true;

    user.otp = null;

    user.otpExpiry = null;

    await user.save();

    res.status(200).json({
      success: true,

      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

//* Forgot Password

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    const otp = generateOTP();

    user.otp = otp;

    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    await transporter.sendMail({
      from: `"E-Commerce App" <${process.env.BREVO_USER}>`,

      to: email,

      subject: "Password Reset OTP",

      html: `

            <div style="font-family:Arial;padding:20px">

                <h2>E-Commerce App</h2>

                <h3>Password Reset Request</h3>


                <p>Your password reset OTP is:</p>


                <h1 style="color:#4f46e5;letter-spacing:8px">

                    ${otp}

                </h1>


                <p>This OTP is valid for 5 minutes.</p>


            </div>

            `,
    });

    res.status(200).json({
      success: true,

      message: "Password reset OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

//* Reset Password

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,

        message: "OTP not found",
      });
    }

    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,

        message: "Invalid OTP",
      });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({
        success: false,

        message: "OTP expired",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    user.otp = null;

    user.otpExpiry = null;

    await user.save();

    res.status(200).json({
      success: true,

      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

//* GET ALL USERS

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,

      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

//* GET PROFILE

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,

      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

//* DELETE USER

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,

      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

module.exports = {
  registerUser,

  loginUser,

  sendOTP,

  verifyOTP,

  forgotPassword,

  resetPassword,

  getAllUsers,

  getProfile,

  deleteUser,
};
