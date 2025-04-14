import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { register, login } from '../controller/authController.js';

// Mock the pool module
jest.mock('../database/pool.js', () => {
  return {
    default: { query: jest.fn() },
    query: jest.fn()
  };
});

// Mock bcrypt and jsonwebtoken
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Mock request and response
const mockRequest = () => {
  return {
    body: {},
    user: {}
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller', () => {
  let req, res;
  
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
        firstName: 'Test',
        lastName: 'User'
      };
      
      bcrypt.hash.mockResolvedValue('hashedpassword');
      pool.query.mockResolvedValueOnce({ rows: [] }); // No existing user
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'uuid-1234' }] }); // User insert
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 'uuid-1234' }] }); // Profile insert

      // Act
      await register(req, res);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cont creat cu succes.'
      }));
    });

    it('should return 400 if username already exists', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.body = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
        firstName: 'Test',
        lastName: 'User'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

      // Act
      await register(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Numele de utilizator sau email-ul există deja.'
      }));
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      req.body = {
        username: 'testuser',
        // Missing email and other required fields
      };

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Toate câmpurile sunt obligatorii.'
      }));
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.body = {
        username: 'testuser',
        password: 'password123'
      };
      
      const mockUser = {
        id: 'uuid-1234',
        username: 'testuser',
        role: 'student',
        password_hash: 'hashedpassword'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          first_name: 'Test', 
          last_name: 'User' 
        }] 
      });
      
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake-token');

      // Act
      await login(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Autentificare reușită.',
        token: 'fake-token'
      }));
    });

    it('should return 401 with incorrect password', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'uuid-1234', 
          password_hash: 'hashedpassword' 
        }] 
      });
      
      bcrypt.compare.mockResolvedValue(false);

      // Act
      await login(req, res);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Nume de utilizator sau parolă incorecte.'
      }));
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.body = {
        username: 'nonexistentuser',
        password: 'password123'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Utilizatorul nu a fost găsit.'
      }));
    });
  });
});