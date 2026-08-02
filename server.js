const express= require('express')
require('dotenv').config()
const path= require('path')
const cors= require('cors')
const connectDB= require('./config/db')

const app= express()

connectDB()

//middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/uploads',express.static(path.join(__dirname,'uploads')))


app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/products',require('./routes/productRoutes'))
app.use("/api/orders", require("./routes/orderRoutes"));


//test route
app.get('/',(req,res)=>{
    res.send('E-commerce backend running')
})

const PORT= process.env.PORT || 5000

app.listen(PORT,()=>{
    console.log(`server runnnig on port http://localhost:${PORT}`)
})