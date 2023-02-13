import { notFoundError } from '@/errors';
import { AuthenticatedRequest } from '@/middlewares';
import bookingService from '@/services/booking-service';
import { Response } from 'express';
import httpStatus from 'http-status';

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = await bookingService.getBookingByUser(userId);
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = req.body.roomId;

  if (!roomId) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }

  try {
    const booking = await bookingService.postBooking(userId, Number(roomId));
    return res.status(httpStatus.OK).send({id: booking});
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === 'businessRuleError') {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { bookingId } = req.params;

  const roomId = req.body.roomId;

  if (!roomId) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
  if (!bookingId) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }

  try {
    const booking = await bookingService.putBooking(userId, Number(roomId), Number(bookingId));
    return res.status(httpStatus.OK).send({id: booking});
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === 'businessRuleError') {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === 'UnauthorizedError') {
        return res.sendStatus(httpStatus.UNAUTHORIZED);
      }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}
