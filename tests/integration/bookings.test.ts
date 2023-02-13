import app, { init } from '@/app';
import { prisma } from '@/config';
import faker from '@faker-js/faker';
import httpStatus from 'http-status';
import supertest from 'supertest';
import { createUser, createHotel, createRoomWithHotelId, createBooking } from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import * as jwt from 'jsonwebtoken';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 if user has no bookings', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with status 200 and booking info', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(room.id, user.id);

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);

      expect(response.body).toEqual({
        id: booking.id,
        Room: { ...room, createdAt: room.createdAt.toISOString(), updatedAt: room.updatedAt.toISOString() },
      });
    });
  });
});

describe('POST /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.post('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 if no room id is given', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      await createRoomWithHotelId(hotel.id);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({});
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with status 404 if there's no room for given id - invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      await createRoomWithHotelId(hotel.id);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: 0 });
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with status 404 if there's no room for given id - valid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
  
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: (room.id + 1) });
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
    it('should respond with status 403 if user already has a booking', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      await createBooking(room.id, user.id);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with status 403 if room is out of capacity', async () => {
      const auxUser1 = await createUser();
      const auxUser2 = await createUser();
      const auxUser3 = await createUser();
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createBooking(room.id, auxUser1.id);
      await createBooking(room.id, auxUser2.id);
      await createBooking(room.id, auxUser3.id);
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with status 200 and booking id, and insert a booking in the database', async () => {
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const user = await createUser();
      const token = await generateValidToken(user);
      const beforeCount = await prisma.booking.count();
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
      const afterCount = await prisma.booking.count();
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: expect.any(Number),
      });
      expect(beforeCount).toEqual(0);
      expect(afterCount).toEqual(1);
    });
  });
});

describe('PUT /booking/:id', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.put('/booking/1');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 if no room id is given', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(room.id, user.id);

      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({});
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with status 404 if there's no room for given id - invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(room.id, user.id);

      const response = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: 0 });
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with status 404 if there's no room for given id - valid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await createBooking(room.id, user.id);
  
        const response = await server
          .put(`/booking/${booking.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ roomId: (room.id + 1) });
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
    it('should respond with status 403 if room is out of capacity', async () => {
      const auxUser1 = await createUser();
      const auxUser2 = await createUser();
      const auxUser3 = await createUser();
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createBooking(room.id, auxUser1.id);
      await createBooking(room.id, auxUser2.id);
      await createBooking(room.id, auxUser3.id);
      const user = await createUser();
      const userRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(userRoom.id, user.id);
      const token = await generateValidToken(user);
      const response = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with status 404 if there is no booking for given id - invalid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(room.id, user.id);

      const response = await server.put(`/booking/0`).set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with status 404 if there is no booking for given id - valid', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await createBooking(room.id, user.id);
  
        const response = await server.put(`/booking/${booking.id + 1}`).set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
    it('should respond with status 401 if booking id doesnt belong to user', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const auxUser = await createUser();
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(room.id, auxUser.id);

      const response = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 200 and booking id, and change room for given booking', async () => {
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const user = await createUser();
      const token = await generateValidToken(user);
      const booking = await createBooking(room.id, user.id);
      const newRoom = await createRoomWithHotelId(hotel.id);

      const response = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: newRoom.id });
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: expect.any(Number),
      });
      const updatedBooking = await prisma.booking.findUnique({
        where: {
          id: booking.id,
        },
      });
      expect(updatedBooking.roomId).toBe(newRoom.id);
    });
  });
});
