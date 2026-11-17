require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const Project = require('./src/models/Project');
const Task = require('./src/models/Task');

const migrateOrganization = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');

    // Find the existing Admin account
    const admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      throw new Error('No Admin account found.');
    }

    // Check whether the organization already exists
    let organization = await Organization.findOne({
      slug: 'teamorbit'
    });

    if (!organization) {
      organization = await Organization.create({
        name: 'TeamOrbit',
        slug: 'teamorbit',
        owner: admin._id
      });

      console.log('TeamOrbit organization created.');
    } else {
      console.log('TeamOrbit organization already exists.');
    }

    // Link existing users to the organization
    await User.updateMany(
      { organization: null },
      { $set: { organization: organization._id } }
    );

    // Link existing projects
    const projectResult = await Project.updateMany(
      { organization: { $exists: false } },
      { $set: { organization: organization._id } }
    );

    // Link existing tasks
    const taskResult = await Task.updateMany(
      { organization: { $exists: false } },
      { $set: { organization: organization._id } }
    );

    console.log('Migration completed successfully.');
    console.log('Projects updated:', projectResult.modifiedCount);
    console.log('Tasks updated:', taskResult.modifiedCount);

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migrateOrganization();