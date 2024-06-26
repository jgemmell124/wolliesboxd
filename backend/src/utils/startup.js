import * as sandwichDao from '../daos/sandwichDao.js';
import * as userDao from '../daos/userDao.js';
import * as ratingDao from '../daos/ratingDao.js';
import { ROLES_ENUM } from '../utils/constants.js';

const populateDatabase = async () => {
  const users = [
    {
      username: 'admin',
      email: 'admin@bar.com',
      password: 'admin',
      name: 'admin',
      role: ROLES_ENUM.ADMIN,
      following: [],
      followers: [],
    },
    {
      username: 'employee',
      email: 'emp@bar.com',
      password: 'employee',
      name: 'employee',
      role: ROLES_ENUM.EMPLOYEE,
      following: [],
      followers: [],
    },
    {
      username: 'user',
      email: 'f43er@fdsaf.com',
      password: 'password',
      name: 'user',
      role: ROLES_ENUM.USER,
      following: [],
      followers: [],
    },
    {
      username: 'anotheruser',
      email: 'fdfafafa@fdsafsa.com',
      password: 'password',
      name: 'John Doe',
      role: ROLES_ENUM.USER,
      following: [],
      followers: [],
    },
    {
      username: 'yetanotheruser',
      email: 'fdfa@fdsafsa.com',
      password: 'password',
      name: 'Jane Doe',
      role: ROLES_ENUM.USER,
      following: [],
      followers: [],
    },
    {
      username: 'sandwichlover',
      email: 'fdfa33@ffdsafdsafsa.com',
      password: 'password',
      name: 'Bubble Bass',
      role: ROLES_ENUM.USER,
      following: [],
      followers: [],
    },
  ];
  const userIds = [];
  for (const user of users) {
    try {
      const u = await userDao.createUser(user);
      if (user.role === ROLES_ENUM.USER) {
        userIds.push(u._id);
      }
    } catch (err) {
      // probably a dupe
    }
  }

  const sandwiches = [
    {
      name: 'BLT',
      price: 7.99,
      ingredients: ['bacon', 'lettuce', 'tomato', 'mayo'],
      description: 'A classic sandwich with bacon, lettuce, tomato, and mayo',
    },
    {
      name: 'Turkey Club',
      price: 8.99,
      ingredients: ['turkey', 'bacon', 'lettuce', 'tomato', 'mayo'],
      description:
        'A classic club sandwich with turkey, bacon, lettuce, tomato, and mayo',
    },
    {
      name: 'Grilled Cheese',
      price: 5.99,
      ingredients: ['cheese', 'bread'],
      description: 'A classic grilled cheese sandwich with cheese and bread',
    },
    {
      name: 'PB&J',
      price: 4.99,
      ingredients: ['peanut butter', 'jelly', 'bread'],
      description:
        'A classic PB&J sandwich with peanut butter, jelly, and bread',
    },
  ];

  // this will prevent adding a bunch of repeat sandwiches
  if (userIds.length === 0) {
    return;
  };

  const sandwichIds = [];

  for (const sandwich of sandwiches) {
    try {
      const s = await sandwichDao.createSandwich(sandwich);
      sandwichIds.push(s._id);
    } catch (err) {
      // probably a dupe
    }
  }

  for (const userId of userIds) {
    for (const sandwichId of sandwichIds) {
      const rating = Math.floor(Math.random() * 5) + 1;
      const ratingObj = {
        sandwich_id: sandwichId,
        user_id: userId,
        rating,
        title: 'Wow this is great!',
        comment: 'This is a really descriptive review about some sandwich'
      };
      try {
        await ratingDao.createRating(ratingObj);
      } catch (err) {
        // probably a dupe
      }
    }
  }
};

export default populateDatabase;
