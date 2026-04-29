import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@aeris.ai';
    const adminPassword = 'admin'; // Simple password for default admin

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        is_admin: true,
        telegram_linked: false,
        profile: {
          name: 'Master Admin',
        },
        onboarding: {
          completed: true,
          step: 8
        }
      });
      console.log('🌱 Default Admin created (admin@aeris.ai / admin)');
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  }
};

export default seedAdmin;
