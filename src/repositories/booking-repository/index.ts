import { prisma } from '@/config';
import { Booking, Room } from '@prisma/client';

type BookingFound = {
  id: number;
  Room: Room;
};

async function findBooking(userId: number): Promise<BookingFound> {
  return prisma.booking.findFirst({
    where: {
      userId,
    },
    select: {
      id: true,
      Room: true,
    },
  });
}

async function findBookingById(id: number) {
  return prisma.booking.findFirst({
    where: {
      id,
    },
    select: {
      id: true,
      Room: true,
      userId: true,
    },
  });
}

async function createBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId,
    },
  });
}

async function findBookingsForRoom(roomId: number) {
  return prisma.booking.count({
    where: {
      roomId,
    },
  });
}

async function updateBookingRoom(bookingId: number, roomId: number) {
  return prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      roomId,
    },
  });
}

const bookingRepository = {
  findBooking,
  createBooking,
  findBookingsForRoom,
  updateBookingRoom,
  findBookingById,
};

export default bookingRepository;
