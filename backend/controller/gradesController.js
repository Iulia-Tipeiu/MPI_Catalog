// Fișier nou: controller/gradeController.js
import pool from "../db/pool.js";

// Obține toate notele unui student pentru toate cursurile
export const getStudentGrades = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Obținem toate cursurile la care este înscris studentul
    const enrolledCoursesQuery = `
      SELECT c.id, c.course_name, u.username as teacher_username, 
             p.first_name as teacher_first_name, p.last_name as teacher_last_name
      FROM courses c
      JOIN course_enrollments ce ON c.id = ce.course_id
      JOIN users u ON c.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE ce.student_id = $1
      ORDER BY c.course_name
    `;

    const enrolledCourses = await pool.query(enrolledCoursesQuery, [studentId]);

    if (enrolledCourses.rows.length === 0) {
      return res.status(200).json({
        message: "Nu sunteți înscris la niciun curs.",
        courses: [],
      });
    }

    // Pentru fiecare curs, obține toate temele și notele
    const coursesWithGrades = [];

    for (const course of enrolledCourses.rows) {
      const assignmentsQuery = `
        SELECT a.id, a.title, a.max_score, g.score, g.comment, g.created_at as graded_at
        FROM assignments a
        LEFT JOIN grades g ON a.id = g.assignment_id AND g.student_id = $1
        WHERE a.course_id = $2
        ORDER BY a.created_at DESC
      `;

      const assignments = await pool.query(assignmentsQuery, [
        studentId,
        course.id,
      ]);

      // Calculează media pentru acest curs
      let totalScore = 0;
      let totalMaxScore = 0;
      let gradedAssignments = 0;

      assignments.rows.forEach((assignment) => {
        if (assignment.score !== null) {
          totalScore += parseFloat(assignment.score);
          totalMaxScore += parseFloat(assignment.max_score);
          gradedAssignments++;
        }
      });

      const averagePercentage =
        totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : null;

      coursesWithGrades.push({
        courseId: course.id,
        courseName: course.course_name,
        teacher: `${course.teacher_first_name} ${course.teacher_last_name}`,
        assignments: assignments.rows,
        stats: {
          totalAssignments: assignments.rows.length,
          gradedAssignments: gradedAssignments,
          averageScore:
            averagePercentage !== null
              ? parseFloat(averagePercentage.toFixed(2))
              : null,
        },
      });
    }

    // Calculează media generală pentru toate cursurile
    let overallTotalScore = 0;
    let overallTotalMaxScore = 0;
    let overallGradedAssignments = 0;

    coursesWithGrades.forEach((course) => {
      course.assignments.forEach((assignment) => {
        if (assignment.score !== null) {
          overallTotalScore += parseFloat(assignment.score);
          overallTotalMaxScore += parseFloat(assignment.max_score);
          overallGradedAssignments++;
        }
      });
    });

    const overallAveragePercentage =
      overallTotalMaxScore > 0
        ? (overallTotalScore / overallTotalMaxScore) * 100
        : null;

    res.status(200).json({
      courses: coursesWithGrades,
      overallStats: {
        totalCourses: coursesWithGrades.length,
        totalAssignments: overallGradedAssignments,
        overallAverage:
          overallAveragePercentage !== null
            ? parseFloat(overallAveragePercentage.toFixed(2))
            : null,
      },
    });
  } catch (error) {
    console.error("Eroare la obținerea notelor:", error);
    res.status(500).json({
      message: "Eroare la obținerea notelor. Încercați din nou.",
    });
  }
};

// Obține notele unui student pentru un curs specific
export const getStudentGradesByCourse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const courseId = req.params.courseId;

    // Verificăm dacă studentul este înscris la acest curs
    const enrollmentCheck = await pool.query(
      "SELECT * FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
      [courseId, studentId]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({
        message: "Nu sunteți înscris la acest curs.",
      });
    }

    // Obținem detaliile cursului
    const courseQuery = `
      SELECT c.course_name, u.username as teacher_username, 
             p.first_name as teacher_first_name, p.last_name as teacher_last_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE c.id = $1
    `;

    const courseResult = await pool.query(courseQuery, [courseId]);

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        message: "Cursul nu a fost găsit.",
      });
    }

    const course = courseResult.rows[0];

    // Obținem toate temele și notele pentru acest curs
    const assignmentsQuery = `
      SELECT a.id, a.title, a.description, a.max_score, a.created_at,
             g.id as grade_id, g.score, g.comment, g.created_at as graded_at
      FROM assignments a
      LEFT JOIN grades g ON a.id = g.assignment_id AND g.student_id = $1
      WHERE a.course_id = $2
      ORDER BY a.created_at DESC
    `;

    const assignments = await pool.query(assignmentsQuery, [
      studentId,
      courseId,
    ]);

    // Calculează media pentru acest curs
    let totalScore = 0;
    let totalMaxScore = 0;
    let gradedAssignments = 0;

    assignments.rows.forEach((assignment) => {
      if (assignment.score !== null) {
        totalScore += parseFloat(assignment.score);
        totalMaxScore += parseFloat(assignment.max_score);
        gradedAssignments++;
      }
    });

    const averagePercentage =
      totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : null;

    res.status(200).json({
      course: {
        id: courseId,
        name: course.course_name,
        teacher: `${course.teacher_first_name} ${course.teacher_last_name}`,
      },
      assignments: assignments.rows,
      stats: {
        totalAssignments: assignments.rows.length,
        gradedAssignments: gradedAssignments,
        averageScore:
          averagePercentage !== null
            ? parseFloat(averagePercentage.toFixed(2))
            : null,
      },
    });
  } catch (error) {
    console.error("Eroare la obținerea notelor pentru curs:", error);
    res.status(500).json({
      message: "Eroare la obținerea notelor pentru curs. Încercați din nou.",
    });
  }
};

