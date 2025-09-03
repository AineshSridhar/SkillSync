import { NextResponse, NextRequest } from 'next/server';
import { getUserFromSession } from '@/utils/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Retrieve the AI scores for the current user
    const userScores = await prisma.userScore.findUnique({
      where: { userId: user.id },
      select: {
        automatedWorkEthic: true,
        automatedCreativity: true,
        automatedSkills: true,
      },
    });

    // Check if scores were found
    if (!userScores) {
      return NextResponse.json({ scores: null }, { status: 200 });
    }

    // Format the scores to match the client-side type
    const aiScores = {
      workEthic: userScores.automatedWorkEthic,
      creativity: userScores.automatedCreativity,
      skills: userScores.automatedSkills,
    };

    return NextResponse.json({ scores: aiScores }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user scores:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
