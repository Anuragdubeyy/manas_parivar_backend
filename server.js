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
    `mongodb+srv://anuragdubey16017_db_user:${MONGO}@cluster0.2yden43.mongodb.net/`,
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
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

const PORT =  5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));