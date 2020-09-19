# Major Manager Server
### Role Based Server using JSON Web Tokens, Express, and MySQL
 


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
* Create Roles
    * This is a role based application. As a result, one needs to initialize the roles that the system will be using when first creating the application
    * Uncomment the following section found in /app.js. Create your desired roles within the initializeRoleTable function and start the server (remove the code after running once):
```
// Add roles to the role table
const db = require('./src/models');

const Role = db.role;
initializeRoleTable();

function initializeRoleTable() {
  Role.create('user')
  Role.create('moderator')
  Role.create('admin')
}
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
