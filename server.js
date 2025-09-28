const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoute');
const productRoutes = require('./routes/productRoutes');
const { default: mongoose } = require('mongoose');

dotenv.config();

const MONGO = process.env.DB_PASSWORD;
mongoose
  .connect(
    `mongodb+srv://anuragdubey16017_db_user:p7wq0G2aLgPh4YQs@cluster0.2yden43.mongodb.net/`,
  )
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const app = express();

const cors = require('cors');

app.use(cors({
  origin: ["https://manas-parivar.vercel.app","http://localhost:3000", "http://localhost:5173"],
  methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,

}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 मानस परिवार Backend API Working!");
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

const PORT =  5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));