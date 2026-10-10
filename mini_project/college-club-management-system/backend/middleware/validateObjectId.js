const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const validateObjectId = (parameterName) => (req, res, next) => {
  if (!OBJECT_ID_PATTERN.test(req.params[parameterName] || "")) {
    const label = parameterName === "id" ? "resource" : parameterName.replace(/Id$/, "");
    return res.status(400).json({
      success: false,
      message: `Invalid ${label} ID`,
    });
  }
  return next();
};

module.exports = validateObjectId;
