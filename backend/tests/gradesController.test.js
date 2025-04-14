import { jest } from '@jest/globals';
import { 
  getStudentGrades, 
  getStudentGradesByCourse,
  getStudentGradeHistory,
  getStudentGradeStatistics
} from '../controller/gradesController.js';

// Mock the pool module
jest.mock('../database/pool.js', () => {
  return {
    default: { query: jest.fn() },
    query: jest.fn()
  };
});

// Mock request and response
const mockRequest = () => {
  return {
    body: {},
    user: { id: 'student-id', role: 'student' },
    params: {}
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Grades Controller', () => {
  let req, res;
  
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('getStudentGrades', () => {
    it('should get all grades for a student', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      
      const mockCourses = [
        { 
          id: 'course-1', 
          course_name: 'Math 101',
          teacher_first_name: 'John',
          teacher_last_name: 'Doe'
        }
      ];
      
      const mockAssignments = [
        { 
          id: 'assignment-1', 
          title: 'Homework 1',
          max_score: 100,
          score: 85
        }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: mockCourses });
      pool.query.mockResolvedValueOnce({ rows: mockAssignments });

      // Act
      await getStudentGrades(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        courses: expect.arrayContaining([
          expect.objectContaining({
            courseId: 'course-1',
            courseName: 'Math 101',
            assignments: mockAssignments
          })
        ])
      }));
    });

    it('should return a message if student is not enrolled in any courses', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await getStudentGrades(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Nu sunteți înscris la niciun curs.',
        courses: []
      }));
    });
  });

  describe('getStudentGradesByCourse', () => {
    it('should get grades for a specific course', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.courseId = 'course-id';
      
      const mockEnrollment = { course_id: 'course-id', student_id: 'student-id' };
      const mockCourse = {
        course_name: 'Math 101',
        teacher_first_name: 'John',
        teacher_last_name: 'Doe'
      };
      
      const mockAssignments = [
        { 
          id: 'assignment-1', 
          title: 'Homework 1',
          max_score: 100,
          score: 85
        }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: [mockEnrollment] });
      pool.query.mockResolvedValueOnce({ rows: [mockCourse] });
      pool.query.mockResolvedValueOnce({ rows: mockAssignments });

      // Act
      await getStudentGradesByCourse(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        course: expect.objectContaining({ name: 'Math 101' }),
        assignments: mockAssignments
      }));
    });

    it('should return 403 if student is not enrolled in the course', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.courseId = 'course-id';
      
      pool.query.mockResolvedValueOnce({ rows: [] }); // Not enrolled

      // Act
      await getStudentGradesByCourse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Nu sunteți înscris la acest curs.'
      }));
    });
  });

  describe('getStudentGradeHistory', () => {
    it('should get grade history for a student', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      
      const mockGrades = [
        { 
          id: 'grade-1', 
          score: 85,
          max_score: 100,
          title: 'Homework 1',
          course_name: 'Math 101',
          created_at: '2025-04-01'
        }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: mockGrades });

      // Act
      await getStudentGradeHistory(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        grades: expect.arrayContaining([
          expect.objectContaining({
            id: 'grade-1',
            score: 85,
            percentage: 85  // Percentage calculation: (85/100)*100
          })
        ])
      }));
    });

    it('should return a message if student has no grades', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await getStudentGradeHistory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Nu există istoric de note.',
        grades: []
      }));
    });
  });

  describe('getStudentGradeStatistics', () => {
    it('should get grade statistics for a student', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      
      const mockGrades = [
        { 
          score: 85,
          max_score: 100,
          course_id: 'course-1',
          course_name: 'Math 101'
        },
        { 
          score: 90,
          max_score: 100,
          course_id: 'course-1',
          course_name: 'Math 101'
        }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: mockGrades });

      // Act
      await getStudentGradeStatistics(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        statistics: expect.objectContaining({
          overallAverage: 87.5,  // (85+90)/(100+100)*100
          totalAssignments: 2,
          courseAverages: expect.objectContaining({
            'course-1': {
              courseName: 'Math 101',
              average: 87.5
            }
          })
        })
      }));
    });

    it('should return a message if student has no grades', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await getStudentGradeStatistics(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Nu există note pentru calculul statisticilor.',
        statistics: null
      }));
    });
  });
});