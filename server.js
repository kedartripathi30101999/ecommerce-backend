require("dotenv").config();
const express= require('express')
const path= require('path')
const cors= require('cors')
const connectDB= require('./config/db')
const transporter= require('./config/mail')


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


app.get("/test-mail", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      text: "Hello from Node.js",
    });

    res.send("Mail Sent");
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});


//test route
app.get('/',(req,res)=>{
    res.send('E-commerce backend running')
})

const PORT= process.env.PORT || 5000

app.listen(PORT,()=>{
    console.log(`server runnnig on port http://localhost:${PORT}`)
})