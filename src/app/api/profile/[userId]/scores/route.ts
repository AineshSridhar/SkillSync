import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request, {params} : {params: {userId: string}}) {
  try {
    console.log("Coming on the right link")
    const userId = parseInt(params.userId, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user id' },
        { status: 400 }
      );
    }

    const profileUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!profileUser){
        return NextResponse.json({error: "User not found"}, {status: 404});
    }

    // Retrieve the AI scores for the current user
    const userScores = await prisma.userScore.findUnique({
      where: { userId: profileUser.id },
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
    console.log("Retrieved AI scores")

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
