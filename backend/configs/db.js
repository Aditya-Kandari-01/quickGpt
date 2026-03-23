import mongoose from "mongoose";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('ur db is connected`')
  } catch (error) {
    console.log(error.message);
  }
};
export default connectDb;
