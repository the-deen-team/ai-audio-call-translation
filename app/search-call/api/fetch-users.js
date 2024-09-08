// pages/api/fetch-users.js
import { createClerkClient } from '@clerk/clerk-sdk-node';
import * as dotenv from 'dotenv';

dotenv.config();

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  try {
    const users = await clerkClient.users.getUserList({
      limit: 10,
      orderBy: '-created_at',
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
