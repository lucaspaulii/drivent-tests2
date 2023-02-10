import { prisma } from '@/config';
import { Room } from '@prisma/client';

async function findRoomById(roomId: number) : Promise <Room>{
  return await prisma.room.findFirst({
    where: {
      id: roomId,
    },
    include: {
      Booking: true
    }
  });
}

const roomRepository = {
  findRoomById,
};

export default roomRepository;
