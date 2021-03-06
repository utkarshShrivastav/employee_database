const express = require("express");
const router = express.Router();
const User = require("../databases/User");
const Employee = require("../databases/Employee");
const bcrypt = require("bcryptjs");
const employeeController = require("../controller/employeeController");
const passport = require("passport");
const { ensureAuthenticated } = require("../config/Auth");

router.get("/", ensureAuthenticated, (req, res) => {
  Employee.find()
    .then((employee) => {
      res.render("profile",{employee});
    })
    .catch((err) => {
      console.log(err);
    });

});

router.get("/signin", (req, res) => {
  res.render("signin");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post("/user/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    req.flash("error_msg", "Please fill all fields...");
    res.redirect("/signup");
  } else {
    if (password.length < 7) {
      req.flash("error_msg", "Password should atleast have 7 characters...");
      res.redirect("/signup");
    } else {
      const newUser = new User({
        name,
        email,
        password,
      });

      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          console.log(err);
        } else {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              console.log(err);
            } else {
              User.findOne({ email }).then((user) => {
                if (user) {
                  req.flash("error_msg", "This email is already registered...");
                  res.redirect("/signup");
                } else {
                  newUser.password = hash;

                  newUser
                    .save()
                    .then(() => {
                      req.flash(
                        "success_msg",
                        "Registration Successfull! Please Login..."
                      );
                      res.redirect("/signin");
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                }
              });
            }
          });
        }
      });
    }
  }
});

router.post("/user/signin", (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash("error_msg", "Please fill all fields!!!");
    res.redirect("/signin");
  } else {
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/signin",
      failureFlash: true,
    })(req, res, next);
  }
});

router.post("/user/logout", (req, res) => {
  req.logOut();
  req.flash("success_msg", "You are logged out...");
  res.redirect("/signin");
});

router.get("/submit", ensureAuthenticated, (req, res) => {
  res.render("submitionForm");
});
router.get("/edit", ensureAuthenticated, (req, res) => {
  res.render("confirm");
});

router.post("/user/edit", (req, res) => {
  const { email, phone, department, editField, info } = req.body;
  console.log(req.body);
  if (!email || !phone || !department || !editField || !info) {
    req.flash("error_msg", "Please fill all fileds...");
    res.redirect("/edit");
  } else {
    Employee.findOne({ email }).then((user) => {
      if (user) {
        if (user.phone == phone && user.department === department) {
          if (editField === "first") {
            Employee.updateOne({email},{
              $set: {
                first: info,
              },
            })
              .then(() => {
                req.flash("success_msg", "Information updated...");
                res.redirect("/edit");
              })
              .catch((err) => {
                console.log(err);
              });
          } else if (editField === "last") {
            Employee.updateOne({email},{
              $set: {
                last: info,
              },
            })
              .then(() => {
                req.flash("success_msg", "Information updated...");
                res.redirect("/edit");
              })
              .catch((err) => {
                console.log(err);
              });
          } else if (editField === "phone") {
            Employee.updateOne({email},{
              $set: {
                phone: info,
              },
            })
              .then(() => {
                req.flash("success_msg", "Information updated...");
                res.redirect("/edit");
              })
              .catch((err) => {
                console.log(err);
              });
          } else {
            Employee.updateOne({email},{
              $set: {
                department: info,
              },
            })
              .then(() => {
                req.flash("success_msg", "Information updated...");
                res.redirect("/edit");
              })
              .catch((err) => {
                console.log(err);
              });
          }
        } else {
          req.flash("error_msg", "Given credentials does not match...");
          res.redirect("/edit");
        }
      } else {
        req.flash("error_msg", "This employee is not registered...");
        res.redirect("/edit");
      }
    });
  }
});

router.get("/delete", ensureAuthenticated, (req, res) => {
  res.render("delete");
});

router.post("/user/submitionForm", (req, res) => {
  const { first, last, email, phone, department } = req.body;
  console.log(req.body);
  if (!first || !last || !email || !phone || !department) {
    req.flash("error_msg", "Please fill all fields");
    res.redirect("/submit");
  } else {
    Employee.findOne({ email }).then((employee) => {
      if (employee) {
        req.flash("error_msg", "The employee already exists");
        res.redirect("/submit");
      } else {
        const newEmployee = new Employee({
          first,
          last,
          email,
          phone,
          department,
        });

        newEmployee
          .save()
          .then(() => {
            req.flash("success_msg", "Employee added");
            res.redirect("/submit");
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  }
});

router.post("/user/delete", (req, res) => {
  const { email, phone, department } = req.body;
  if (!email || !phone || !department) {
    req.flash("error_flash", "Please fill all fields...");
    res.redirect("/delete");
  } else {
    Employee.findOne({ email })
      .then((employee) => {
        if (employee) {
          if (employee.phone === phone && employee.department === department) {
            Employee.deleteOne({ email })
              .then(() => {
                req.flash("success_msg", "Data deleted successfully");
                res.redirect("/delete");
              })
              .catch((err) => {
                console.log(err);
              });
          } else {
            req.flash("error_msg", "Given credentials are incorrect...");
            res.redirect("/delete");
          }
        } else {
          req.flash("error_msg", "This emloyee is not registered...");
          res.redirect("/delete");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

router.get("/user/edit/:email",employeeController.getEditForm);
router.post("/user/edit/:email",employeeController.editEmployee);
module.exports = router;
