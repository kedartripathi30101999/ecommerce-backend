const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require('../config/mail')
const generateOTP = require('../utils/generateOTP')

//* Register User
const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = generateOTP();

        // OTP expires after 5 minutes
        const otpExpiry = Date.now() + 5 * 60 * 1000;

        // Create User
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
            isVerified: false
        });

        // Send OTP Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Email Verification OTP",

            html: `
            <div style="font-family: Arial, sans-serif; max-width:500px; margin:auto; border:1px solid #ddd; border-radius:10px; overflow:hidden;">
                
                <div style="background:#4f46e5; color:white; padding:20px; text-align:center;">
                    <h2>E-Commerce App</h2>
                </div>

                <div style="padding:20px;">

                    <h3>Hello ${name},</h3>

                    <p>Thank you for registering.</p>

                    <p>Your OTP for email verification is:</p>

                    <h1 style="text-align:center; letter-spacing:8px; color:#4f46e5;">
                        ${otp}
                    </h1>

                    <p>This OTP is valid for <b>5 minutes</b>.</p>

                    <p>Please do not share this OTP with anyone.</p>

                </div>

                <div style="background:#f5f5f5; padding:15px; text-align:center;">
                    © ${new Date().getFullYear()} E-Commerce App
                </div>

            </div>
            `
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful. OTP sent to your email."
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



//* Login User
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        //check user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid Email or Password" });
        }

        //Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or Password",
            });
        }


        // Check email verification
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in."
            });
        }




        //Generate JWT Token
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

        const { email } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        const otp = generateOTP()

        user.otp = otp
        user.otpExpiry = Date.now() + 5 * 60 * 1000

        await user.save()

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP verification code is: ${otp}\n\nThis code expires in 10 minutes.\nDo not share this code with anyone.`,
            html: `
             <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 40px auto; padding: 0; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
                    <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 30px 20px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">E-Commerce API</h2>
                    </div>
                    <div style="padding: 30px 20px;">
                    <h3 style="color: #333333; margin-top: 0; font-size: 20px;">Verify Your Email</h3>
                    <p style="color: #555555; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                        Hello there,<br><br>You're almost ready to get started. Please use the following One-Time Password (OTP) to complete your verification process:
                    </p>
                        <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border-left: 4px solid #8b5cf6; padding: 20px; text-align: center; border-radius: 8px; margin: 0 auto 25px auto;">
                        <span style="display: block; font-size: 32px; font-weight: bold; color: #4338ca; letter-spacing: 8px; text-shadow: 1px 1px 2px rgba(0,0,0,0.05);">${otp}</span>
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 0;"><strong>Note:</strong> This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="color: #ef4444; font-size: 13px; margin-top: 8px;">Never share this code with anyone, including our support team.</p>
                </div>
                    <div style="background-color: #f8fafc; padding: 15px 20px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} E-Commerce App. All rights reserved.</p>
                </div>
            </div>
            `
        })

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully'
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


//* Verify-OTP
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found. Please request a new OTP'
            })
        }

        if (user.otp !== otp) {
            return res.status(400).json({
                succsess: false,
                message: 'Invalid OTP'
            })
        }

        if (Date.now() > user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            })
        }

        user.isVerified = true,
            user.otp = null,
            user.otpExpiry = null

        await user.save()

        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        })
    }

    catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


//* Forgot password
const forgotPassword = async (req, res) => {

    try {
        const { email } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        const otp = generateOTP()

        user.otp = otp,
            user.otpExpiry = Date.now() + 5 * 60 * 1000

        await user.save()

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            html: `
                   <h2>Password Reset Request</h2>
                   <p>Your OTP is:</p>
                   <h1>${otp}</h1>
                   <p>This OTP is valid for 5 minutes.</p>
            `
        })


        res.status(200).json({
            success: true,
            message: "Password reset OTP sent successfully"
        });
    }
    catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


//* Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check OTP exists
        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new OTP."
            });
        }

        // Verify OTP
        if (String(user.otp) !== String(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Check OTP expiry
        if (Date.now() > user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        user.password = hashedPassword;

        // Clear OTP
        user.otp = null;
        user.otpExpiry = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
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


//* Delete user

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



module.exports = { registerUser, loginUser, sendOTP, verifyOTP, forgotPassword, resetPassword, getAllUsers, getProfile, deleteUser };
