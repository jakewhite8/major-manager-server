# Role Based Server using JSON Web Tokens, Express, and MySQL
 


## Project setup
```
npm install
```

* Create a file /src/config/db.config.js that exports a json object with the following database information: 
```
module.exports = {
  HOST: 'localhost',
  DB: <database-name>,
  USER: <username>,
  PASSWORD: <password>,
  PORT: <port default is set to 3306>
};

```
* Create a file /src/config/auth.config.js that exports a json object with a secret key used by jsonwebtokens to create an access token
```
module.exports = {
  secret: '<secret-key>',
};

```

### Run
```
npm start
```
### Testing
* In order to run tests, a config file has to be made that stores a user's email and password 
/src/config/test.config.js:
```
module.exports = {
  email: <user email>,
  password: <user password>,
};

```
```
npm run test
```
### Linter
```
npm run lint
```
### Corresponding [Vue UI](https://github.com/jakewhite8/vue-vuex-vueRouter-jwt-ui)
