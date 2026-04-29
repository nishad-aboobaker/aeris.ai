import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    const emailToMakeAdmin = process.argv[2];
    
    if (!emailToMakeAdmin) {
      console.log("Please provide an email: node make-admin.js your@email.com");
      process.exit(1);
    }

    const user = await User.findOne({ email: emailToMakeAdmin });
    
    if (!user) {
      console.log("User not found!");
      process.exit(1);
    }

    user.is_admin = true;
    await user.save();
    
    console.log(`Success! ${emailToMakeAdmin} is now an admin.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

makeAdmin();
