<p align="center">
  <p align="center">Rank 👑</p>
</p>

![node-shield-image] ![mariadb-shield-image]

## Description

A bot that provides information about users inside the server.

## Installation

Launch

`npm i`

Create a `config.js` file in the root directory containing your discord bot credentials.

```js
module.exports = {
  TOKEN_PROD: "<Your Discord Bot Token Goes Here>"
  DB_CONFIG_PROD: {
    host: <The HOST your database is on>,
    user: <The USERNAME of the user in your database>,
    password: <The password of the user in your database> ,
    database: <The name of your database, i.e. rank>
  },
}
```

## Running

`npm run start`

## Supported commands

<p align="center">
  <img src="https://i.imgur.com/cUI4vNj.png">
  <p align="center">Find the top message writers in the server. The counter resets periodically, after each reset assigns special roles to the users.</p>
</p>
<br>
<p align="center">
  <img src="https://i.imgur.com/CEjUD7K.png">
  <p align="center">Find who's the least active in your server.</p>
</p>

[node-shield-image]: https://img.shields.io/static/v1?label=node&message=16.8.0&color=green
[mariadb-shield-image]: https://img.shields.io/static/v1?label=MariaDB&message=10.3.31&color=blue
