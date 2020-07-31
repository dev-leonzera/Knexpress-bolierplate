const { Router } = require('express')
const { celebrate, Joi } = require('celebrate')
//
const { User } = require('../models/')
const { AuthService } = require('../services')
const { authenticate } = require('../middlewares')
//
const router = Router()
//
module.exports = (routes) => {
    //
    routes.use('/auth', router)
    //
    router.post(
        '/register',
        celebrate({
            body: Joi.object().keys({
                name: Joi.string().trim().required(),
                email: Joi.string().email().trim().required(),
                password: Joi.string().required(),
            }),
        }),
        async (req, res, next) => {
            try {
                res.status(201).json({
                    status: 'success',
                    message: 'User registered!',
                    data: {
                        user: await new AuthService(User).signup(req.body)
                    },
                });
            } catch (err) {
                next(err)
            }
        }
    );
    //
    router.post(
        '/login',
        celebrate({
            body: Joi.object().keys({
                email: Joi.string().email().trim().required(),
                password: Joi.string().required(),
            }),
        }),
        async (req, res, next) => {
            try {
                const { accessToken, refreshToken } = await new AuthService(User).login(req.body)
                
                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: true,
                });

                res.status(200).json({
                    status: 'success',
                    message: 'User logged in!',
                    accessToken,
                })
            } catch (err) {
                next(err)
            }
        }
    ),
    //
    router.post('/token/refresh', (req, res, next) => {
        try {
          const { refreshToken } = req.cookies;
    
          if (!refreshToken) {
            const err = new Error('Unauthorized!');
            err.status = 401;
            throw err;
          }
    
          res.status(200).json({
            status: 'success',
            message: 'Token Generated!',
            accessToken: AuthService.refresh(refreshToken),
          });
        } catch (err) {
          next(err);
        }
      });
    
      router.post('/logout', authenticate, (req, res) => {
        res.clearCookie('refreshToken');
    
        res.status(200).json({
          status: 'success',
          message: 'Logged Out!',
        });
      });


}