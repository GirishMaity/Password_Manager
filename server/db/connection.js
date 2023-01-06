const mongoose = require("mongoose");

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connection success.");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};

connectToDatabase();
