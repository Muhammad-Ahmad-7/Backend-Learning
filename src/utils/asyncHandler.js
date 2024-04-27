const asyncHanlder = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

export { asyncHanlder };

// const asyncHanlder = () => {}
// const asyncHanlder = (fn) => () => {}
// const asyncHanlder = (fn) => {() => {}}

// const asyncHanlder = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       succes: false,
//       message: error.message,
//     });
//   }
// };

// function asyncHanlder(fn) {
//   Promise.resolve(fn()).catch((err) => {});
// }

// asyncHanlder(() => {
//     console.log("Hello ")
// });
