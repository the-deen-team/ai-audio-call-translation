// pages/api/fetch-users.js
import { createClerkClient } from '@clerk/clerk-sdk-node';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  console.log('Fetching users...'); // Debug log
  console.log('Clerk Secret Key:', process.env.CLERK_SECRET_KEY); // Log the key to ensure it's loaded

  try {
    const users = await clerkClient.users.getUserList({
      limit: 10,
      orderBy: '-created_at',
    });

    console.log('Fetched users:', users); // Log fetched users

    // Parse and structure the users data
    const parsedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.firstName || 'No First Name',
      lastName: user.lastName || 'No Last Name',
    }));

    // Send the users as a JSON response
    res.status(200).json(parsedUsers);
  } catch (error) {
    console.error(':', error); // Log the error
    res.status(500).json({ error: '' });
  }
}
