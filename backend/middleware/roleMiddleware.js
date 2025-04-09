export const isTeacher = (req, res, next) => {
  if (req.user && req.user.role === "teacher") {
    next();
  } else {
    return res.status(403).json({
      message: "Acces interzis. Această acțiune necesită rol de profesor.",
    });
  }
};

export const isStudent = (req, res, next) => {
  if (req.user && req.user.role === "student") {
    next();
  } else {
    return res.status(403).json({
      message: "Acces interzis. Această acțiune necesită rol de student.",
    });
  }
};