// Obține istoricul notelor pentru un student
export const getStudentGradeHistory = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Obținem istoricul notelor în ordine cronologică
    const gradeHistoryQuery = `
      SELECT g.id, g.score, g.comment, g.created_at as graded_at, 
             a.title as assignment_title, a.max_score,
             c.course_name, c.id as course_id
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE g.student_id = $1
      ORDER BY g.created_at DESC
    `;

    const gradeHistory = await pool.query(gradeHistoryQuery, [studentId]);

    if (gradeHistory.rows.length === 0) {
      return res.status(200).json({
        message: "Nu există note în istoric.",
        grades: [],
      });
    }

    // Adăugăm calculul procentajului pentru fiecare notă
    const gradesWithPercentage = gradeHistory.rows.map((grade) => {
      const percentage = (grade.score / grade.max_score) * 100;
      return {
        ...grade,
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });

    res.status(200).json({
      grades: gradesWithPercentage,
    });
  } catch (error) {
    console.error("Eroare la obținerea istoricului notelor:", error);
    res.status(500).json({
      message: "Eroare la obținerea istoricului notelor. Încercați din nou.",
    });
  }
};

// Obține statistici despre notele studentului
export const getStudentGradeStatistics = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Obținem toate notele studentului
    const gradesQuery = `
      SELECT g.score, a.max_score, a.course_id, c.course_name
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE g.student_id = $1
    `;

    const gradesResult = await pool.query(gradesQuery, [studentId]);

    if (gradesResult.rows.length === 0) {
      return res.status(200).json({
        message: "Nu există note pentru calculul statisticilor.",
        statistics: null,
      });
    }

    // Calculează statistici generale
    let totalScore = 0;
    let totalMaxScore = 0;
    const gradesByCourse = {};

    gradesResult.rows.forEach((grade) => {
      totalScore += parseFloat(grade.score);
      totalMaxScore += parseFloat(grade.max_score);

      // Grupează notele pe cursuri pentru statistici per curs
      if (!gradesByCourse[grade.course_id]) {
        gradesByCourse[grade.course_id] = {
          courseId: grade.course_id,
          courseName: grade.course_name,
          totalScore: 0,
          totalMaxScore: 0,
          grades: [],
        };
      }

      gradesByCourse[grade.course_id].totalScore += parseFloat(grade.score);
      gradesByCourse[grade.course_id].totalMaxScore += parseFloat(
        grade.max_score
      );
      gradesByCourse[grade.course_id].grades.push({
        score: parseFloat(grade.score),
        maxScore: parseFloat(grade.max_score),
        percentage: (grade.score / grade.max_score) * 100,
      });
    });

    // Calculează media generală
    const overallAverage = (totalScore / totalMaxScore) * 100;

    // Calculează mediile pentru fiecare curs
    const courseAverages = Object.values(gradesByCourse).map((course) => {
      const average = (course.totalScore / course.totalMaxScore) * 100;
      return {
        courseId: course.courseId,
        courseName: course.courseName,
        average: parseFloat(average.toFixed(2)),
        assignments: course.grades.length,
      };
    });

    // Sortează cursurile după medie (descrescător)
    courseAverages.sort((a, b) => b.average - a.average);

    // Calculează distribuția notelor (histogramă)
    const gradeDistribution = {
      "91-100": 0, // A
      "81-90": 0, // B
      "71-80": 0, // C
      "61-70": 0, // D
      "51-60": 0, // E
      "0-50": 0, // F
    };

    gradesResult.rows.forEach((grade) => {
      const percentage = (grade.score / grade.max_score) * 100;

      if (percentage >= 91) gradeDistribution["91-100"]++;
      else if (percentage >= 81) gradeDistribution["81-90"]++;
      else if (percentage >= 71) gradeDistribution["71-80"]++;
      else if (percentage >= 61) gradeDistribution["61-70"]++;
      else if (percentage >= 51) gradeDistribution["51-60"]++;
      else gradeDistribution["0-50"]++;
    });

    res.status(200).json({
      statistics: {
        overallAverage: parseFloat(overallAverage.toFixed(2)),
        totalAssignments: gradesResult.rows.length,
        courseAverages: courseAverages,
        gradeDistribution: gradeDistribution,
      },
    });
  } catch (error) {
    console.error("Eroare la obținerea statisticilor:", error);
    res.status(500).json({
      message: "Eroare la obținerea statisticilor. Încercați din nou.",
    });
  }
};
