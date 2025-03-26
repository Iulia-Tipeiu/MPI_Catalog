import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Acces neautorizat. Token lipsă." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Eroare autentificare:", error.message);
    return res
      .status(401)
      .json({ message: "Acces neautorizat. Token invalid." });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Acces neautorizat." });
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Acces interzis. Nu aveți permisiunile necesare." });
    }
  };
};

export { auth, checkRole };
