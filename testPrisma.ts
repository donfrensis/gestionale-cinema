import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery() {
  try {
    const shows = await prisma.show.findMany({
      select: {
        date: true,
        time: true
      }
    });

    const formattedShows = shows.map(show => ({
        date: show.date,
        time: show.time.toISOString().split('T')[1].split('.')[0]  // Estrai solo "HH:mm:ss"
      }));
      
      console.log(formattedShows);
  } catch (error) {
    console.error('Errore nella query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
