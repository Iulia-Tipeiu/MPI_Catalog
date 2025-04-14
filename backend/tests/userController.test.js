import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import { 
  getProfile, 
  updateProfile,
  changePassword
} from '../controller/userController.js';

// Mock the pool module
jest.mock('../database/pool.js', () => {
  return {
    default: { query: jest.fn() },
    query: jest.fn()
  };
});

// Mock bcrypt
jest.mock('bcrypt');

// Mock request and response
const mockRequest = () => {
  return {
    body: {},
    user: { id: 'user-id' }
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('User Controller', () => {
  let req, res;
  
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'student'
      };
      
      const mockProfile = {
        user_id: 'user-id',
        first_name: 'Test',
        last_name: 'User',
        phone: '1234567890',
        address: '123 Test St'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      pool.query.mockResolvedValueOnce({ rows: [mockProfile] });

      // Act
      await getProfile(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'student',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        address: '123 Test St'
      }));
    });

    it('should return 404 if user is not found', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Utilizator negăsit.'
      }));
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.body = {
        firstName: 'Updated',
        lastName: 'User',
        phone: '9876543210',
        address: '456 New St'
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          user_id: 'user-id', 
          first_name: 'Updated', 
          last_name: 'User' 
        }]
      });

      // Act
      await updateProfile(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Profil actualizat cu succes.',
        profile: expect.objectContaining({
          first_name: 'Updated',
          last_name: 'User'
        })
      }));
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      req.body = {
        firstName: 'Updated',
        // Missing lastName
      };

      // Act
      await updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Prenumele și numele sunt obligatorii.'
      }));
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.body = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
        confirmPassword: 'newPassword'
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ password_hash: 'hashedOldPassword' }]
      });
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      // Act
      await changePassword(req, res);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', 'hashedOldPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Parola a fost schimbată cu succes.'
      }));
    });

    it('should return 400 if passwords do not match', async () => {
      // Arrange
      req.body = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
        confirmPassword: 'differentPassword'
      };

      // Act
      await changePassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Parolele noi nu corespund.'
      }));
    });

    it('should return 401 if current password is incorrect', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.body = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword',
        confirmPassword: 'newPassword'
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ password_hash: 'hashedOldPassword' }]
      });
      
      bcrypt.compare.mockResolvedValue(false);

      // Act
      await changePassword(req, res);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedOldPassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Parola curentă este incorectă.'
      }));
    });
  });
});