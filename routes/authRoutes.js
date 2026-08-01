const express= require('express')
const router= express.Router()

const {registerUser, loginUser, sendOTP, verifyOTP, forgotPassword, resetPassword, getAllUsers, getProfile, deleteUser}= require('../controllers/authController')
const {protect,authorize}= require('../middleware/authMiddleware')
const {adminOnly}= require('../middleware/adminMiddleware')

router.post('/register',registerUser)
router.post('/login',loginUser)
router.post('/send-otp',sendOTP)
router.post('/verify-otp',verifyOTP)
router.post('/forgot-password',forgotPassword)
router.post('/reset-password',resetPassword)

router.get('/profile',protect,(req,res)=>{
    res.json({
        message:'Profile Accessed Successfully',
        user: req.user
    })
})

router.get('/admin',protect,authorize('admin'),(req,res)=>{
    res.json({
        message:'Welcome Admin'
    })
})

router.get("/users", protect, adminOnly, getAllUsers);
router.get("/profile", protect, getProfile);

router.delete("/users/:id", protect, adminOnly, deleteUser);

module.exports= router