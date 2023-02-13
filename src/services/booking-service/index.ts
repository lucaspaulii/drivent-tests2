import { notFoundError, unauthorizedError } from '@/errors';
import { businessRuleError } from '@/errors/business-rule-error';
import bookingRepository from '@/repositories/booking-repository';
import roomRepository from '@/repositories/room-repository';

async function checkRoom(roomId: number) {
  const roomExists = await roomRepository.findRoomById(roomId);
  if (!roomExists) {
    throw notFoundError();
  }
  const bookingsForRoom = await bookingRepository.findBookingsForRoom(roomId);
  if (roomExists.capacity - bookingsForRoom < 1) {
    throw businessRuleError();
  }
}

async function getBookingByUser(userId: number) {
  const result = await bookingRepository.findBooking(userId);

  if (!result) {
    throw notFoundError();
  }

  return result;
}
async function getBookingById(bookingId: number) {
  const result = await bookingRepository.findBookingById(bookingId);

  if (!result) {
    throw notFoundError();
  }

  return result;
}

async function postBooking(userId: number, roomId: number) {
  await checkRoom(roomId);
  const usersBooking = await bookingRepository.findBooking(userId);
  if (usersBooking) {
    throw businessRuleError();
  }
  const createBooking = await bookingRepository.createBooking(userId, roomId);
  return createBooking.id;
}

async function putBooking(userId: number, roomId: number, bookingId: number) {
  await checkRoom(roomId);
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw notFoundError();
  }
  if (booking.userId !== userId) {
    throw unauthorizedError();
  }
  const updateBooking = await bookingRepository.updateBookingRoom(bookingId, roomId);
  return updateBooking.id;
}

const bookingService = {
  getBookingByUser,
  postBooking,
  putBooking,
};

export default bookingService;
