import express from 'express';
import userModel from '../models/userModel.js';
import { ROLES_ENUM } from '../utils/constants.js';
import * as userDao from '../daos/userDao.js';
import { getUserSession, setUserSession } from '../utils/session.js';

const router = express.Router();

router.get('/', async (req, res) => {
  // admin can see all users
  // employee can see all users except admin
  // everyone else can only see users with role 'user'

  const { role } = req.query;
  const session = getUserSession(req);

  const baseProjection = {
    password: 0,
    __v: 0,
  };

  const filter = role ? { role } : {};

  if (!session?.role || session.role === ROLES_ENUM.USER) {
    // TODO should users be able to see employees?
    filter.role = ROLES_ENUM.USER;
    Object.assign(baseProjection, {
      name: 0,
      email: 0,
      role: 0,
    });
  } else if (session.role === ROLES_ENUM.EMPLOYEE) {
    filter.role = {
      $in: [ROLES_ENUM.USER, ROLES_ENUM.EMPLOYEE],
    };
    Object.assign(baseProjection, {
      name: 0,
      email: 0,
    });
  } else if (session.role !== ROLES_ENUM.ADMIN) {
    console.log('session', session);
    // invalid role
    return res.status(403).send('Unauthorized');
  }

  try {
    const users = await userModel.find(filter, baseProjection);
    return res.json({ users, count: users.length }).status(200);
  } catch (err) {
    console.log(err);
    return res.status(400).send('Failed to get users');
  }
});

router.post('/', async (req, res) => {
  // only admin can create an account (for now)
  // const userSession = getUserSession(req);

  // if (userSession?.role !== ROLES_ENUM.ADMIN) {
  //   return res.sendStatus(401);
  // };

  const { username, email, password, name, role } = req.body;

  if (!username) {
    return res.status(400).send('Missing username');
  } else if (!email) {
    return res.status(400).send('Missing email');
  } else if (!password) {
    return res.status(400).send('Missing password');
  } else if (!name) {
    return res.status(400).send('Missing name');
  }

  // the provided role doesn't exist
  if (role && !ROLES_ENUM.ALL.includes(role)) {
    return res.status(400).send('Invalid role');
  }

  const newUser = {
    username,
    email,
    password,
    name,
    role: role ?? ROLES_ENUM.USER,
    followers: [],
    following: [],
  };

  try {
    const existingUser = await userDao.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).send('Username already in use');
    }
    const existingEmail = await userDao.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).send('Email already in use');
    }
    const user = await userDao.createUser(newUser);
    return res.status(201).json({ username, role: user.role, _id: user._id });
  } catch (err) {
    console.log(err);
    return res.status(400).send('Failed to create user');
  }
});

router.get('/:username', async (req, res) => {
  // admin can see all user info
  // user can see their own info
  // other users can only see username and _id
  const { username } = req.params;

  try {
    // find user in the database
    const user = await userDao.getUserByUsername(username);

    // don't show admins
    if (!user || user.role === ROLES_ENUM.ADMIN) {
      return res.status(404).send('User not found');
    }

    const userInfo = user.toObject();
    delete userInfo?.password;
    const userSession = getUserSession(req);

    if (
      userSession?.role === ROLES_ENUM.ADMIN ||
      userSession?.username === username
    ) {
      // admin can see all user info
      // user can see their own info
      // return info without password
      return res.json(userInfo).status(200);
    } else {
      // other users can only see username and _id
      return res.status(200).json({
        username: userInfo.username,
        _id: userInfo._id,
        name: userInfo.name,
        followers: userInfo.followers,
        following: userInfo.following,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send('Failed to get user');
  }
});

router.get('/id/:uid', async (req, res) => {
  // admin can see all user info
  // user can see their own info
  // other users can only see username and _id
  const { uid } = req.params;

  try {
    // find user in the database
    const user = await userDao.getUserById(uid);

    // don't show admins
    if (!user || user.role === ROLES_ENUM.ADMIN) {
      return res.status(404).send('User not found');
    }

    const userInfo = user.toObject();
    delete userInfo?.password;
    const userSession = getUserSession(req);

    if (userSession?.role === ROLES_ENUM.ADMIN || userSession?._id === uid) {
      // admin can see all user info
      // user can see their own info
      // return info without password
      return res.json(userInfo).status(200);
    } else {
      // other users can only see username and _id
      return res.status(200).json({
        username: userInfo.username,
        _id: userInfo._id,
        name: userInfo.name,
        followers: userInfo.followers,
        following: userInfo.following,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send('Failed to get user');
  }
});

router.put('/:uid', async (req, res) => {
  // admin can update any account
  // user can update their own account
  const { uid } = req.params;
  const { role, ...updateParams } = req.body;
  const updateKeys = Object.keys(updateParams);
  const updatingOnlyFollowersFollowing = !updateKeys.some(
    (key) => key !== 'following' && key !== 'followers'
  );

  const userSession = getUserSession(req);

  if (
    !userSession ||
    (userSession._id !== uid &&
      userSession.role !== ROLES_ENUM.ADMIN &&
      !updatingOnlyFollowersFollowing) // anyone can update a user if the only fields being updated are followers and/or following
  ) {
    return res.status(403).send('Unauthorized');
  }

  try {
    // only admin can update role
    if (userSession.role === ROLES_ENUM.ADMIN) {
      if (role && !ROLES_ENUM.ALL.includes(role)) {
        return res.status(400).send('Invalid role');
      } else if (role) {
        updateParams.role = role;
      }
    }
    await userDao.updateUser(uid, updateParams);
    const updatedUser = await userDao.getUserById(updateParams.uid ?? uid);

    // if the user is updating their own account, update the session
    if (userSession._id === uid) {
      const userInfo = setUserSession(req, updatedUser);
      return res.json(userInfo).status(200);
    } else {
      const user = await userDao.getUserById(updateParams.uid ?? uid);
      const userInfo = user?.toObject();
      delete userInfo?.password;
      return res.json(userInfo).status(200);
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send('Failed to update user');
  }
});

router.delete('/:uid', async (req, res) => {
  // admin can delete any account
  // user can delete their own account
  const { uid } = req.params;
  const userSession = getUserSession(req);

  if (
    !userSession ||
    (userSession._id !== uid && userSession.role !== ROLES_ENUM.ADMIN)
  ) {
    return res.status(403).send('Unauthorized');
  }
  try {
    // check if user exists first
    const foundUser = await userDao.getUserById(uid);
    if (!foundUser) {
      return res.status(404).send(`User with id ${uid} does not exist`);
    } else {
      await userDao.deleteUser(uid);
      // if a user deletes itself
      if (userSession._id === uid) {
        req.session.destroy();
      }
      return res.status(202).send('User deleted');
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send('Failed to delete user');
  }
});

router.get('/id/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // find user in the database
    const user = await userDao.getUserById(id);

    const userInfo = user.toObject();
    delete userInfo?.password;
    const userSession = getUserSession(req);

    if (userSession?.role === ROLES_ENUM.ADMIN || userSession?._id === id) {
      // admin can see all user info
      // user can see their own info
      // return info without password
      return res.json(userInfo).status(200);
    } else {
      // other users can only see username and _id
      return res.status(200).json({
        username: userInfo.username,
        _id: userInfo._id,
        name: userInfo.name,
        followers: userInfo.followers,
        following: userInfo.following,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send('Failed to get user');
  }
});

export default router;
