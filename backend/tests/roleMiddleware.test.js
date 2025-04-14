import { jest } from '@jest/globals';
import { isTeacher, isStudent } from '../middleware/roleMiddleware.js';

describe('Role Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      user: { id: 'user-id', role: '' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('isTeacher', () => {
    it('should call next() if user is a teacher', () => {
      // Arrange
      req.user.role = 'teacher';

      // Act
      isTeacher(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a teacher', () => {
      // Arrange
      req.user.role = 'student';

      // Act
      isTeacher(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Acces interzis. Această acțiune necesită rol de profesor.'
      }));
    });
  });

  describe('isStudent', () => {
    it('should call next() if user is a student', () => {
      // Arrange
      req.user.role = 'student';

      // Act
      isStudent(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a student', () => {
      // Arrange
      req.user.role = 'teacher';

      // Act
      isStudent(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Acces interzis. Această acțiune necesită rol de student.'
      }));
    });
  });
});