import validator from 'validatorjs';
import Sequelize from 'sequelize';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import app from '../server';
import model from '../models';
import Mailer from '../services/mail-service';

dotenv.load();
const Users = model.User;

// compliance rule for user input
const newUserRules = {
  email: 'required|email',
  username: 'required|string|min:3|max:16',
  password: 'required|min:6',
  confirmPassword: 'required|min:6',
  isAdmin: 'boolean'
};

const existingUserRules = {
  email: 'required|email',
  password: 'required'
};

/**
 *
 */
export default class UserController {
  /**
   *
   * @param {*} req
   * @param {*} res
   * @return {json} returns ststus and message
   */
  static create(req, res) {
    const { Op } = Sequelize;
    const validate = new validator(req.body, newUserRules);
    // check for user input compliance
    if (validate.passes()) {
      // check if user with email or username already exists
      return Users.findAll({
        where: {
          [Op.or]: [
            {
              email: req.body.email
            },
            {
              username: req.body.username
            }
          ]
        }
      }).then((users) => {
        if (users.length > 0) {
          res.status(400).json({
            message: 'email or username already taken' // to return this if user exists
          });
        } else if (req.body.password !== req.body.confirmPassword) {
          return res.status(400).json({ message: 'Passwords do not match' });
        } else {
          const newPassword = bcrypt.hashSync(req.body.password, 10); // hash password
          return Users.create({
            email: req.body.email,
            username: req.body.username,
            password: newPassword,
            isAdmin: Boolean(req.body.isAdmin) || false
          }).then((user) => {
            const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '7d' });
            const message = `<p>Welcome ${user.username}.</p><br/>
                            <p>Click the link below to complete your registration</p><br />
                            <a href="http://event-manager-andela.herokuapp.com/verified?token=${token}">Complete Registration</a><br/>
                            `;
            const mailBody = {
              from: 'matthews.segunapp@gmail.com',
              to: user.email,
              subject: 'Welcome to EventsManager',
              html: message
            };
            const mailer = new Mailer();
            if (mailer.isMailSent(mailBody)) {
              res.status(500).json({
                message: 'Oops!, an error has occured',
                statusCode: 500
              });
            } else {
              res.status(201).json({
                message: 'User registration successfull. An email has been sent for verification',
                userDetails: user,
                statusCode: 201
              });
            }
          }).catch(err => res.status(500).json({ message: 'Oops!, an error has occured', error: err, statusCode: 500 }));
        }
      }).catch(err => res.status(500).json({ message: 'Oops!, an error has occured', error: err, statusCode: 500 }));
    }
    return res.status(400).json({ message: validate.errors }); // to record this if validation fails
  }

  /**
   *
   * @param {*} req
   * @param {*} res
   * @return {json} returns user object of authnticated user
   */
  static authenticate(req, res) {
    const validate = new validator(req.body, existingUserRules);
    console.log('users', Users);
    // check validation compliance
    if (validate.passes()) {
      return Users.findOne({
        where: {
          email: req.body.email // check email availabilty
        },
      }).then((user) => {
        if (!user) {
          return res.status(400).json({ message: 'Invalid Login Credentials' }); // to retun this if user does not exist
        }
        if (!bcrypt.compareSync(req.body.password, user.password)) {
          return res.status(400).json({ message: 'Invalid Password' });
        }
        // encode user info to geerated token
        const token =
        jwt.sign({
          id: user.id,
          isAdmin: user.isAdmin,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified
        }, process.env.SECRET_KEY, { expiresIn: '1d' });
        res.status(200).json({ message: 'Authentication Is Successful!', userDetails: user, Token: token });
      }).catch(err => res.status(500).json({
        message: 'Oops!, an error has occured',
        error: err.name
      }));
    }

    res.status(400).json({ message: validate.errors.first('email') });
  }

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns {*} authenticates user after registration
   */
  static completeRegistration(req, res) {
    return Users.findOne({
      where: {
        id: req.decoded.id
      }
    }).then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User does not exist' });
      }

      if (user.isVerified === true) {
        res.status(400).json({ message: 'User is already verified' });
      } else {
        user.update({
          isVerified: true
        }).then(() => {
          const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.SECRET_KEY, { expiresIn: '1d' });
          res.status(200).json({ message: 'Welcome to Event Manager', user: user.username, Token: token });
        }).catch(err => res.status(500).json({
          message: 'Oops!, an error has occured',
          error: err.name
        }));
      }
    }).catch(err => res.status(500).json({
      message: 'Oops!, an error has occured',
      error: err.name
    }));
  }

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns {json} returns all users
   */
  static getUsers(req, res) {
    return Users.findAll().then((users) => {
      res.status(200).json(users);
    }).catch(err => res.status(500).json({
      message: 'Oops!, an error has occured',
      error: err.name
    }));
  }


  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns {json} returns message object id deletion is successful
   */
  static delete(req, res) {
    // to check if user is an admin
    if (req.decoded.isAdmin === true) {
      return Users.findById(req.params.userId)
        .then((user) => {
          if (!user) {
            return res.status(404).json({
              message: 'User does not exist',
            });
          }
          user.destroy()
          // to return this center is deleted successfully
            .then(() => res.status(200).json({ message: 'User is successfully  deleted' }))
            .catch(error => res.status(400).json(error));
        })
        .catch(error => res.status(400).json(error));
    }
  }

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns {json} returns message object id deletion is successful
   */
  static resetPasswordRequest(req, res) {
    return Users.findOne({
      where: {
        email: req.body.email
      }
    })
      .then((user) => {
        if (user) {
          const token = jwt.sign({ id: user.id, email: user.email }, process.env.SECRET_KEY, { expiresIn: '15m' });
          const message = `<p>Welcome ${user.username}.</p><br/>
          <p>Click the link below to reset your password</p><br />
          <a href="http://event-manager-andela.herokuapp.com/reset-password?token=${token}">Reset Password</a><br/>
          This link expires in 15 mins`;
          const mailBody = {
            from: 'matthews.segunapp@gmail.com',
            to: user.email,
            subject: 'Password Reset Link',
            html: message
          };
          const mailer = new Mailer();
          if (mailer.isMailSent(mailBody)) {
            res.status(500).json({
              message: 'Oops!, an error has occured',
              statusCode: 500
            });
          } else {
            res.status(200).json({
              message: 'Password reset link is sent',
              statusCode: 200
            });
          }
        }
      })
      .catch(err => res.status(500).json({
        message: 'Oops!, an error has occured',
        error: err.name
      }));
  }

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns {json} returns message object id deletion is successful
   */
  static resetPassword(req, res) {
    return Users.findOne({
      where: {
        email: req.decoded.email
      }
    })
      .then((user) => {
        user.update({
          password: bcrypt.hashSync(req.body.password, 10)
        })
          .then(() => {
            res.status(200).json({
              message: 'Password reset successful. Now redirecting....'
            });
          })
          .catch(err => res.status(500).json({
            message: 'Oops!, an error has occured',
            error: err.name
          }));
      })
      .catch(err => res.status(500).json({
        message: 'Oops!, an error has occured',
        error: err.name
      }));
  }
}
