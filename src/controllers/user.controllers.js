import { asyncHanlder } from "../utils/asyncHandler.js";

const registerUser = asyncHanlder(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

export { registerUser };
